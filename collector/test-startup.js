// Test collector startup
console.log('Testing collector startup...');

try {
  // Load environment variables
  process.env.NODE_ENV === "development"
    ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
    : require("dotenv").config();
  
  console.log('Environment loaded successfully');
  
  // Test basic requires
  require("./utils/logger")();
  console.log('Logger loaded successfully');
  
  const express = require("express");
  console.log('Express loaded successfully');
  
  const app = express();
  console.log('Express app created successfully');
  
  // Test port binding
  const port = 8888;
  const server = app.listen(port, () => {
    console.log(`✅ Collector service started successfully on port ${port}`);
    console.log(`Test server is running at http://localhost:${port}`);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
  });
  
  // Add basic route for testing
  app.get('/', (req, res) => {
    res.json({ status: 'Collector service is running', timestamp: new Date().toISOString() });
  });
  
} catch (error) {
  console.error('❌ Startup error:', error);
  process.exit(1);
}
