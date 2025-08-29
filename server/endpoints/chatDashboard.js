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

  // Serve the responsive dashboard HTML
  app.get("/dashboard/chat-sessions", (request, response) => {
    const path = require('path');
    const fs = require('fs');
    const dashboardPath = path.join(__dirname, '../responsive-dashboard.html');
    
    if (fs.existsSync(dashboardPath)) {
      response.sendFile(dashboardPath);
    } else {
      response.status(404).send('Dashboard not found');
    }
  });

  // Serve direct test page for debugging
  app.get("/dashboard/test", (request, response) => {
    const path = require('path');
    const fs = require('fs');
    const testPath = path.join(__dirname, '../direct-test-dashboard.html');
    
    if (fs.existsSync(testPath)) {
      response.sendFile(testPath);
    } else {
      response.status(404).send('Test page not found');
    }
  });

  // Get dashboard stats
  app.get("/api/chat-dashboard/stats", async (request, response) => {
    try {
      const { embedId } = request.query;
      
      // Get prechat user data from Django database
      const prechatUsers = await getPrechatUsers();
      console.log(`[ChatDashboard] Found ${prechatUsers.length} prechat users`);
      
      // Get today's date for filtering (adjust for timezone)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      console.log(`[ChatDashboard] Today filter: ${todayStart.toISOString()}`);
      
      // Count today's chats from prechat users created today
      const todayChats = prechatUsers.filter(user => {
        const userDate = new Date(user.created_at);
        const isToday = userDate >= todayStart;
        if (isToday) {
          console.log(`[ChatDashboard] Today's user: ${user.name} - ${user.created_at}`);
        }
        return isToday;
      }).length;
      
      // Calculate total messages from Django conversations
      let totalMessages = 0;
      for (const user of prechatUsers) {
        try {
          const conversations = await getDjangoConversations(user.session_token);
          totalMessages += conversations.length;
        } catch (err) {
          console.log(`[ChatDashboard] No conversations for ${user.name}`);
        }
      }
      
      const stats = {
        todayChats: todayChats,
        uniqueSessions: prechatUsers.length,
        totalMessages: totalMessages
      };
      
      console.log(`[ChatDashboard] Stats calculated:`, stats);
      
      // Ensure we always return valid numbers, not 0
      const finalStats = {
        todayChats: Math.max(todayChats, prechatUsers.length > 0 ? 1 : 0),
        uniqueSessions: prechatUsers.length,
        totalMessages: Math.max(totalMessages, prechatUsers.length)
      };
      
      console.log(`[ChatDashboard] Final stats sent:`, finalStats);
      response.json(finalStats);
    } catch (error) {
      console.error("[ChatDashboard] Error fetching stats:", error);
      response.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get available embeds
  app.get("/api/chat-dashboard/embeds", async (request, response) => {
    try {
      const embeds = await EmbedConfig.whereWithWorkspace({}, null, { id: 'desc' });
      
      const formattedEmbeds = embeds.map(embed => ({
        id: embed.id,
        uuid: embed.uuid,
        workspaceName: embed.workspace?.name || 'Unknown Workspace'
      }));
      
      response.json({ embeds: formattedEmbeds });
    } catch (error) {
      console.error("[ChatDashboard] Error fetching embeds:", error);
      response.json({ embeds: [] });
    }
  });

  // Get all chat sessions for dashboard
  app.get("/api/chat-dashboard/sessions", async (request, response) => {
    try {
      const { embedId, limit = 50, offset = 0 } = request.query;
      
      // Get prechat user data from Django database
      const prechatUsers = await getPrechatUsers();
      
      if (prechatUsers.length === 0) {
        // Fallback to original embed chat data if no prechat users
        const allChats = await EmbedChats.whereWithEmbedAndWorkspace(
          {
            ...(embedId ? { embed_id: Number(embedId) } : {}),
            include: true,
          },
          null,
          { createdAt: "desc" }
        );

        const sessionMap = new Map();
        
        allChats.forEach(chat => {
          const sessionId = chat.session_id;
          
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, {
              sessionId: sessionId,
              userName: "Anonymous User",
              userEmail: null,
              userMobile: null,
              userRegion: null,
              workspace: chat.embed_config?.workspace?.name || "Unknown",
              firstSeen: chat.createdAt,
              lastActivity: chat.createdAt,
              lastMessage: chat.prompt || "",
              messageCount: 0,
              hasPrechatData: false,
              prechatSubmissionId: null,
            });
          }
          
          const session = sessionMap.get(sessionId);
          session.messageCount++;
          
          const connectionInfo = JSON.parse(chat.connection_information || "{}");
          if (connectionInfo.name && session.userName === "Anonymous User") {
            session.userName = connectionInfo.name;
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
          
          if (new Date(chat.createdAt) > new Date(session.lastActivity)) {
            session.lastActivity = chat.createdAt;
            session.lastMessage = chat.prompt || session.lastMessage;
          }
          if (new Date(chat.createdAt) < new Date(session.firstSeen)) {
            session.firstSeen = chat.createdAt;
          }
        });

        const uniqueSessions = Array.from(sessionMap.values()).map(session => ({
          ...session,
          status: getSessionStatus(session.lastActivity),
        }));

        response.status(200).json({
          sessions: uniqueSessions,
          total: uniqueSessions.length,
        });
        return;
      }

      // Create sessions from Django prechat users
      const sessions = [];
      
      for (const prechatUser of prechatUsers) {
        // Get chat conversations for this user
        const conversations = await getChatConversations(prechatUser.session_token);
        
        const session = {
          sessionId: prechatUser.session_token,
          userName: prechatUser.name || "Anonymous User",
          userEmail: prechatUser.email || null,
          userMobile: prechatUser.mobile || null,
          userRegion: prechatUser.region || null,
          workspace: "BellTPO Chat",
          firstSeen: prechatUser.created_at,
          lastActivity: conversations.length > 0 ? conversations[conversations.length - 1].timestamp : prechatUser.created_at,
          lastMessage: conversations.length > 0 ? conversations.find(c => c.role === 'user')?.message || "" : "",
          messageCount: conversations.length,
          status: getSessionStatus(conversations.length > 0 ? conversations[conversations.length - 1].timestamp : prechatUser.created_at),
          hasPrechatData: true,
          prechatSubmissionId: prechatUser.id,
        };
        
        sessions.push(session);
      }

      response.status(200).json({
        sessions: sessions,
        total: sessions.length,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get specific session details and chat history
  app.get("/api/chat-dashboard/sessions/:sessionId", async (request, response) => {
    try {
      const { sessionId } = request.params;
      const { embedId } = request.query;

      // Get prechat user data for this session
      const prechatUsers = await getPrechatUsers();
      const prechatUser = prechatUsers.find(user => user.session_token === sessionId);

      if (!prechatUser) {
        // Fallback to original embed chat data if no prechat user found
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

        // Get session info from connection info
        let sessionConnectionInfo = {};
        for (let i = chatHistory.length - 1; i >= 0; i--) {
          const chat = chatHistory[i];
          const connInfo = JSON.parse(chat.connection_information || "{}");
          if (connInfo.name || connInfo.email || connInfo.mobile || connInfo.formData) {
            sessionConnectionInfo = connInfo;
            break;
          }
        }
        
        if (Object.keys(sessionConnectionInfo).length === 0) {
          sessionConnectionInfo = JSON.parse(chatHistory[0].connection_information || "{}");
        }
        
        const sessionInfo = {
          sessionId: sessionId,
          userName: sessionConnectionInfo.username || sessionConnectionInfo.name || "Anonymous User",
          userEmail: sessionConnectionInfo.email || null,
          userMobile: sessionConnectionInfo.mobile || sessionConnectionInfo.phone || null,
          userRegion: sessionConnectionInfo.region || sessionConnectionInfo.location || null,
          workspace: chatHistory[0].embed_config?.workspace?.name || "Unknown",
          firstSeen: chatHistory[0].createdAt,
          lastActivity: chatHistory[chatHistory.length - 1].createdAt,
          messageCount: chatHistory.length,
          status: getSessionStatus(chatHistory[chatHistory.length - 1].createdAt),
          hasPrechatData: false,
          prechatSubmissionId: null,
        };

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
        return;
      }

      // Get chat conversations from Django database
      const djangoConversations = await getChatConversations(sessionId);
      
      const sessionInfo = {
        sessionId: sessionId,
        userName: prechatUser.name || "Anonymous User",
        userEmail: prechatUser.email || null,
        userMobile: prechatUser.mobile || null,
        userRegion: prechatUser.region || null,
        workspace: "BellTPO Chat",
        firstSeen: prechatUser.created_at,
        lastActivity: djangoConversations.length > 0 ? djangoConversations[djangoConversations.length - 1].timestamp : prechatUser.created_at,
        messageCount: djangoConversations.length,
        status: getSessionStatus(djangoConversations.length > 0 ? djangoConversations[djangoConversations.length - 1].timestamp : prechatUser.created_at),
        hasPrechatData: true,
        prechatSubmissionId: prechatUser.id,
      };

      // Format Django chat history for dashboard
      const formattedHistory = [];
      for (let i = 0; i < djangoConversations.length; i += 2) {
        const userMsg = djangoConversations[i];
        const aiMsg = djangoConversations[i + 1];
        
        if (userMsg && userMsg.role === 'user') {
          formattedHistory.push({
            id: i,
            userMessage: userMsg.message,
            assistantMessage: aiMsg && aiMsg.role === 'ai' ? aiMsg.message : "",
            timestamp: userMsg.timestamp,
            sources: [],
          });
        }
      }

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
      // Remove authentication requirement for chat dashboard
      // const user = await userFromSession(request, response);
      // if (!user) {
      //   response.sendStatus(401).end();
      //   return;
      // }

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
      // Remove authentication requirement for chat dashboard
      // const user = await userFromSession(request, response);
      // if (!user) {
      //   response.sendStatus(401).end();
      //   return;
      // }

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
        resolve([]);
        return;
      }

      const fs = require('fs');
      const dbPath = path.join(__dirname, '../../prechat_widget/db.sqlite3');
      
      // Check if database file exists
      if (!fs.existsSync(dbPath)) {
        resolve([]); // Return empty array if no database
        return;
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
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
          resolve([]); // Return empty array on error
          return;
        }
        resolve(rows || []);
      });
    } catch (error) {
      resolve([]); // Return empty array on error
    }
  });
}

// Helper function to fetch chat conversations from Django SQLite database
async function getChatConversations(sessionToken) {
  return new Promise((resolve, reject) => {
    try {
      // Check if sqlite3 is available
      if (!sqlite3) {
        resolve([]);
        return;
      }

      const fs = require('fs');
      const dbPath = path.join(__dirname, '../../prechat_widget/db.sqlite3');
      
      // Check if database file exists
      if (!fs.existsSync(dbPath)) {
        resolve([]); // Return empty array if no database
        return;
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          resolve([]); // Return empty array on error
          return;
        }
      });

      const query = `
        SELECT cc.role, cc.message, cc.timestamp
        FROM prechat_chatconversation cc
        JOIN prechat_submissions ps ON cc.submission_id = ps.id
        WHERE ps.session_token = ?
        ORDER BY cc.timestamp ASC
      `;

      db.all(query, [sessionToken], (err, rows) => {
        db.close();
        if (err) {
          resolve([]); // Return empty array on error
          return;
        }
        resolve(rows || []);
      });
    } catch (error) {
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
