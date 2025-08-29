const express = require('express');
const { createAlternativeDashboard } = require('./create-alternative-dashboard');

const app = express();
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create alternative dashboard endpoints
createAlternativeDashboard(app);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'Alternative API server is running', timestamp: new Date() });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n=== ALTERNATIVE DASHBOARD API SERVER ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log(`- GET http://localhost:${PORT}/test`);
  console.log(`- GET http://localhost:${PORT}/api/alternative-dashboard/sessions`);
  console.log(`- GET http://localhost:${PORT}/api/alternative-dashboard/sessions/{sessionId}`);
  console.log('\nThis server bypasses authentication and provides direct database access.');
});
