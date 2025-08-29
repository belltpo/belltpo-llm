const prisma = require('./utils/prisma');

async function debugMickeySession() {
  try {
    console.log('=== DEBUGGING MICKEY SESSION ===');
    
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
    
    console.log(`\n🔍 Found ${mickeyChats.length} chats for Mickey`);
    
    if (mickeyChats.length === 0) {
      console.log('❌ NO CHATS FOUND FOR MICKEY');
      console.log('This means:');
      console.log('1. Mickey has not actually sent any messages through the chat widget');
      console.log('2. The chat widget is not saving conversations to the database');
      console.log('3. The connection information is not being stored properly');
      
      // Check all recent embed chats to see what we have
      const recentChats = await prisma.embed_chats.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`\n📊 Recent embed chats (${recentChats.length}):`);
      recentChats.forEach((chat, index) => {
        let connInfo = {};
        try {
          connInfo = JSON.parse(chat.connection_information || '{}');
        } catch (e) {
          connInfo = { raw: chat.connection_information };
        }
        
        console.log(`${index + 1}. Session: ${chat.session_id}`);
        console.log(`   User: ${connInfo.name || 'Unknown'}`);
        console.log(`   Email: ${connInfo.email || 'Unknown'}`);
        console.log(`   Prompt: "${chat.prompt}"`);
        console.log(`   Created: ${chat.createdAt}`);
        console.log('---');
      });
      
    } else {
      console.log('✅ MICKEY CHATS FOUND:');
      mickeyChats.forEach((chat, index) => {
        let connInfo = {};
        try {
          connInfo = JSON.parse(chat.connection_information || '{}');
        } catch (e) {
          connInfo = { raw: chat.connection_information };
        }
        
        console.log(`\n${index + 1}. Chat ID: ${chat.id}`);
        console.log(`   Session: ${chat.session_id}`);
        console.log(`   User: ${connInfo.name || 'Unknown'}`);
        console.log(`   Email: ${connInfo.email || 'Unknown'}`);
        console.log(`   Prompt: "${chat.prompt}"`);
        console.log(`   Response: "${JSON.parse(chat.response).text || 'No response'}"`);
        console.log(`   Created: ${chat.createdAt}`);
        console.log(`   Workspace: ${chat.embed_config?.workspace?.name || 'Unknown'}`);
      });
    }
    
    // Check if there are any sessions that might be Mickey but with different names
    const allSessions = await prisma.embed_chats.groupBy({
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
    
    console.log(`\n📋 ALL SESSIONS (${allSessions.length}):`);
    
    for (const session of allSessions.slice(0, 10)) {
      const firstChat = await prisma.embed_chats.findFirst({
        where: {
          session_id: session.session_id
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      if (firstChat) {
        let connInfo = {};
        try {
          connInfo = JSON.parse(firstChat.connection_information || '{}');
        } catch (e) {
          connInfo = { raw: firstChat.connection_information };
        }
        
        console.log(`- ${connInfo.name || 'Anonymous'} (${connInfo.email || 'No email'}): ${session._count.session_id} messages`);
        console.log(`  Session: ${session.session_id}`);
      }
    }
    
    return {
      mickeyChats: mickeyChats.length,
      totalSessions: allSessions.length
    };
    
  } catch (error) {
    console.error('❌ Error debugging Mickey session:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugMickeySession()
    .then(result => {
      console.log('\n=== DEBUGGING COMPLETE ===');
      console.log(`Mickey chats found: ${result.mickeyChats}`);
      console.log(`Total sessions: ${result.totalSessions}`);
      
      if (result.mickeyChats === 0) {
        console.log('\n🚨 ISSUE IDENTIFIED:');
        console.log('Mickey appears in the dashboard but has no chat conversations in the database.');
        console.log('This suggests:');
        console.log('1. The dashboard is showing cached/fake data');
        console.log('2. The chat widget is not properly saving conversations');
        console.log('3. There is a disconnect between the dashboard display and actual database');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugMickeySession };
