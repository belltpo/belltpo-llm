const express = require('express');
const prisma = require('./utils/prisma');
const path = require('path');

// Create alternative dashboard endpoint that bypasses the existing chat dashboard
function createAlternativeDashboard(app) {
  
  // Alternative endpoint to get all sessions with chat history
  app.get("/api/alternative-dashboard/sessions", async (request, response) => {
    try {
      console.log('Alternative dashboard: Fetching all sessions...');
      
      // Get all embed chats with workspace info
      const allChats = await prisma.embed_chats.findMany({
        include: {
          embed_config: {
            include: {
              workspace: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${allChats.length} total chats`);

      // Group by session_id
      const sessionMap = new Map();
      
      allChats.forEach(chat => {
        const sessionId = chat.session_id;
        const connectionInfo = JSON.parse(chat.connection_information || "{}");
        
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            sessionId: sessionId,
            userName: connectionInfo.name || connectionInfo.username || "Anonymous User",
            userEmail: connectionInfo.email || null,
            userMobile: connectionInfo.mobile || connectionInfo.phone || null,
            userRegion: connectionInfo.region || connectionInfo.location || null,
            workspace: chat.embed_config?.workspace?.name || "Unknown",
            firstSeen: chat.createdAt,
            lastActivity: chat.createdAt,
            messageCount: 1,
            status: "offline",
            chats: [chat]
          });
        } else {
          const session = sessionMap.get(sessionId);
          session.messageCount += 1;
          session.chats.push(chat);
          
          if (new Date(chat.createdAt) > new Date(session.lastActivity)) {
            session.lastActivity = chat.createdAt;
          }
          if (new Date(chat.createdAt) < new Date(session.firstSeen)) {
            session.firstSeen = chat.createdAt;
          }
        }
      });

      // Convert to array and add status
      const sessions = Array.from(sessionMap.values()).map(session => {
        const now = new Date();
        const diffMinutes = (now - new Date(session.lastActivity)) / (1000 * 60);
        
        if (diffMinutes < 5) session.status = "online";
        else if (diffMinutes < 30) session.status = "away";
        else session.status = "offline";
        
        return session;
      });

      console.log(`Returning ${sessions.length} unique sessions`);

      response.status(200).json({
        sessions: sessions,
        total: sessions.length,
        totalChats: allChats.length
      });

    } catch (error) {
      console.error('Alternative dashboard error:', error);
      response.status(500).json({ error: error.message });
    }
  });

  // Alternative endpoint to get specific session details
  app.get("/api/alternative-dashboard/sessions/:sessionId", async (request, response) => {
    try {
      const { sessionId } = request.params;
      console.log(`Alternative dashboard: Fetching session ${sessionId}...`);

      // Get all chats for this session
      const sessionChats = await prisma.embed_chats.findMany({
        where: {
          session_id: sessionId
        },
        include: {
          embed_config: {
            include: {
              workspace: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (sessionChats.length === 0) {
        return response.status(404).json({ error: "Session not found" });
      }

      console.log(`Found ${sessionChats.length} chats for session ${sessionId}`);

      // Get session info from first chat
      const firstChat = sessionChats[0];
      const connectionInfo = JSON.parse(firstChat.connection_information || "{}");

      const sessionInfo = {
        sessionId: sessionId,
        userName: connectionInfo.name || connectionInfo.username || "Anonymous User",
        userEmail: connectionInfo.email || null,
        userMobile: connectionInfo.mobile || connectionInfo.phone || null,
        userRegion: connectionInfo.region || connectionInfo.location || null,
        workspace: firstChat.embed_config?.workspace?.name || "Unknown",
        firstSeen: firstChat.createdAt,
        lastActivity: sessionChats[sessionChats.length - 1].createdAt,
        messageCount: sessionChats.length,
        status: "offline"
      };

      // Format chat history
      const chatHistory = [];
      sessionChats.forEach(chat => {
        const responseData = JSON.parse(chat.response || "{}");
        
        // Add user message
        chatHistory.push({
          id: `${chat.id}_user`,
          role: "user",
          prompt: chat.prompt,
          response: null,
          timestamp: chat.createdAt,
        });
        
        // Add assistant response
        chatHistory.push({
          id: `${chat.id}_assistant`,
          role: "assistant",
          prompt: null,
          response: responseData.text || responseData.response || responseData || "",
          timestamp: chat.createdAt,
        });
      });

      console.log(`Returning session info and ${chatHistory.length} messages`);

      response.status(200).json({
        sessionInfo,
        chatHistory
      });

    } catch (error) {
      console.error('Alternative session details error:', error);
      response.status(500).json({ error: error.message });
    }
  });
}

module.exports = { createAlternativeDashboard };

// If running directly, start a test server
if (require.main === module) {
  const app = express();
  app.use(express.json());
  
  createAlternativeDashboard(app);
  
  const PORT = 3002;
  app.listen(PORT, () => {
    console.log(`Alternative dashboard server running on http://localhost:${PORT}`);
    console.log('Test endpoints:');
    console.log(`- GET http://localhost:${PORT}/api/alternative-dashboard/sessions`);
    console.log(`- GET http://localhost:${PORT}/api/alternative-dashboard/sessions/{sessionId}`);
  });
}
