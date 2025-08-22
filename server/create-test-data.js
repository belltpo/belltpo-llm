const prisma = require('./utils/prisma');

async function createTestData() {
  console.log('Creating test data for chat dashboard...');
  
  try {
    // Clear existing embed chats
    await prisma.embed_chats.deleteMany({});
    console.log('✓ Cleared existing embed chats');

    // Get or create workspace
    let workspace = await prisma.workspaces.findFirst();
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Test Workspace',
          slug: 'test-workspace',
          openAiTemp: 0.7,
          openAiHistory: 20,
          lastUpdatedAt: new Date(),
        }
      });
      console.log('✓ Created workspace:', workspace.name);
    }

    // Get or create embed config
    let embedConfig = await prisma.embed_configs.findFirst({
      where: { workspace_id: workspace.id }
    });
    
    if (!embedConfig) {
      embedConfig = await prisma.embed_configs.create({
        data: {
          uuid: 'test-embed-uuid-123',
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
    }

    // Create test embed chats
    const testChats = [
      {
        embed_id: embedConfig.id,
        session_id: 'test_session_001',
        prompt: 'Hello, I need help with my account login',
        response: JSON.stringify({
          text: 'Hello! I can help you with your account login. What specific issue are you experiencing?'
        }),
        connection_information: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          mobile: '+1234567890',
          region: 'United States',
          ip: '192.168.1.1'
        }),
        include: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        embed_id: embedConfig.id,
        session_id: 'test_session_001',
        prompt: 'I forgot my password',
        response: JSON.stringify({
          text: 'I can help you reset your password. Please check your email for a reset link.'
        }),
        connection_information: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          mobile: '+1234567890',
          region: 'United States',
          ip: '192.168.1.1'
        }),
        include: true,
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
      },
      {
        embed_id: embedConfig.id,
        session_id: 'test_session_002',
        prompt: 'What are your business hours?',
        response: JSON.stringify({
          text: 'Our business hours are Monday to Friday, 9 AM to 6 PM EST. We also offer 24/7 online support.'
        }),
        connection_information: JSON.stringify({
          name: 'Jane Smith',
          email: 'jane@example.com',
          mobile: '+0987654321',
          region: 'United Kingdom',
          ip: '192.168.1.2'
        }),
        include: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        embed_id: embedConfig.id,
        session_id: 'test_session_003',
        prompt: 'Tell me about your pricing plans',
        response: JSON.stringify({
          text: 'We have three pricing tiers: Basic ($9/month), Professional ($29/month), and Enterprise ($99/month).'
        }),
        connection_information: JSON.stringify({
          name: 'Bob Johnson',
          email: 'bob@example.com',
          mobile: '+1122334455',
          region: 'Canada',
          ip: '192.168.1.3'
        }),
        include: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    // Insert all test chats
    for (const chat of testChats) {
      await prisma.embed_chats.create({
        data: chat
      });
    }

    console.log(`✓ Created ${testChats.length} test embed chats`);

    // Verify the data
    const totalChats = await prisma.embed_chats.count();
    console.log(`✓ Total embed chats: ${totalChats}`);

    const uniqueSessions = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: {
        session_id: true
      }
    });
    
    console.log(`✓ Unique sessions: ${uniqueSessions.length}`);
    uniqueSessions.forEach(session => {
      console.log(`  - ${session.session_id}: ${session._count.session_id} messages`);
    });

    console.log('✅ Test data created successfully!');
    console.log('Now you can visit /dashboard/chat-sessions to see the data');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
