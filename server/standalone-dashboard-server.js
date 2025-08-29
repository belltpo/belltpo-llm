const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./utils/prisma');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Alternative dashboard API endpoints
app.get("/api/alternative-dashboard/sessions", async (request, response) => {
  try {
    console.log('🔍 Fetching all sessions...');
    
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

    console.log(`📊 Found ${allChats.length} total chats`);

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
      
      // Remove chats array from response to keep it clean
      delete session.chats;
      return session;
    });

    console.log(`✅ Returning ${sessions.length} unique sessions`);

    response.status(200).json({
      sessions: sessions,
      total: sessions.length,
      totalChats: allChats.length
    });

  } catch (error) {
    console.error('❌ Sessions API error:', error);
    response.status(500).json({ error: error.message });
  }
});

// Get specific session details
app.get("/api/alternative-dashboard/sessions/:sessionId", async (request, response) => {
  try {
    const { sessionId } = request.params;
    console.log(`🔍 Fetching session details for: ${sessionId}`);

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
      console.log(`❌ No chats found for session: ${sessionId}`);
      return response.status(404).json({ error: "Session not found" });
    }

    console.log(`📊 Found ${sessionChats.length} chats for session ${sessionId}`);

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
      let responseData;
      try {
        responseData = JSON.parse(chat.response || "{}");
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

    console.log(`✅ Returning session info and ${chatHistory.length} messages`);

    response.status(200).json({
      sessionInfo,
      chatHistory
    });

  } catch (error) {
    console.error('❌ Session details error:', error);
    response.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Standalone Dashboard Server is running',
    timestamp: new Date().toISOString(),
    port: 3001,
    endpoints: [
      'GET /api/test',
      'GET /api/alternative-dashboard/sessions',
      'GET /api/alternative-dashboard/sessions/:sessionId'
    ]
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 STANDALONE DASHBOARD SERVER RUNNING`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`📊 Sessions: http://localhost:${PORT}/api/alternative-dashboard/sessions`);
  console.log(`💬 Session Details: http://localhost:${PORT}/api/alternative-dashboard/sessions/{sessionId}`);
  console.log(`\n✨ This server provides direct database access for chat dashboard`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
