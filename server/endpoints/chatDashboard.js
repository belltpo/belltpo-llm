const { reqBody, multiUserMode, userFromSession } = require("../utils/http");
const { EmbedChats } = require("../models/embedChats");
const { EmbedConfig } = require("../models/embedConfig");
const path = require('path');

// Try to load sqlite3, fallback gracefully if not available
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.warn('[ChatDashboard] sqlite3 not available, prechat user integration disabled:', error.message);
  sqlite3 = null;
}

function chatDashboardEndpoints(app) {
  if (!app) return;

  // Get all chat sessions for dashboard
  app.get("/chat-dashboard/sessions", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const { embedId, limit = 50, offset = 0 } = request.query;
      
      // Get all chats with embed and workspace info
      const allChats = await EmbedChats.whereWithEmbedAndWorkspace(
        {
          ...(embedId ? { embed_id: Number(embedId) } : {}),
          include: true,
        },
        null,
        { createdAt: "desc" }
      );

      // Get prechat user data from Django SQLite database
      const prechatUsers = await getPrechatUsers();
      const prechatUserMap = new Map();
      prechatUsers.forEach(user => {
        if (user.session_token) {
          prechatUserMap.set(user.session_token, user);
        }
      });

      // Group by session_id and get session details
      const sessionMap = new Map();
      
      allChats.forEach(chat => {
        const sessionId = chat.session_id;
        const connectionInfo = JSON.parse(chat.connection_information || "{}");
        
        // Check if we have prechat user data for this session
        const prechatUser = prechatUserMap.get(sessionId);
        
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            sessionId: sessionId,
            // Prioritize prechat form data over connection info
            userName: prechatUser?.name || connectionInfo.username || connectionInfo.name || "Anonymous User",
            userEmail: prechatUser?.email || connectionInfo.email || null,
            userMobile: prechatUser?.mobile || connectionInfo.mobile || connectionInfo.phone || null,
            userRegion: prechatUser?.region || connectionInfo.region || connectionInfo.location || null,
            workspace: chat.embed_config?.workspace?.name || "Unknown",
            firstSeen: prechatUser?.created_at || chat.createdAt,
            lastActivity: chat.createdAt,
            messageCount: 1,
            lastMessage: chat.prompt || "No message",
            hasPrechatData: !!prechatUser,
            prechatSubmissionId: prechatUser?.id || null,
          });
        } else {
          // Update session info with latest activity
          const session = sessionMap.get(sessionId);
          session.messageCount += 1;
          
          // Update user details if this chat has more complete information
          if (!session.hasPrechatData) {
            if (connectionInfo.name && !session.userName.includes("Anonymous")) {
              session.userName = connectionInfo.username || connectionInfo.name;
            }
            if (connectionInfo.email && !session.userEmail) {
              session.userEmail = connectionInfo.email;
            }
            if ((connectionInfo.mobile || connectionInfo.phone) && !session.userMobile) {
              session.userMobile = connectionInfo.mobile || connectionInfo.phone;
            }
            if ((connectionInfo.region || connectionInfo.location) && !session.userRegion) {
              session.userRegion = connectionInfo.region || connectionInfo.location;
            }
          }
          
          if (new Date(chat.createdAt) > new Date(session.lastActivity)) {
            session.lastActivity = chat.createdAt;
            session.lastMessage = chat.prompt || session.lastMessage;
          }
          if (new Date(chat.createdAt) < new Date(session.firstSeen)) {
            session.firstSeen = chat.createdAt;
          }
        }
      });

      // Add status to each session
      const uniqueSessions = Array.from(sessionMap.values()).map(session => ({
        ...session,
        status: getSessionStatus(session.lastActivity),
      }));

      response.status(200).json({
        sessions: uniqueSessions,
        total: uniqueSessions.length,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get specific session details and chat history
  app.get("/chat-dashboard/sessions/:sessionId", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const { sessionId } = request.params;
      const { embedId } = request.query;

      // Get chat history for this session
      const chatHistory = await EmbedChats.whereWithEmbedAndWorkspace(
        {
          session_id: sessionId,
          ...(embedId ? { embed_id: Number(embedId) } : {}),
          include: true,
        },
        null,
        { createdAt: "asc" }
      );

      if (chatHistory.length === 0) {
        response.status(404).json({ error: "Session not found" });
        return;
      }

      // Get prechat user data for this session
      const prechatUsers = await getPrechatUsers();
      const prechatUser = prechatUsers.find(user => user.session_token === sessionId);

      // Get session info from the most recent chat with user data, fallback to first chat
      let sessionConnectionInfo = {};
      
      // Look for the most recent chat with user details
      for (let i = chatHistory.length - 1; i >= 0; i--) {
        const chat = chatHistory[i];
        const connInfo = JSON.parse(chat.connection_information || "{}");
        if (connInfo.name || connInfo.email || connInfo.mobile || connInfo.formData) {
          sessionConnectionInfo = connInfo;
          break;
        }
      }
      
      // If no user details found, use first chat's connection info
      if (Object.keys(sessionConnectionInfo).length === 0) {
        sessionConnectionInfo = JSON.parse(chatHistory[0].connection_information || "{}");
      }
      
      const sessionInfo = {
        sessionId: sessionId,
        // Prioritize prechat form data over connection info
        userName: prechatUser?.name || sessionConnectionInfo.username || sessionConnectionInfo.name || "Anonymous User",
        userEmail: prechatUser?.email || sessionConnectionInfo.email || null,
        userMobile: prechatUser?.mobile || sessionConnectionInfo.mobile || sessionConnectionInfo.phone || null,
        userRegion: prechatUser?.region || sessionConnectionInfo.region || sessionConnectionInfo.location || null,
        workspace: chatHistory[0].embed_config?.workspace?.name || "Unknown",
        firstSeen: prechatUser?.created_at || chatHistory[0].createdAt,
        lastActivity: chatHistory[chatHistory.length - 1].createdAt,
        messageCount: chatHistory.length,
        status: getSessionStatus(chatHistory[chatHistory.length - 1].createdAt),
        hasPrechatData: !!prechatUser,
        prechatSubmissionId: prechatUser?.id || null,
      };

      // Format chat history - create proper conversation pairs
      const formattedHistory = chatHistory.map(chat => {
        const responseData = JSON.parse(chat.response || "{}");
        return {
          id: chat.id,
          userMessage: chat.prompt,
          assistantMessage: responseData.text || responseData.response || "",
          timestamp: chat.createdAt,
          sources: responseData.sources || [],
        };
      });

      response.status(200).json({
        sessionInfo,
        chatHistory: formattedHistory,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get dashboard statistics
  app.get("/chat-dashboard/stats", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const { embedId } = request.query;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const whereClause = {
        ...(embedId ? { embed_id: Number(embedId) } : {}),
        include: true,
      };

      // Get various statistics
      const [
        totalChats,
        todayChats,
        yesterdayChats,
        weekChats,
      ] = await Promise.all([
        EmbedChats.count(whereClause),
        EmbedChats.count({ ...whereClause, createdAt: { gte: today } }),
        EmbedChats.count({
          ...whereClause,
          createdAt: { gte: yesterday, lt: today },
        }),
        EmbedChats.count({ ...whereClause, createdAt: { gte: weekAgo } }),
      ]);

      // Get unique sessions count
      const allChats = await EmbedChats.where(whereClause);
      const uniqueSessions = new Set(allChats.map(chat => chat.session_id)).size;

      response.status(200).json({
        totalChats,
        todayChats,
        yesterdayChats,
        weekChats,
        uniqueSessions,
        activeSessionsToday: todayChats > 0 ? Math.ceil(todayChats / 3) : 0, // Estimate active sessions
        growthRate: yesterdayChats > 0 ? ((todayChats - yesterdayChats) / yesterdayChats * 100).toFixed(1) : 0,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get available embed configurations for filtering
  app.get("/chat-dashboard/embeds", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const embeds = await EmbedConfig.whereWithWorkspace({}, null, {
        id: "desc",
      });

      response.status(200).json({
        embeds: embeds.map(embed => ({
          id: embed.id,
          uuid: embed.uuid,
          workspaceName: embed.workspace?.name,
          enabled: embed.enabled,
          createdAt: embed.createdAt,
        })),
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

// Helper function to fetch prechat users from Django SQLite database
async function getPrechatUsers() {
  return new Promise((resolve, reject) => {
    try {
      // Check if sqlite3 is available
      if (!sqlite3) {
        console.log('sqlite3 not available, returning empty prechat users');
        resolve([]);
        return;
      }

      const fs = require('fs');
      const dbPath = path.join(__dirname, '../../prechat_widget/db.sqlite3');
      
      // Check if database file exists
      if (!fs.existsSync(dbPath)) {
        console.log('Django SQLite database not found at:', dbPath);
        resolve([]); // Return empty array if no database
        return;
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening Django database:', err);
          resolve([]); // Return empty array on error
          return;
        }
      });

      const query = `
        SELECT id, name, email, mobile, region, session_token, created_at, updated_at
        FROM prechat_submissions
        ORDER BY created_at DESC
      `;

      db.all(query, [], (err, rows) => {
        db.close();
        if (err) {
          console.error('Database query error:', err);
          resolve([]); // Return empty array on error
          return;
        }
        resolve(rows || []);
      });
    } catch (error) {
      console.error('Error fetching prechat users:', error);
      resolve([]); // Return empty array on error
    }
  });
}

// Helper function to determine session status based on last activity
function getSessionStatus(lastActivity) {
  if (!lastActivity) return "offline";
  
  const now = new Date();
  const diffMinutes = (now - new Date(lastActivity)) / (1000 * 60);
  
  if (diffMinutes < 5) return "online";
  if (diffMinutes < 30) return "away";
  return "offline";
}

module.exports = { chatDashboardEndpoints };
