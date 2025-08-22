const { reqBody, multiUserMode, userFromSession } = require("../utils/http");
const { EmbedChats } = require("../models/embedChats");
const { EmbedConfig } = require("../models/embedConfig");
const { SystemSettings } = require("../models/systemSettings");

function dashboardEndpoints(app) {
  if (!app) return;

  // Get all chat sessions for dashboard
  app.get("/dashboard/sessions", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const { embedId, limit = 50, offset = 0 } = request.query;
      const sessions = await EmbedChats.getAllSessions(
        embedId ? Number(embedId) : null,
        Number(limit),
        Number(offset)
      );

      response.status(200).json({
        sessions: sessions.map(session => ({
          sessionId: session.session_id,
          userName: session.user_name,
          userEmail: session.user_email,
          userMobile: session.user_mobile,
          userRegion: session.user_region,
          connectionInfo: session.connection_information,
          workspace: session.embed_config?.workspace?.name,
          firstSeen: session.createdAt,
          lastActivity: session.lastActivity,
          messageCount: session.messageCount,
          status: getSessionStatus(session.lastActivity),
        })),
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get specific session details and chat history
  app.get("/dashboard/sessions/:sessionId", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      if (!user) {
        response.sendStatus(401).end();
        return;
      }

      const { sessionId } = request.params;
      const { embedId } = request.query;

      // Get session info
      const sessionInfo = await EmbedChats.getSessionInfo(
        sessionId,
        embedId ? Number(embedId) : null
      );

      if (!sessionInfo) {
        response.status(404).json({ error: "Session not found" });
        return;
      }

      // Get chat history
      const chatHistory = await EmbedChats.getSessionHistory(
        sessionId,
        embedId ? Number(embedId) : null
      );

      const formattedHistory = chatHistory.map(chat => {
        const responseData = JSON.parse(chat.response || "{}");
        return {
          id: chat.id,
          prompt: chat.prompt,
          response: responseData.text || "",
          timestamp: chat.createdAt,
          sources: responseData.sources || [],
        };
      });

      response.status(200).json({
        sessionInfo: {
          sessionId: sessionInfo.session_id,
          userName: sessionInfo.user_name,
          userEmail: sessionInfo.user_email,
          userMobile: sessionInfo.user_mobile,
          userRegion: sessionInfo.user_region,
          connectionInfo: sessionInfo.connection_information,
          workspace: sessionInfo.embed_config?.workspace?.name,
          firstSeen: sessionInfo.createdAt,
          lastActivity: sessionInfo.lastActivity,
          messageCount: sessionInfo.messageCount,
          status: getSessionStatus(sessionInfo.lastActivity),
        },
        chatHistory: formattedHistory,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get dashboard statistics
  app.get("/dashboard/stats", async (request, response) => {
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
        uniqueSessions,
        activeSessionsToday,
      ] = await Promise.all([
        EmbedChats.count(whereClause),
        EmbedChats.count({ ...whereClause, createdAt: { gte: today } }),
        EmbedChats.count({
          ...whereClause,
          createdAt: { gte: yesterday, lt: today },
        }),
        EmbedChats.count({ ...whereClause, createdAt: { gte: weekAgo } }),
        EmbedChats.count({ ...whereClause, session_id: { not: null } }),
        EmbedChats.count({
          ...whereClause,
          createdAt: { gte: today },
          session_id: { not: null },
        }),
      ]);

      response.status(200).json({
        totalChats,
        todayChats,
        yesterdayChats,
        weekChats,
        uniqueSessions,
        activeSessionsToday,
        growthRate: yesterdayChats > 0 ? ((todayChats - yesterdayChats) / yesterdayChats * 100).toFixed(1) : 0,
      });
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });

  // Get available embed configurations for filtering
  app.get("/dashboard/embeds", async (request, response) => {
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
  if (!lastActivity) return "inactive";
  
  const now = new Date();
  const diffMinutes = (now - new Date(lastActivity)) / (1000 * 60);
  
  if (diffMinutes < 5) return "online";
  if (diffMinutes < 30) return "away";
  return "offline";
}

module.exports = { dashboardEndpoints };
