const prisma = require('./utils/prisma');

async function testDatabaseConnection() {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // Test embed_chats table
    const embedChats = await prisma.embed_chats.findMany({
      take: 3,
      include: {
        embed_config: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    console.log(`\nFound ${embedChats.length} embed chats in database:`);
    embedChats.forEach((chat, index) => {
      console.log(`${index + 1}. Session: ${chat.session_id}`);
      console.log(`   Prompt: ${chat.prompt.substring(0, 50)}...`);
      console.log(`   Response: ${chat.response.substring(0, 50)}...`);
      console.log(`   Created: ${chat.createdAt}`);
      console.log('---');
    });
    
    // Test unique sessions count
    const uniqueSessions = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: {
        session_id: true
      }
    });
    
    console.log(`\nTotal unique sessions: ${uniqueSessions.length}`);
    
    // Test workspace_chats table
    const workspaceChats = await prisma.workspace_chats.findMany({
      take: 3
    });
    
    console.log(`\nFound ${workspaceChats.length} workspace chats in database`);
    
    return {
      embedChats: embedChats.length,
      uniqueSessions: uniqueSessions.length,
      workspaceChats: workspaceChats.length
    };
    
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDatabaseConnection()
    .then(result => {
      console.log('\n=== DATABASE TEST RESULTS ===');
      console.log('Embed chats:', result.embedChats);
      console.log('Unique sessions:', result.uniqueSessions);
      console.log('Workspace chats:', result.workspaceChats);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
