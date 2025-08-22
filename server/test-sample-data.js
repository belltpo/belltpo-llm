const prisma = require('./utils/prisma');

async function testSampleData() {
  try {
    console.log('Testing sample data creation...');
    
    // Clear existing data
    await prisma.embed_chats.deleteMany({});
    console.log('✓ Cleared existing embed chats');

    // Create workspace
    let workspace = await prisma.workspaces.findFirst();
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Sample Workspace',
          slug: 'sample-workspace',
          openAiTemp: 0.7,
          openAiHistory: 20,
          lastUpdatedAt: new Date(),
        }
      });
      console.log('✓ Created workspace:', workspace.name);
    } else {
      console.log('✓ Using existing workspace:', workspace.name);
    }

    // Create embed config
    let embedConfig = await prisma.embed_configs.findFirst();
    if (!embedConfig) {
      embedConfig = await prisma.embed_configs.create({
        data: {
          uuid: 'sample-embed-uuid-12345',
          workspace_id: workspace.id,
          enabled: true,
          chat_mode: 'chat',
          allow_model_override: false,
          allow_temperature_override: false,
          allow_prompt_override: false,
          max_chats_per_day: 100,
          max_chats_per_session: 20,
        }
      });
      console.log('✓ Created embed config');
    } else {
      console.log('✓ Using existing embed config');
    }

    // Create sample chats
    const sampleChats = [
      {
        embed_id: embedConfig.id,
        session_id: 'session_001_sample',
        prompt: 'Hello, I need help with my account',
        response: JSON.stringify({
          text: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com',
          name: 'John Doe',
          email: 'john@example.com'
        }),
        include: true
      },
      {
        embed_id: embedConfig.id,
        session_id: 'session_002_sample',
        prompt: 'What are your business hours?',
        response: JSON.stringify({
          text: 'Our business hours are Monday to Friday, 9 AM to 6 PM EST. We also offer 24/7 online support through this chat.',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          referer: 'https://example.com',
          name: 'Jane Smith',
          email: 'jane@example.com'
        }),
        include: true
      },
      {
        embed_id: embedConfig.id,
        session_id: 'session_003_sample',
        prompt: 'Can you help me understand your pricing plans?',
        response: JSON.stringify({
          text: 'Absolutely! We have three main pricing tiers: Basic ($9/month), Professional ($29/month), and Enterprise ($99/month).',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.3',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com',
          name: 'Bob Johnson',
          email: 'bob@example.com'
        }),
        include: true
      }
    ];

    for (const chat of sampleChats) {
      await prisma.embed_chats.create({
        data: chat
      });
    }

    console.log(`✓ Created ${sampleChats.length} sample embed chats`);

    // Verify data
    const totalChats = await prisma.embed_chats.count();
    console.log(`✓ Total embed chats in database: ${totalChats}`);

    const chatsWithConfig = await prisma.embed_chats.findMany({
      include: {
        embed_config: {
          include: {
            workspace: true
          }
        }
      }
    });

    console.log('✓ Sample chats with config:');
    chatsWithConfig.forEach(chat => {
      const connInfo = JSON.parse(chat.connection_information || '{}');
      console.log(`  - Session: ${chat.session_id}, User: ${connInfo.name || 'Unknown'}, Prompt: ${chat.prompt.substring(0, 50)}...`);
    });

    console.log('✅ Sample data creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSampleData();
