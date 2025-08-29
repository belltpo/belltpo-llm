const { EmbedChats } = require("../models/embedChats");
const { EmbedConfig } = require("../models/embedConfig");
const path = require('path');

// Try to load sqlite3, fallback gracefully if not available
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.warn('[WebSocketDashboard] sqlite3 not available, prechat user integration disabled:', error.message);
  sqlite3 = null;
}

// Store WebSocket connections
const dashboardConnections = new Set();

function websocketDashboardEndpoints(app) {
  if (!app) return;

  // WebSocket endpoint for real-time dashboard updates
  app.ws('/ws/dashboard', (ws, req) => {
    console.log('Dashboard WebSocket connected');
    dashboardConnections.add(ws);

    // Send initial data
    sendDashboardUpdate(ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'GET_SESSIONS':
            await sendSessionsUpdate(ws, data.embedId);
            break;
          case 'GET_SESSION_DETAILS':
            await sendSessionDetails(ws, data.sessionId, data.embedId);
            break;
          case 'GET_STATS':
            await sendStatsUpdate(ws, data.embedId);
            break;
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
      }
    });

    ws.on('close', () => {
      console.log('Dashboard WebSocket disconnected');
      dashboardConnections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('Dashboard WebSocket error:', error);
      dashboardConnections.delete(ws);
    });
  });

  // WebSocket endpoint for prechat form updates
  app.ws('/ws/prechat', (ws, req) => {
    console.log('Prechat WebSocket connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'FORM_SUBMITTED') {
          // Broadcast new form submission to all dashboard connections
          broadcastToDashboard({
            type: 'NEW_PRECHAT_SUBMISSION',
            data: data.formData
          });
        }
      } catch (error) {
        console.error('Prechat WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Prechat WebSocket disconnected');
    });
  });
}

// Send sessions update to a specific WebSocket connection
async function sendSessionsUpdate(ws, embedId = null) {
  try {
    const { sessions, total } = await getDashboardSessions(embedId);
    ws.send(JSON.stringify({
      type: 'SESSIONS_UPDATE',
      data: { sessions, total }
    }));
  } catch (error) {
    console.error('Error sending sessions update:', error);
    ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
  }
}

// Send session details to a specific WebSocket connection
async function sendSessionDetails(ws, sessionId, embedId = null) {
  try {
    const sessionData = await getSessionDetails(sessionId, embedId);
    ws.send(JSON.stringify({
      type: 'SESSION_DETAILS',
      data: sessionData
    }));
  } catch (error) {
    console.error('Error sending session details:', error);
    ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
  }
}

// Send stats update to a specific WebSocket connection
async function sendStatsUpdate(ws, embedId = null) {
  try {
    const stats = await getDashboardStats(embedId);
    ws.send(JSON.stringify({
      type: 'STATS_UPDATE',
      data: stats
    }));
  } catch (error) {
    console.error('Error sending stats update:', error);
    ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
  }
}

// Send initial dashboard data
async function sendDashboardUpdate(ws) {
  try {
    const [sessions, stats] = await Promise.all([
      getDashboardSessions(),
      getDashboardStats()
    ]);

    ws.send(JSON.stringify({
      type: 'DASHBOARD_INIT',
      data: { sessions: sessions.sessions, total: sessions.total, stats }
    }));
  } catch (error) {
    console.error('Error sending dashboard update:', error);
  }
}

// Broadcast message to all dashboard connections
function broadcastToDashboard(message) {
  const messageStr = JSON.stringify(message);
  dashboardConnections.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Broadcast new chat message to dashboard
function broadcastNewChatMessage(chatData) {
  broadcastToDashboard({
    type: 'NEW_CHAT_MESSAGE',
    data: chatData
  });
}

// Get dashboard sessions (reused from chatDashboard.js)
async function getDashboardSessions(embedId = null) {
  const allChats = await EmbedChats.whereWithEmbedAndWorkspace(
    {
      ...(embedId ? { embed_id: Number(embedId) } : {}),
      include: true,
    },
    null,
    { createdAt: "desc" }
  );

  // Get prechat user data
  const prechatUsers = await getPrechatUsers();
  const prechatUserMap = new Map();
  prechatUsers.forEach(user => {
    if (user.session_token) {
      prechatUserMap.set(user.session_token, user);
    }
  });

  // Group by session_id
  const sessionMap = new Map();
  
  allChats.forEach(chat => {
    const sessionId = chat.session_id;
    const connectionInfo = JSON.parse(chat.connection_information || "{}");
    const prechatUser = prechatUserMap.get(sessionId);
    
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        sessionId: sessionId,
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
      const session = sessionMap.get(sessionId);
      session.messageCount += 1;
      
      if (new Date(chat.createdAt) > new Date(session.lastActivity)) {
        session.lastActivity = chat.createdAt;
        session.lastMessage = chat.prompt || session.lastMessage;
      }
      if (new Date(chat.createdAt) < new Date(session.firstSeen)) {
        session.firstSeen = chat.createdAt;
      }
    }
  });

  const uniqueSessions = Array.from(sessionMap.values()).map(session => ({
    ...session,
    status: getSessionStatus(session.lastActivity),
  }));

  return {
    sessions: uniqueSessions,
    total: uniqueSessions.length,
  };
}

// Get session details
async function getSessionDetails(sessionId, embedId = null) {
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
    throw new Error("Session not found");
  }

  // Get prechat user data
  const prechatUsers = await getPrechatUsers();
  const prechatUser = prechatUsers.find(user => user.session_token === sessionId);

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

  return {
    sessionInfo,
    chatHistory: formattedHistory,
  };
}

// Get dashboard stats
async function getDashboardStats(embedId = null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const whereClause = {
    ...(embedId ? { embed_id: Number(embedId) } : {}),
    include: true,
  };

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

  const allChats = await EmbedChats.where(whereClause);
  const uniqueSessions = new Set(allChats.map(chat => chat.session_id)).size;

  return {
    totalChats,
    todayChats,
    yesterdayChats,
    weekChats,
    uniqueSessions,
    activeSessionsToday: todayChats > 0 ? Math.ceil(todayChats / 3) : 0,
    growthRate: yesterdayChats > 0 ? ((todayChats - yesterdayChats) / yesterdayChats * 100).toFixed(1) : 0,
  };
}

// Helper function to fetch prechat users (same as chatDashboard.js)
async function getPrechatUsers() {
  return new Promise((resolve, reject) => {
    try {
      if (!sqlite3) {
        resolve([]);
        return;
      }

      const fs = require('fs');
      const dbPath = path.join(__dirname, '../../prechat_widget/db.sqlite3');
      
      if (!fs.existsSync(dbPath)) {
        resolve([]);
        return;
      }

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          resolve([]);
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
          if (err.code === 'SQLITE_ERROR' && err.message.includes('no such table')) {
            console.log('Prechat submissions table not found - this is normal if prechat widget is not set up');
          } else {
            console.error('Database query error:', err);
          }
          resolve([]);
          return;
        }
        resolve(rows || []);
      });
    } catch (error) {
      console.error('Error fetching prechat users:', error);
      resolve([]);
    }
  });
}

// Helper function to determine session status
function getSessionStatus(lastActivity) {
  if (!lastActivity) return "offline";
  
  const now = new Date();
  const diffMinutes = (now - new Date(lastActivity)) / (1000 * 60);
  
  if (diffMinutes < 5) return "online";
  if (diffMinutes < 30) return "away";
  return "offline";
}

module.exports = { 
  websocketDashboardEndpoints, 
  broadcastToDashboard, 
  broadcastNewChatMessage 
};
