const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(express.json());

// Serve the test HTML files directly
app.get('/test-embed-widget.html', (req, res) => {
  const filePath = path.join(__dirname, 'test-embed-widget.html');
  
  console.log(`📄 Serving test file from: ${filePath}`);
  console.log(`📁 File exists: ${fs.existsSync(filePath)}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send(`File not found: ${filePath}`);
  }
});

app.get('/direct-test-page.html', (req, res) => {
  const filePath = path.join(__dirname, 'direct-test-page.html');
  
  console.log(`📄 Serving direct test page from: ${filePath}`);
  console.log(`📁 File exists: ${fs.existsSync(filePath)}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send(`File not found: ${filePath}`);
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Simple Test Server Running',
    port: PORT,
    timestamp: new Date().toISOString(),
    testPage: `http://localhost:${PORT}/test-embed-widget.html`
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>Simple Test Server</h1>
    <p>Server is running on port ${PORT}</p>
    <p><a href="/test-embed-widget.html">Test Embed Widget</a></p>
    <p><a href="/api/test">API Test</a></p>
  `);
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 SIMPLE TEST SERVER RUNNING`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test-embed-widget.html`);
  console.log(`📊 API Test: http://localhost:${PORT}/api/test`);
  
  // Check if test file exists
  const testFile = path.join(__dirname, 'test-embed-widget.html');
  console.log(`📁 Test file path: ${testFile}`);
  console.log(`✅ Test file exists: ${fs.existsSync(testFile)}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
