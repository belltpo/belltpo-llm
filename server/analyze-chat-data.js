const prisma = require('./utils/prisma');

async function analyzeChatData() {
  try {
    console.log('=== ANALYZING CHAT WIDGET DATA STORAGE ===');
    
    // 1. Check embed_chats table structure and data
    const embedChats = await prisma.embed_chats.findMany({
      take: 5,
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
    
    console.log(`\n📊 EMBED_CHATS TABLE (${embedChats.length} samples):`);
    embedChats.forEach((chat, index) => {
      console.log(`\n${index + 1}. Chat ID: ${chat.id}`);
      console.log(`   Session ID: ${chat.session_id}`);
      console.log(`   Prompt: "${chat.prompt}"`);
      
      // Parse response JSON
      let responseData;
      try {
        responseData = JSON.parse(chat.response);
        console.log(`   Response: "${responseData.text || responseData.response || 'No text'}"`);
      } catch (e) {
        console.log(`   Response (raw): "${chat.response}"`);
      }
      
      // Parse connection information
      let connInfo;
      try {
        connInfo = JSON.parse(chat.connection_information || '{}');
        console.log(`   User: ${connInfo.name || 'Unknown'} (${connInfo.email || 'No email'})`);
        console.log(`   Mobile: ${connInfo.mobile || 'None'}`);
        console.log(`   Region: ${connInfo.region || 'None'}`);
      } catch (e) {
        console.log(`   Connection Info: ${chat.connection_information || 'None'}`);
      }
      
      console.log(`   Created: ${chat.createdAt}`);
      console.log(`   Workspace: ${chat.embed_config?.workspace?.name || 'Unknown'}`);
    });
    
    // 2. Group by session_id to understand user conversations
    const sessionGroups = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: {
        session_id: true
      },
      orderBy: {
        _count: {
          session_id: 'desc'
        }
      }
    });
    
    console.log(`\n📋 SESSION ANALYSIS (${sessionGroups.length} unique sessions):`);
    
    for (const session of sessionGroups.slice(0, 3)) {
      console.log(`\n🔍 Session: ${session.session_id} (${session._count.session_id} messages)`);
      
      // Get all chats for this session
      const sessionChats = await prisma.embed_chats.findMany({
        where: {
          session_id: session.session_id
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      // Extract user info from first chat
      if (sessionChats.length > 0) {
        const firstChat = sessionChats[0];
        let userInfo;
        try {
          userInfo = JSON.parse(firstChat.connection_information || '{}');
          console.log(`   👤 User: ${userInfo.name || 'Anonymous'}`);
          console.log(`   📧 Email: ${userInfo.email || 'None'}`);
          console.log(`   📱 Mobile: ${userInfo.mobile || 'None'}`);
        } catch (e) {
          console.log(`   👤 User info: Could not parse`);
        }
        
        console.log(`   💬 Conversation flow:`);
        sessionChats.forEach((chat, idx) => {
          let responseText;
          try {
            const responseData = JSON.parse(chat.response);
            responseText = responseData.text || responseData.response || 'No response';
          } catch (e) {
            responseText = chat.response || 'No response';
          }
          
          console.log(`     ${idx + 1}. User: "${chat.prompt}"`);
          console.log(`        Bot: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`);
        });
      }
    }
    
    // 3. Check workspace_chats table for comparison
    const workspaceChats = await prisma.workspace_chats.findMany({
      take: 3,
      include: {
        users: true
      }
    });
    
    console.log(`\n📝 WORKSPACE_CHATS TABLE (${workspaceChats.length} samples):`);
    workspaceChats.forEach((chat, index) => {
      console.log(`${index + 1}. User: ${chat.users?.username || 'Unknown'}`);
      console.log(`   Prompt: "${chat.prompt}"`);
      console.log(`   Response: "${chat.response.substring(0, 100)}..."`);
    });
    
    // 4. Summary of data structure
    console.log(`\n📋 DATA STRUCTURE SUMMARY:`);
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ EMBED CHAT WIDGET DATA STORAGE                              │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│ Table: embed_chats                                          │`);
    console.log(`│ Location: /server/storage/anythingllm.db                    │`);
    console.log(`│                                                             │`);
    console.log(`│ Key Fields:                                                 │`);
    console.log(`│ • session_id: Links all messages from same user            │`);
    console.log(`│ • prompt: User's message                                    │`);
    console.log(`│ • response: AI response (JSON format)                      │`);
    console.log(`│ • connection_information: User details (JSON)              │`);
    console.log(`│   - name, email, mobile, region                            │`);
    console.log(`│ • embed_id: Links to embed configuration                   │`);
    console.log(`│ • createdAt: Timestamp                                      │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
    
    return {
      totalEmbedChats: await prisma.embed_chats.count(),
      uniqueSessions: sessionGroups.length,
      totalWorkspaceChats: await prisma.workspace_chats.count()
    };
    
  } catch (error) {
    console.error('❌ Error analyzing chat data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeChatData()
    .then(result => {
      console.log('\n✅ ANALYSIS COMPLETE');
      console.log(`Total embed chats: ${result.totalEmbedChats}`);
      console.log(`Unique sessions: ${result.uniqueSessions}`);
      console.log(`Total workspace chats: ${result.totalWorkspaceChats}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeChatData };
