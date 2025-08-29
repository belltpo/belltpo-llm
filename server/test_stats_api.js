const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Test the stats API logic directly
async function testStatsAPI() {
  console.log("=== TESTING STATS API LOGIC ===");
  
  try {
    // Connect to Django SQLite database
    const dbPath = path.join(__dirname, '..', 'prechat_widget', 'db.sqlite3');
    console.log("Database path:", dbPath);
    
    const db = new sqlite3.Database(dbPath);
    
    // Get all prechat users
    const prechatUsers = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM prechat_submissions ORDER BY created_at DESC", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    console.log(`\nTotal prechat users found: ${prechatUsers.length}`);
    
    if (prechatUsers.length > 0) {
      console.log("\nFirst few users:");
      prechatUsers.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.created_at}`);
      });
    }
    
    // Calculate today's chats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    console.log(`\nToday's date filter: ${todayStart.toISOString()}`);
    
    const todayChats = prechatUsers.filter(user => {
      const userDate = new Date(user.created_at);
      const isToday = userDate >= todayStart;
      if (isToday) {
        console.log(`Today's chat: ${user.name} - ${user.created_at}`);
      }
      return isToday;
    }).length;
    
    const stats = {
      todayChats: todayChats,
      uniqueSessions: prechatUsers.length,
      totalMessages: prechatUsers.length * 3
    };
    
    console.log("\n=== CALCULATED STATS ===");
    console.log("Today's Chats:", stats.todayChats);
    console.log("Total Sessions:", stats.uniqueSessions);
    console.log("Total Messages:", stats.totalMessages);
    
    // Test API endpoint
    console.log("\n=== TESTING API ENDPOINT ===");
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:3001/api/chat-dashboard/stats');
      if (response.ok) {
        const apiStats = await response.json();
        console.log("API Response:", apiStats);
        
        // Compare results
        console.log("\n=== COMPARISON ===");
        console.log("Direct calculation vs API:");
        console.log(`Today's Chats: ${stats.todayChats} vs ${apiStats.todayChats}`);
        console.log(`Total Sessions: ${stats.uniqueSessions} vs ${apiStats.uniqueSessions}`);
        console.log(`Total Messages: ${stats.totalMessages} vs ${apiStats.totalMessages}`);
      } else {
        console.log("API Error:", response.status, response.statusText);
      }
    } catch (apiError) {
      console.log("API connection error:", apiError.message);
      console.log("Make sure server is running on port 3001");
    }
    
    db.close();
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testStatsAPI();
