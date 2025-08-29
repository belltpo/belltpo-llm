// Test script to identify server startup issues
console.log('=== AnythingLLM Server Startup Test ===');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());

try {
  // Test environment loading
  console.log('\n1. Testing environment loading...');
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Load dotenv
  if (process.env.NODE_ENV === "development") {
    require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
  } else {
    require("dotenv").config();
  }
  console.log('✓ Environment loaded');

  // Test logger
  console.log('\n2. Testing logger...');
  require("./utils/logger")();
  console.log('✓ Logger initialized');

  // Test basic dependencies
  console.log('\n3. Testing core dependencies...');
  const express = require("express");
  const bodyParser = require("body-parser");
  const cors = require("cors");
  const path = require("path");
  console.log('✓ Core dependencies loaded');

  // Test Prisma client
  console.log('\n4. Testing Prisma client...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log('✓ Prisma client created');

  // Test database connection
  console.log('\n5. Testing database connection...');
  prisma.$connect()
    .then(() => {
      console.log('✓ Database connected successfully');
      return prisma.system_settings.findMany({ take: 1 });
    })
    .then((settings) => {
      console.log('✓ Database query successful, found', settings.length, 'settings');
      
      // Test server creation
      console.log('\n6. Testing server creation...');
      const app = express();
      app.use(cors({ origin: true }));
      app.use(bodyParser.json());
      
      const server = app.listen(3001, () => {
        console.log('✓ Server started successfully on port 3001');
        console.log('\n=== All tests passed! Server should be working ===');
        server.close();
        process.exit(0);
      });
      
      server.on('error', (err) => {
        console.error('✗ Server error:', err.message);
        if (err.code === 'EADDRINUSE') {
          console.log('Port 3001 is already in use. This might be why the server appears not to be running.');
        }
        process.exit(1);
      });
      
    })
    .catch((error) => {
      console.error('✗ Database connection failed:', error.message);
      process.exit(1);
    });

} catch (error) {
  console.error('✗ Startup test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
