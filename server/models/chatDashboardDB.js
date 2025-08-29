const path = require('path');
const fs = require('fs');

// Try to load sqlite3, fallback gracefully if not available
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.warn('[ChatDashboardDB] sqlite3 not available:', error.message);
  sqlite3 = null;
}

class ChatDashboardDB {
  constructor() {
    this.dbPath = path.join(__dirname, '../storage/chat_dashboard.sqlite3');
    this.db = null;
    this.init();
  }

  init() {
    if (!sqlite3) {
      console.log('[ChatDashboardDB] SQLite3 not available, using fallback storage');
      return;
    }

    try {
      // Ensure storage directory exists
      const storageDir = path.dirname(this.dbPath);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('[ChatDashboardDB] Error opening database:', err);
          return;
        }
        console.log('[ChatDashboardDB] Connected to chat dashboard database');
        this.createTables();
      });
    } catch (error) {
      console.error('[ChatDashboardDB] Failed to initialize database:', error);
    }
  }

  createTables() {
    if (!this.db) return;

    const createTablesSQL = `
      -- Chat Sessions Table
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_name TEXT,
        user_email TEXT,
        user_mobile TEXT,
        user_region TEXT,
        workspace_name TEXT,
        embed_id INTEGER,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'offline',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Chat Messages Table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        message_type TEXT NOT NULL, -- 'user' or 'assistant'
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT, -- JSON string for additional data
        FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON chat_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON chat_sessions(last_activity);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chat_messages(timestamp);
    `;

    this.db.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('[ChatDashboardDB] Error creating tables:', err);
      } else {
        console.log('[ChatDashboardDB] Tables created successfully');
      }
    });
  }

  // Insert or update chat session
  upsertSession(sessionData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const {
        sessionId,
        userName,
        userEmail,
        userMobile,
        userRegion,
        workspaceName,
        embedId
      } = sessionData;

      const sql = `
        INSERT OR REPLACE INTO chat_sessions 
        (session_id, user_name, user_email, user_mobile, user_region, workspace_name, embed_id, last_activity, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [sessionId, userName, userEmail, userMobile, userRegion, workspaceName, embedId], function(err) {
        if (err) {
          console.error('[ChatDashboardDB] Error upserting session:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Insert chat message
  insertMessage(sessionId, messageType, content, metadata = null) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const sql = `
        INSERT INTO chat_messages (session_id, message_type, content, metadata)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(sql, [sessionId, messageType, content, JSON.stringify(metadata)], function(err) {
        if (err) {
          console.error('[ChatDashboardDB] Error inserting message:', err);
          reject(err);
        } else {
          // Update message count and last activity
          const updateSessionSQL = `
            UPDATE chat_sessions 
            SET message_count = message_count + 1, 
                last_activity = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
          `;
          
          this.db.run(updateSessionSQL, [sessionId], (updateErr) => {
            if (updateErr) {
              console.error('[ChatDashboardDB] Error updating session:', updateErr);
            }
          });
          
          resolve(this.lastID);
        }
      });
    });
  }

  // Get all sessions with pagination
  getSessions(limit = 50, offset = 0, embedId = null) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      let sql = `
        SELECT * FROM chat_sessions 
        WHERE 1=1
      `;
      const params = [];

      if (embedId) {
        sql += ` AND embed_id = ?`;
        params.push(embedId);
      }

      sql += ` ORDER BY last_activity DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('[ChatDashboardDB] Error getting sessions:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Get messages for a specific session
  getSessionMessages(sessionId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const sql = `
        SELECT * FROM chat_messages 
        WHERE session_id = ? 
        ORDER BY timestamp ASC
      `;

      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          console.error('[ChatDashboardDB] Error getting session messages:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Get dashboard statistics
  getStats(embedId = null) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve({
          totalSessions: 0,
          totalMessages: 0,
          todaySessions: 0,
          todayMessages: 0
        });
        return;
      }

      let sessionSQL = `SELECT COUNT(*) as total FROM chat_sessions WHERE 1=1`;
      let messageSQL = `SELECT COUNT(*) as total FROM chat_messages WHERE 1=1`;
      let todaySessionSQL = `SELECT COUNT(*) as total FROM chat_sessions WHERE DATE(created_at) = DATE('now') AND 1=1`;
      let todayMessageSQL = `SELECT COUNT(*) as total FROM chat_messages WHERE DATE(timestamp) = DATE('now') AND 1=1`;

      const params = [];
      if (embedId) {
        sessionSQL += ` AND embed_id = ?`;
        todaySessionSQL += ` AND embed_id = ?`;
        params.push(embedId);
      }

      Promise.all([
        new Promise((res, rej) => this.db.get(sessionSQL, embedId ? [embedId] : [], (err, row) => err ? rej(err) : res(row?.total || 0))),
        new Promise((res, rej) => this.db.get(messageSQL, [], (err, row) => err ? rej(err) : res(row?.total || 0))),
        new Promise((res, rej) => this.db.get(todaySessionSQL, embedId ? [embedId] : [], (err, row) => err ? rej(err) : res(row?.total || 0))),
        new Promise((res, rej) => this.db.get(todayMessageSQL, [], (err, row) => err ? rej(err) : res(row?.total || 0)))
      ]).then(([totalSessions, totalMessages, todaySessions, todayMessages]) => {
        resolve({
          totalSessions,
          totalMessages,
          todaySessions,
          todayMessages
        });
      }).catch(reject);
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('[ChatDashboardDB] Error closing database:', err);
        } else {
          console.log('[ChatDashboardDB] Database connection closed');
        }
      });
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ChatDashboardDB: () => {
    if (!instance) {
      instance = new ChatDashboardDB();
    }
    return instance;
  }
};
