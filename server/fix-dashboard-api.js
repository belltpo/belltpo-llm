const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma');

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Dashboard API to get all sessions with user details
app.get("/api/chat-dashboard/sessions", async (request, response) => {
  try {
    console.log('🔍 Dashboard: Fetching all chat sessions...');
    
    // Get all embed chats grouped by session
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

    console.log(`📊 Found ${allChats.length} total embed chats`);

    // Group chats by session_id to create user sessions
    const sessionMap = new Map();
    
    allChats.forEach(chat => {
      const sessionId = chat.session_id;
      let connectionInfo = {};
      
      try {
        connectionInfo = JSON.parse(chat.connection_information || '{}');
      } catch (e) {
        console.warn(`Failed to parse connection info for chat ${chat.id}`);
      }
      
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
          status: "offline"
        });
      } else {
        const session = sessionMap.get(sessionId);
        session.messageCount += 1;
        
        // Update activity times
        if (new Date(chat.createdAt) > new Date(session.lastActivity)) {
          session.lastActivity = chat.createdAt;
        }
        if (new Date(chat.createdAt) < new Date(session.firstSeen)) {
          session.firstSeen = chat.createdAt;
        }
      }
    });

    // Convert to array and set status based on last activity
    const sessions = Array.from(sessionMap.values()).map(session => {
      const now = new Date();
      const diffMinutes = (now - new Date(session.lastActivity)) / (1000 * 60);
      
      if (diffMinutes < 5) session.status = "online";
      else if (diffMinutes < 30) session.status = "away";
      else session.status = "offline";
      
      return session;
    });

    console.log(`✅ Returning ${sessions.length} unique sessions`);

    response.status(200).json({
      sessions: sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('❌ Dashboard sessions error:', error);
    response.status(500).json({ 
      error: "Failed to fetch sessions",
      details: error.message 
    });
  }
});

// Dashboard API to get specific session chat history
app.get("/api/chat-dashboard/sessions/:sessionId", async (request, response) => {
  try {
    const { sessionId } = request.params;
    console.log(`🔍 Dashboard: Fetching chat history for session ${sessionId}`);

    // Get all chats for this specific session
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
      console.log(`❌ No chats found for session: ${sessionId}`);
      return response.status(404).json({ 
        error: "Session not found",
        sessionId: sessionId 
      });
    }

    console.log(`📊 Found ${sessionChats.length} chats for session ${sessionId}`);

    // Extract session info from first chat
    const firstChat = sessionChats[0];
    let connectionInfo = {};
    
    try {
      connectionInfo = JSON.parse(firstChat.connection_information || '{}');
    } catch (e) {
      console.warn(`Failed to parse connection info for session ${sessionId}`);
    }

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

    // Format chat history for frontend display
    const chatHistory = [];
    
    sessionChats.forEach(chat => {
      let responseData = {};
      
      try {
        responseData = JSON.parse(chat.response || '{}');
      } catch (e) {
        responseData = { text: chat.response || "" };
      }
      
      // Add user message
      chatHistory.push({
        id: `${chat.id}_user`,
        role: "user",
        prompt: chat.prompt,
        response: null,
        timestamp: chat.createdAt,
        createdAt: chat.createdAt
      });
      
      // Add assistant response
      chatHistory.push({
        id: `${chat.id}_assistant`,
        role: "assistant",
        prompt: null,
        response: responseData.text || responseData.response || responseData || "",
        timestamp: chat.createdAt,
        createdAt: chat.createdAt
      });
    });

    console.log(`✅ Returning session info and ${chatHistory.length} messages`);

    response.status(200).json({
      sessionInfo,
      chatHistory
    });

  } catch (error) {
    console.error('❌ Dashboard session details error:', error);
    response.status(500).json({ 
      error: "Failed to fetch session details",
      details: error.message,
      sessionId: request.params.sessionId
    });
  }
});

// Test endpoint
app.get('/api/test-dashboard', (req, res) => {
  res.json({ 
    status: 'Dashboard API Server Running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/chat-dashboard/sessions',
      'GET /api/chat-dashboard/sessions/:sessionId',
      'GET /api/test-dashboard'
    ]
  });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 DASHBOARD API SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Test: http://localhost:${PORT}/api/test-dashboard`);
  console.log(`📊 Sessions: http://localhost:${PORT}/api/chat-dashboard/sessions`);
  console.log(`💬 Session Details: http://localhost:${PORT}/api/chat-dashboard/sessions/{sessionId}`);
  console.log(`\n✨ This server provides the exact API endpoints the dashboard expects`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down dashboard API server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
