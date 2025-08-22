const { reqBody, multiUserMode, userFromSession } = require("../utils/http");
const { EmbedChats } = require("../models/embedChats");
const { EmbedConfig } = require("../models/embedConfig");

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
      
      // Get unique sessions with user details
      const sessions = await EmbedChats.whereWithEmbedAndWorkspace(
        {
          ...(embedId ? { embed_id: Number(embedId) } : {}),
          include: true,
        },
        Number(limit),
        { createdAt: "desc" },
        Number(offset)
      );

      // Group by session_id and get latest info for each session
      const sessionMap = new Map();
      
      sessions.forEach(chat => {
        const sessionId = chat.session_id;
        if (!sessionMap.has(sessionId) || new Date(chat.createdAt) > new Date(sessionMap.get(sessionId).lastActivity)) {
          const connectionInfo = JSON.parse(chat.connection_information || "{}");
          sessionMap.set(sessionId, {
            sessionId: sessionId,
            userName: connectionInfo.username || "Anonymous User",
            userEmail: connectionInfo.email || null,
            userMobile: connectionInfo.mobile || null,
            userRegion: connectionInfo.region || null,
            workspace: chat.embed_config?.workspace?.name || "Unknown",
            firstSeen: chat.createdAt,
            lastActivity: chat.createdAt,
            status: getSessionStatus(chat.createdAt),
            messageCount: 1,
            lastMessage: chat.prompt || "No message",
          });
        } else {
          // Update message count
          sessionMap.get(sessionId).messageCount += 1;
        }
      });

      const uniqueSessions = Array.from(sessionMap.values());

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

      // Get session info from first chat
      const firstChat = chatHistory[0];
      const connectionInfo = JSON.parse(firstChat.connection_information || "{}");
      
      const sessionInfo = {
        sessionId: sessionId,
        userName: connectionInfo.username || "Anonymous User",
        userEmail: connectionInfo.email || null,
        userMobile: connectionInfo.mobile || null,
        userRegion: connectionInfo.region || null,
        workspace: firstChat.embed_config?.workspace?.name || "Unknown",
        firstSeen: firstChat.createdAt,
        lastActivity: chatHistory[chatHistory.length - 1].createdAt,
        messageCount: chatHistory.length,
        status: getSessionStatus(chatHistory[chatHistory.length - 1].createdAt),
      };

      // Format chat history
      const formattedHistory = chatHistory.map(chat => {
        const responseData = JSON.parse(chat.response || "{}");
        return {
          id: chat.id,
          type: "conversation",
          userMessage: chat.prompt,
          assistantMessage: responseData.text || "",
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
