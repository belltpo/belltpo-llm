// Test collector service - minimal version
console.log("Starting test collector...");

const express = require("express");
const app = express();

console.log("Express loaded successfully");

app.use(express.json());

console.log("Middleware configured");

// Health check endpoint
app.get("/", function (req, res) {
  console.log("Health check requested");
  res.status(200).json({
    online: true,
    message: "Test collector service is running",
    timestamp: new Date().toISOString()
  });
});

console.log("Routes configured");

// Start server
const port = 8888;
const host = "127.0.0.1";

console.log(`Attempting to start server on ${host}:${port}`);

const server = app.listen(port, host, () => {
  console.log(`✅ Test collector API listening at http://${host}:${port}`);
});

server.on('error', (err) => {
  console.error(`❌ Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
    const newServer = app.listen(port + 1, host, () => {
      console.log(`✅ Test collector API listening at http://${host}:${port + 1}`);
    });
  }
});

console.log("Server startup initiated");
