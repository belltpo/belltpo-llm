const prisma = require('./utils/prisma');

async function createSampleData() {
  try {
    console.log('Creating sample embed chat data...');
    
    // Always create fresh sample data (remove existing first)
    await prisma.embed_chats.deleteMany({});
    console.log('Cleared existing embed chats');

    // First, create a workspace if none exists
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
      console.log('Created sample workspace:', workspace.name);
    }

    // Create embed config if none exists
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
      console.log('Created sample embed config');
    }

    // Create sample prechat users in Django database
    try {
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.join(__dirname, '../prechat_widget/db.sqlite3');
      
      // Check if Django database exists
      if (!fs.existsSync(dbPath)) {
        console.log('Django database not found, skipping prechat user creation');
      } else {
        const db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('Error opening Django database:', err);
            return;
          }
        });

        // Insert sample prechat users
        const sampleUsers = [
          {
            name: 'John Doe',
            email: 'john@example.com',
            mobile: '+1234567890',
            region: 'United States',
            session_token: 'session_001_sample'
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            mobile: '+0987654321',
            region: 'United Kingdom',
            session_token: 'session_002_sample'
          },
          {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            mobile: '+1122334455',
            region: 'Canada',
            session_token: 'session_003_sample'
          }
        ];

        for (const user of sampleUsers) {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO prechat_submissions 
              (name, email, mobile, region, session_token, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [user.name, user.email, user.mobile, user.region, user.session_token], 
            function(err) {
              if (err) {
                console.error('Error inserting prechat user:', err);
                reject(err);
              } else {
                console.log('Created prechat user:', user.name);
                resolve();
              }
            });
          });
        }

        db.close();
      }
    } catch (sqliteError) {
      console.log('sqlite3 not available or Django DB not accessible, continuing without prechat users');
    }

    // Create sample embed chats
    const sampleChats = [
      {
        embed_id: embedConfig.id,
        session_id: 'session_001_sample',
        prompt: 'Hello, I need help with my account',
        response: JSON.stringify({
          text: 'Hello John! I\'d be happy to help you with your account. What specific issue are you experiencing?',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com'
        }),
        include: true
      },
      {
        embed_id: embedConfig.id,
        session_id: 'session_001_sample',
        prompt: 'I forgot my password and cannot log in',
        response: JSON.stringify({
          text: 'I can help you reset your password. Please check your email for a password reset link, or I can guide you through the process.',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com'
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
          referer: 'https://example.com'
        }),
        include: true
      },
      {
        embed_id: embedConfig.id,
        session_id: 'session_003_sample',
        prompt: 'Can you help me understand your pricing plans?',
        response: JSON.stringify({
          text: 'Absolutely! We have three main pricing tiers: Basic ($9/month), Professional ($29/month), and Enterprise ($99/month). Each plan includes different features and support levels.',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.3',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com'
        }),
        include: true
      },
      {
        embed_id: embedConfig.id,
        session_id: 'session_003_sample',
        prompt: 'What features are included in the Professional plan?',
        response: JSON.stringify({
          text: 'The Professional plan includes: unlimited projects, advanced analytics, priority support, API access, and team collaboration features for up to 10 users.',
          sources: []
        }),
        connection_information: JSON.stringify({
          ip: '192.168.1.3',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referer: 'https://example.com'
        }),
        include: true
      }
    ];

    for (const chat of sampleChats) {
      await prisma.embed_chats.create({
        data: chat
      });
    }

    console.log(`Created ${sampleChats.length} sample embed chats`);
    console.log('Sample data creation completed successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
