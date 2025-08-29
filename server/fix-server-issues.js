#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔧 AnythingLLM Server Issue Diagnostic & Fix Tool');
console.log('================================================\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📋 Node.js version: ${nodeVersion}`);

const requiredNodeVersion = '18.12.1';
const currentMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
if (currentMajor < 18) {
  console.error(`❌ Node.js version ${nodeVersion} is too old. Required: >= ${requiredNodeVersion}`);
  process.exit(1);
}
console.log('✅ Node.js version is compatible\n');

// Check if .env.development exists
const envPath = path.join(__dirname, '.env.development');
console.log('📋 Checking environment configuration...');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.development not found, creating from .env.example...');
  const examplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ Created .env.development from .env.example');
  } else {
    console.error('❌ .env.example not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env.development exists');
}

// Load environment
process.env.NODE_ENV = 'development';
require('dotenv').config({ path: envPath });
console.log('✅ Environment loaded\n');

// Check database file
const dbPath = path.join(__dirname, 'storage', 'anythingllm.db');
console.log('📋 Checking database...');
if (!fs.existsSync(dbPath)) {
  console.log('⚠️  Database file not found, will be created during migration');
} else {
  console.log('✅ Database file exists');
}

// Check storage directory
const storagePath = path.join(__dirname, 'storage');
if (!fs.existsSync(storagePath)) {
  console.log('📁 Creating storage directory...');
  fs.mkdirSync(storagePath, { recursive: true });
  console.log('✅ Storage directory created');
}

console.log('✅ Database setup complete\n');

// Test port availability
const net = require('net');
const port = process.env.SERVER_PORT || 3001;

console.log(`📋 Checking port ${port} availability...`);

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    server.on('error', () => {
      resolve(false);
    });
  });
}

checkPort(port).then(available => {
  if (available) {
    console.log(`✅ Port ${port} is available\n`);
    startServer();
  } else {
    console.log(`⚠️  Port ${port} is in use. Trying port ${parseInt(port) + 1}...`);
    process.env.SERVER_PORT = parseInt(port) + 1;
    startServer();
  }
});

function startServer() {
  console.log('🚀 Starting AnythingLLM server...');
  console.log('=====================================\n');
  
  // Set environment variables
  process.env.NODE_ENV = 'development';
  process.env.VECTOR_DB = 'lancedb';
  process.env.WHISPER_PROVIDER = 'local';
  process.env.TTS_PROVIDER = 'native';
  
  // Generate secure keys if not set
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'my-random-string-for-seeding') {
    process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
    console.log('🔐 Generated new JWT_SECRET');
  }
  
  if (!process.env.SIG_KEY || process.env.SIG_KEY === 'passphrase') {
    process.env.SIG_KEY = require('crypto').randomBytes(32).toString('hex');
    console.log('🔐 Generated new SIG_KEY');
  }
  
  if (!process.env.SIG_SALT || process.env.SIG_SALT === 'salt') {
    process.env.SIG_SALT = require('crypto').randomBytes(32).toString('hex');
    console.log('🔐 Generated new SIG_SALT');
  }
  
  try {
    // Initialize the server
    require('./index.js');
    
    // Give it a moment to start
    setTimeout(() => {
      console.log('\n✅ Server initialization complete!');
      console.log(`🌐 Server should be running at: http://localhost:${process.env.SERVER_PORT || 3001}`);
      console.log('\n📝 Next steps:');
      console.log('1. Open your browser and navigate to the URL above');
      console.log('2. Complete the initial setup if this is your first time');
      console.log('3. Configure your LLM provider in the settings');
      console.log('\n💡 To stop the server, press Ctrl+C');
    }, 2000);
    
  } catch (error) {
    console.error('\n❌ Server startup failed:', error.message);
    console.error('\n🔍 Error details:', error.stack);
    
    // Common fixes
    console.log('\n🛠️  Possible fixes:');
    console.log('1. Run: npm install or yarn install');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npx prisma migrate dev --name init');
    console.log('4. Check if all dependencies are installed');
    console.log('5. Ensure Node.js version >= 18.12.1');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down server...');
  process.exit(0);
});
