const prisma = require('./utils/prisma');

async function debugSessions() {
  try {
    console.log('=== DEBUGGING CHAT SESSIONS ===');
    
    // Check embed chats
    const embedChats = await prisma.embed_chats.findMany({
      take: 5,
      include: {
        embed_config: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    console.log(`\nFound ${embedChats.length} embed chats:`);
    embedChats.forEach(chat => {
      console.log(`- Session: ${chat.session_id}`);
      console.log(`  Prompt: ${chat.prompt}`);
      console.log(`  Response: ${chat.response.substring(0, 100)}...`);
      console.log(`  Created: ${chat.createdAt}`);
      console.log('---');
    });
    
    // Check unique sessions
    const uniqueSessions = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: {
        session_id: true
      }
    });
    
    console.log(`\nUnique sessions (${uniqueSessions.length}):`);
    uniqueSessions.forEach(session => {
      console.log(`- ${session.session_id}: ${session._count.session_id} messages`);
    });
    
    // Test specific session lookup
    if (uniqueSessions.length > 0) {
      const testSessionId = uniqueSessions[0].session_id;
      console.log(`\nTesting session lookup for: ${testSessionId}`);
      
      const sessionChats = await prisma.embed_chats.findMany({
        where: {
          session_id: testSessionId,
          include: true
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
      
      console.log(`Found ${sessionChats.length} chats for session ${testSessionId}:`);
      sessionChats.forEach(chat => {
        console.log(`  - ${chat.prompt} -> ${JSON.parse(chat.response).text || 'No response'}`);
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSessions();
