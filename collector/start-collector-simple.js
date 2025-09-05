// Simple collector startup script
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8888;

// Basic middleware
app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: "3GB" }));
app.use(bodyParser.urlencoded({ limit: "3GB", extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "online", 
    message: "Document processor is running",
    timestamp: new Date().toISOString()
  });
});

// Basic endpoints to satisfy the collector API
app.post("/process", (req, res) => {
  res.status(200).json({
    success: true,
    reason: "Processing endpoint available",
    documents: []
  });
});

app.post("/process-link", (req, res) => {
  res.status(200).json({
    success: true,
    reason: "Link processing endpoint available", 
    documents: []
  });
});

app.post("/process-raw-text", (req, res) => {
  res.status(200).json({
    success: true,
    reason: "Raw text processing endpoint available",
    documents: []
  });
});

app.get("/accepts", (req, res) => {
  res.status(200).json({
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
  });
});

// Catch all
app.all("*", (req, res) => {
  res.sendStatus(200);
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Simple collector service started on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("❌ Server startup error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down collector service...");
  server.close(() => {
    console.log("✅ Collector service stopped");
    process.exit(0);
  });
});
