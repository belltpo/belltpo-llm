const prisma = require('./utils/prisma');

async function checkEmbedData() {
  try {
    console.log('=== CHECKING EMBED CHAT DATA ===');
    
    // Check if there are any embed_chats
    const embedChats = await prisma.embed_chats.findMany({
      take: 10,
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
    
    console.log(`\nFound ${embedChats.length} embed chats in database:`);
    
    if (embedChats.length === 0) {
      console.log('❌ NO EMBED CHATS FOUND - This is why dashboard is empty!');
      
      // Check if embed configs exist
      const embedConfigs = await prisma.embed_configs.findMany({
        include: {
          workspace: true
        }
      });
      
      console.log(`\nFound ${embedConfigs.length} embed configs:`);
      embedConfigs.forEach(config => {
        console.log(`- ID: ${config.id}, UUID: ${config.uuid}`);
        console.log(`  Workspace: ${config.workspace?.name || 'None'}`);
        console.log(`  Enabled: ${config.enabled}`);
      });
      
      if (embedConfigs.length === 0) {
        console.log('❌ NO EMBED CONFIGS FOUND - Need to create embed widget first!');
      }
      
    } else {
      embedChats.forEach((chat, index) => {
        console.log(`\n${index + 1}. Chat ID: ${chat.id}`);
        console.log(`   Session: ${chat.session_id}`);
        console.log(`   Prompt: ${chat.prompt.substring(0, 100)}...`);
        console.log(`   Response: ${JSON.stringify(chat.response).substring(0, 100)}...`);
        console.log(`   Connection Info: ${chat.connection_information || 'None'}`);
        console.log(`   Created: ${chat.createdAt}`);
        console.log(`   Workspace: ${chat.embed_config?.workspace?.name || 'Unknown'}`);
      });
    }
    
    // Check workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    console.log(`\n=== WORKSPACES (${workspaces.length}) ===`);
    workspaces.forEach(ws => {
      console.log(`- ${ws.name} (${ws.slug}) - ID: ${ws.id}`);
    });
    
    return {
      embedChats: embedChats.length,
      embedConfigs: (await prisma.embed_configs.count()),
      workspaces: workspaces.length
    };
    
  } catch (error) {
    console.error('Error checking embed data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkEmbedData()
    .then(result => {
      console.log('\n=== SUMMARY ===');
      console.log(`Embed chats: ${result.embedChats}`);
      console.log(`Embed configs: ${result.embedConfigs}`);
      console.log(`Workspaces: ${result.workspaces}`);
      
      if (result.embedChats === 0) {
        console.log('\n🚨 ISSUE: No embed chats found!');
        console.log('This means:');
        console.log('1. Either no one has used the embed widget yet');
        console.log('2. Or the embed widget is not saving data properly');
        console.log('3. Or the embed widget is not configured correctly');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkEmbedData };
