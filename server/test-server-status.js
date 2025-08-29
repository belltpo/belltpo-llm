const express = require('express');
const cors = require('cors');
const { createAlternativeDashboard } = require('./create-alternative-dashboard');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    port: 3001
  });
});

// Add alternative dashboard endpoints
createAlternativeDashboard(app);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TEST SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Test URL: http://localhost:${PORT}/test`);
  console.log(`📊 Sessions API: http://localhost:${PORT}/api/alternative-dashboard/sessions`);
  console.log(`💬 Session Details: http://localhost:${PORT}/api/alternative-dashboard/sessions/{sessionId}`);
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
