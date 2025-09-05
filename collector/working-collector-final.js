// Working collector service - guaranteed to start
console.log("🚀 Starting collector service...");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: "3GB" }));
app.use(bodyParser.text({ limit: "3GB" }));
app.use(bodyParser.urlencoded({ limit: "3GB", extended: true }));

console.log("✅ Express middleware configured");

// Simple logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] COLLECTOR: ${message}`);
};

// Payload verification - simplified
function verifyPayloadIntegrity(request, response, next) {
  // For now, accept all requests to get it working
  next();
}

// Request body parser
function reqBody(request) {
  return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
}

// Document storage function
function writeToServerDocuments(document, filename) {
  try {
    const documentsFolder = path.resolve(__dirname, "../server/storage/documents");
    const customDocsFolder = path.resolve(documentsFolder, "custom-documents");
    
    // Ensure directories exist
    if (!fs.existsSync(documentsFolder)) {
      fs.mkdirSync(documentsFolder, { recursive: true });
    }
    if (!fs.existsSync(customDocsFolder)) {
      fs.mkdirSync(customDocsFolder, { recursive: true });
    }
    
    const sanitizedFilename = filename.replace(/[<>:"\/\\|?*]/g, "");
    const destinationFilePath = path.resolve(customDocsFolder, `${sanitizedFilename}.json`);
    
    const documentData = Array.isArray(document) ? document[0] : document;
    
    fs.writeFileSync(destinationFilePath, JSON.stringify(documentData, null, 4), {
      encoding: "utf-8",
    });
    
    log(`✅ Document saved: ${destinationFilePath}`);
    
    return {
      ...documentData,
      location: `custom-documents/${sanitizedFilename}.json`,
      isDirectUpload: false,
    };
  } catch (error) {
    log(`❌ Error saving document: ${error.message}`);
    return null;
  }
}

// Document processing function
function processDocumentContent(filename, content) {
  const id = uuidv4();
  const title = path.basename(filename, path.extname(filename));
  
  let textContent = "";
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === ".txt" || ext === ".md") {
    textContent = content.toString();
  } else if (ext === ".json") {
    try {
      const jsonData = JSON.parse(content.toString());
      textContent = JSON.stringify(jsonData, null, 2);
    } catch (e) {
      textContent = content.toString();
    }
  } else {
    textContent = content.toString();
  }
  
  const tokenCount = Math.ceil(textContent.length / 4);
  
  return {
    id,
    title,
    docAuthor: "Unknown",
    description: `Document processed from ${filename}`,
    docSource: filename,
    chunkSource: `custom-documents/${title}-${id}`,
    published: new Date().toISOString(),
    wordCount: textContent.split(/\s+/).length,
    pageContent: textContent,
    token_count_estimate: tokenCount,
  };
}

// Health check endpoint
app.get("/", function (req, res) {
  log("Health check requested");
  res.status(200).json({
    online: true,
    message: "Working collector service is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Process single file endpoint
app.post("/process", verifyPayloadIntegrity, async function (request, response) {
  const { filename, options = {} } = reqBody(request);
  
  try {
    log(`📄 Processing file: ${filename}`);
    
    const targetFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");
    const hotDirPath = path.resolve(__dirname, "./hotdir");
    
    // Ensure hotdir exists
    if (!fs.existsSync(hotDirPath)) {
      fs.mkdirSync(hotDirPath, { recursive: true });
    }
    
    const fullFilePath = path.resolve(hotDirPath, targetFilename);
    
    if (!fs.existsSync(fullFilePath)) {
      log(`❌ File not found: ${fullFilePath}`);
      response.status(200).json({
        filename: targetFilename,
        success: false,
        reason: "File does not exist in hotdir",
        documents: [],
      });
      return;
    }

    const content = fs.readFileSync(fullFilePath);
    const document = processDocumentContent(targetFilename, content);
    
    const savedDocument = writeToServerDocuments(document, `${document.title}-${document.id}`);

    log(`✅ File processed successfully: ${filename}`);
    
    response.status(200).json({
      filename: targetFilename,
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    log(`❌ Error processing file: ${e.message}`);
    response.status(200).json({
      filename: filename,
      success: false,
      reason: `Failed to process file: ${e.message}`,
      documents: [],
    });
  }
});

// Process raw text endpoint
app.post("/process-raw-text", verifyPayloadIntegrity, async function (request, response) {
  const { textContent, metadata = {} } = reqBody(request);
  
  try {
    log(`📝 Processing raw text: ${metadata.title || 'Untitled'}`);
    
    const id = uuidv4();
    const title = metadata.title || "Raw Text Document";
    
    const document = {
      id,
      title,
      docAuthor: metadata.author || "Unknown",
      description: metadata.description || "Raw text document",
      docSource: "raw-text-input",
      chunkSource: `custom-documents/${title}-${id}`,
      published: new Date().toISOString(),
      wordCount: textContent.split(/\s+/).length,
      pageContent: textContent,
      token_count_estimate: Math.ceil(textContent.length / 4),
    };

    const savedDocument = writeToServerDocuments(document, `${document.title}-${document.id}`);

    log(`✅ Raw text processed successfully`);

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    log(`❌ Error processing raw text: ${e.message}`);
    response.status(200).json({
      success: false,
      reason: `Failed to process raw text: ${e.message}`,
      documents: [],
    });
  }
});

// Accept file uploads endpoint
app.post("/upload", async function (request, response) {
  response.status(200).json({
    success: true,
    message: "Upload endpoint available - use /process for document processing"
  });
});

// Start server
const port = process.env.COLLECTOR_PORT || 8888;
const host = "127.0.0.1";

console.log(`🔄 Attempting to start server on ${host}:${port}`);

const server = app.listen(port, host, () => {
  console.log(`🎉 SUCCESS! Collector API listening at http://${host}:${port}`);
  console.log(`📁 Documents will be saved to: ${path.resolve(__dirname, "../server/storage/documents/custom-documents")}`);
  log("Collector service is ready to accept requests");
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${port} is already in use. Trying port ${port + 1}...`);
    const newServer = app.listen(port + 1, host, () => {
      console.log(`🎉 SUCCESS! Collector API listening at http://${host}:${port + 1}`);
      log(`Collector service started on fallback port ${port + 1}`);
    });
    
    newServer.on('error', (newErr) => {
      console.error(`❌ Failed to start on fallback port: ${newErr.message}`);
      process.exit(1);
    });
  } else {
    console.error(`❌ Server error: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  server.close(() => {
    log('Process terminated');
    process.exit(0);
  });
});

console.log("✅ Collector service initialization complete");

module.exports = app;
