const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestEmbedData() {
  try {
    // First create a workspace if it doesn't exist
    let workspace = await prisma.workspaces.findFirst();
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Test Workspace',
          slug: 'test-workspace',
          createdAt: new Date(),
          lastUpdatedAt: new Date()
        }
      });
    }

    // Create an embed config if it doesn't exist
    let embedConfig = await prisma.embed_configs.findFirst();
    if (!embedConfig) {
      embedConfig = await prisma.embed_configs.create({
        data: {
          workspace_id: workspace.id,
          enabled: true,
          chat_mode: 'chat',
          allow_model_override: false,
          allow_temperature_override: false,
          allow_prompt_override: false,
          max_chats_per_day: 20,
          max_chats_per_session: 20,
          createdAt: new Date()
        }
      });
    }

    // Create sample embed chat sessions
    const sessions = [
      {
        sessionId: 'session_001',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userMobile: '+1234567890',
        userRegion: 'US'
      },
      {
        sessionId: 'session_002', 
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        userMobile: '+0987654321',
        userRegion: 'UK'
      },
      {
        sessionId: 'session_003',
        userName: 'Bob Johnson',
        userEmail: 'bob@example.com',
        userMobile: '+1122334455',
        userRegion: 'CA'
      }
    ];

    for (const session of sessions) {
      const connectionInfo = JSON.stringify({
        name: session.userName,
        email: session.userEmail,
        mobile: session.userMobile,
        region: session.userRegion
      });

      // Create multiple chat messages for each session
      const chats = [
        {
          prompt: 'Hello, I need help with my account',
          response: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?'
        },
        {
          prompt: 'I can\'t log into my dashboard',
          response: 'I understand you\'re having trouble logging in. Let me help you troubleshoot this issue. Have you tried resetting your password recently?'
        },
        {
          prompt: 'Yes, I tried that but it didn\'t work',
          response: 'I see. Let me check a few more things. Can you tell me what error message you\'re seeing when you try to log in?'
        }
      ];

      for (let i = 0; i < chats.length; i++) {
        await prisma.embed_chats.create({
          data: {
            prompt: chats[i].prompt,
            response: chats[i].response,
            session_id: session.sessionId,
            connection_information: connectionInfo,
            embed_id: embedConfig.id,
            include: true,
            createdAt: new Date(Date.now() - (chats.length - i) * 60000) // Spread messages over time
          }
        });
      }
    }

    console.log('✅ Test embed chat data created successfully!');
    console.log(`Created ${sessions.length} sessions with multiple chat messages each`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEmbedData();
