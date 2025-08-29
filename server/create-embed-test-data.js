const prisma = require('./utils/prisma');
const { v4: uuidv4 } = require('uuid');

async function createEmbedTestData() {
  try {
    console.log('=== CREATING EMBED TEST DATA ===');
    
    // First, clear existing embed chats
    await prisma.embed_chats.deleteMany({});
    console.log('✅ Cleared existing embed chats');
    
    // Check if workspace exists, create if not
    let workspace = await prisma.workspaces.findFirst({
      where: { name: 'Test Workspace' }
    });
    
    if (!workspace) {
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Test Workspace',
          slug: 'test-workspace',
          vectorTag: 'test-vector',
          chatProvider: 'openai',
          chatModel: 'gpt-3.5-turbo'
        }
      });
      console.log('✅ Created test workspace:', workspace.name);
    }
    
    // Check if embed config exists, create if not
    let embedConfig = await prisma.embed_configs.findFirst({
      where: { workspace_id: workspace.id }
    });
    
    if (!embedConfig) {
      embedConfig = await prisma.embed_configs.create({
        data: {
          uuid: uuidv4(),
          enabled: true,
          chat_mode: 'chat',
          workspace_id: workspace.id,
          max_chats_per_day: 100,
          max_chats_per_session: 20,
          message_limit: 20
        }
      });
      console.log('✅ Created embed config:', embedConfig.uuid);
    }
    
    // Create sample users with different session IDs
    const sampleUsers = [
      {
        sessionId: 'session_user1_' + Date.now(),
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '+1234567890',
        region: 'North America'
      },
      {
        sessionId: 'session_gokul_' + Date.now(),
        name: 'Gokul',
        email: 'gokul@example.com', 
        mobile: '+9876543210',
        region: 'Asia'
      },
      {
        sessionId: 'session_alice_' + Date.now(),
        name: 'Alice Smith',
        email: 'alice@example.com',
        mobile: '+1122334455',
        region: 'Europe'
      },
      {
        sessionId: 'session_bob_' + Date.now(),
        name: 'Bob Johnson',
        email: 'bob@example.com',
        mobile: '+5566778899',
        region: 'Australia'
      }
    ];
    
    // Create conversations for each user
    for (const user of sampleUsers) {
      console.log(`\nCreating conversations for ${user.name}...`);
      
      const conversations = [
        {
          prompt: "Hello, I need help with my account",
          response: { 
            text: "Hello! I'd be happy to help you with your account. What specific issue are you experiencing?",
            type: "chat",
            sources: [],
            metrics: { totalTime: 1200 }
          }
        },
        {
          prompt: "I can't log into my dashboard",
          response: {
            text: "I understand you're having trouble logging into your dashboard. Let me help you troubleshoot this issue. Can you tell me what error message you're seeing?",
            type: "chat", 
            sources: [],
            metrics: { totalTime: 1500 }
          }
        },
        {
          prompt: "It says invalid credentials",
          response: {
            text: "The 'invalid credentials' error usually means either your email or password is incorrect. Here are a few steps to resolve this:\n\n1. Double-check your email address for typos\n2. Ensure caps lock is off when entering your password\n3. Try resetting your password if you're still having issues\n\nWould you like me to guide you through the password reset process?",
            type: "chat",
            sources: [],
            metrics: { totalTime: 2100 }
          }
        }
      ];
      
      // Add some users with more conversations
      if (user.name === 'Gokul') {
        conversations.push(
          {
            prompt: "Yes, please help me reset my password",
            response: {
              text: "I'll guide you through the password reset process:\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link in the email to create a new password\n\nThe reset link will expire in 24 hours for security. Let me know if you need any clarification on these steps!",
              type: "chat",
              sources: [],
              metrics: { totalTime: 1800 }
            }
          },
          {
            prompt: "Thank you, that worked perfectly!",
            response: {
              text: "You're very welcome! I'm glad I could help you get back into your account. Is there anything else you need assistance with today?",
              type: "chat",
              sources: [],
              metrics: { totalTime: 900 }
            }
          }
        );
      }
      
      // Create embed chats for this user
      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        const createdAt = new Date(Date.now() - (conversations.length - i) * 60000); // Space out by minutes
        
        await prisma.embed_chats.create({
          data: {
            prompt: conv.prompt,
            response: JSON.stringify(conv.response),
            session_id: user.sessionId,
            embed_id: embedConfig.id,
            connection_information: JSON.stringify({
              name: user.name,
              email: user.email,
              mobile: user.mobile,
              region: user.region,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              ipAddress: '192.168.1.' + Math.floor(Math.random() * 255)
            }),
            createdAt: createdAt,
            include: true
          }
        });
      }
      
      console.log(`✅ Created ${conversations.length} conversations for ${user.name}`);
    }
    
    // Verify data was created
    const totalChats = await prisma.embed_chats.count();
    const uniqueSessions = await prisma.embed_chats.groupBy({
      by: ['session_id'],
      _count: { session_id: true }
    });
    
    console.log('\n=== EMBED TEST DATA CREATED ===');
    console.log(`Total embed chats: ${totalChats}`);
    console.log(`Unique sessions: ${uniqueSessions.length}`);
    console.log('Session details:');
    
    for (const session of uniqueSessions) {
      const firstChat = await prisma.embed_chats.findFirst({
        where: { session_id: session.session_id },
        orderBy: { createdAt: 'asc' }
      });
      
      if (firstChat?.connection_information) {
        const connInfo = JSON.parse(firstChat.connection_information);
        console.log(`- ${connInfo.name} (${connInfo.email}): ${session._count.session_id} messages`);
      }
    }
    
    return { totalChats, uniqueSessions: uniqueSessions.length };
    
  } catch (error) {
    console.error('Error creating embed test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createEmbedTestData()
    .then(result => {
      console.log('\n🎉 SUCCESS: Embed test data created!');
      console.log('Now you can test the dashboard with real chat conversations.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to create test data:', error);
      process.exit(1);
    });
}

module.exports = { createEmbedTestData };
