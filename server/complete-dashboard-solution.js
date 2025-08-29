const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./utils/prisma');

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Serve static files from frontend dist if it exists
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// API endpoint to get all chat sessions
app.get("/api/chat-dashboard/sessions", async (request, response) => {
  try {
    console.log('🔍 Fetching all chat sessions...');
    
    // Get all embed chats with related data
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

    // Convert to array and set status
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
    console.error('❌ Error fetching sessions:', error);
    response.status(500).json({ 
      error: "Failed to fetch sessions",
      details: error.message 
    });
  }
});

// API endpoint to get specific session chat history
app.get("/api/chat-dashboard/sessions/:sessionId", async (request, response) => {
  try {
    const { sessionId } = request.params;
    console.log(`🔍 Fetching chat history for session: ${sessionId}`);

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

    // Format chat history for display
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
    console.error('❌ Error fetching session details:', error);
    response.status(500).json({ 
      error: "Failed to fetch session details",
      details: error.message,
      sessionId: request.params.sessionId
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Complete Dashboard Solution Running',
    timestamp: new Date().toISOString(),
    port: 3001,
    endpoints: [
      'GET /api/test',
      'GET /api/chat-dashboard/sessions',
      'GET /api/chat-dashboard/sessions/:sessionId',
      'GET /api/debug-mickey'
    ]
  });
});

// Debug endpoint for Mickey
app.get('/api/debug-mickey', async (req, res) => {
  try {
    // Search for Mickey in embed_chats
    const mickeyChats = await prisma.embed_chats.findMany({
      where: {
        OR: [
          {
            connection_information: {
              contains: 'mickey'
            }
          },
          {
            connection_information: {
              contains: 'Mickey'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get recent chats for comparison
    const recentChats = await prisma.embed_chats.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const recentChatsFormatted = recentChats.map(chat => {
      let connInfo = {};
      try {
        connInfo = JSON.parse(chat.connection_information || '{}');
      } catch (e) {
        connInfo = { raw: chat.connection_information };
      }
      
      return {
        sessionId: chat.session_id,
        name: connInfo.name || 'Unknown',
        email: connInfo.email || 'Unknown',
        prompt: chat.prompt,
        createdAt: chat.createdAt
      };
    });
    
    // Get session count
    const sessionCount = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: {
        session_id: true
      }
    });
    
    res.json({
      mickeyChats: mickeyChats.length,
      totalSessions: sessionCount.length,
      recentChats: recentChatsFormatted,
      debug: {
        searchedFor: ['mickey', 'Mickey'],
        totalEmbedChats: recentChats.length
      }
    });
    
  } catch (error) {
    console.error('Debug Mickey error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve test embed widget page
app.get('/test-embed-widget.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-embed-widget.html'));
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 COMPLETE DASHBOARD SOLUTION RUNNING`);
  console.log(`📍 Dashboard URL: http://localhost:${PORT}/dashboard/chat-sessions`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log(`📊 Sessions API: http://localhost:${PORT}/api/chat-dashboard/sessions`);
  console.log(`💬 Session Details: http://localhost:${PORT}/api/chat-dashboard/sessions/{sessionId}`);
  console.log(`\n✨ Click any user in the dashboard to see their conversations!`);
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
