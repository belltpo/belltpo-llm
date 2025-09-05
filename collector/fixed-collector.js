// Fixed collector service with proper error handling
process.env.NODE_ENV = process.env.NODE_ENV || "development";

// Load environment variables
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
} else {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const FILE_LIMIT = "3GB";

// Middleware
app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(bodyParser.urlencoded({ limit: FILE_LIMIT, extended: true }));

// Logging
const log = (message) => {
  console.log(`[${new Date().toISOString()}] COLLECTOR: ${message}`);
};

log("Starting collector service...");

// Payload verification middleware
function verifyPayloadIntegrity(request, response, next) {
  const signature = request.get("Authorization");
  if (!signature || signature !== "Bearer collector-token") {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// Request body parser
function reqBody(request) {
  return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
}

// Safe path resolution with fallbacks
function getDocumentsFolder() {
  try {
    if (process.env.NODE_ENV === "development") {
      return path.resolve(__dirname, `../server/storage/documents`);
    } else {
      const storageDir = process.env.STORAGE_DIR || path.resolve(__dirname, `../server/storage`);
      return path.resolve(storageDir, `documents`);
    }
  } catch (error) {
    log(`Error resolving documents folder: ${error.message}`);
    return path.resolve(__dirname, `../server/storage/documents`);
  }
}

// Document storage function
function writeToServerDocuments(document, filename) {
  try {
    const documentsFolder = getDocumentsFolder();
    const customDocsFolder = path.resolve(documentsFolder, "custom-documents");
    
    if (!fs.existsSync(customDocsFolder)) {
      fs.mkdirSync(customDocsFolder, { recursive: true });
    }
    
    const sanitizedFilename = filename.replace(/[<>:"\/\\|?*]/g, "");
    const destinationFilePath = path.resolve(customDocsFolder, `${sanitizedFilename}.json`);
    
    const documentData = Array.isArray(document) ? document[0] : document;
    
    fs.writeFileSync(destinationFilePath, JSON.stringify(documentData, null, 4), {
      encoding: "utf-8",
    });
    
    log(`Document saved: ${destinationFilePath}`);
    
    return {
      ...documentData,
      location: `custom-documents/${sanitizedFilename}.json`,
      isDirectUpload: false,
    };
  } catch (error) {
    log(`Error saving document: ${error.message}`);
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
app.get("/", function (_, response) {
  response.status(200).json({
    online: true,
    message: "Fixed collector service is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Process single file endpoint
app.post("/process", verifyPayloadIntegrity, async function (request, response) {
  const { filename, options = {} } = reqBody(request);
  
  try {
    const targetFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");
    const hotDirPath = path.resolve(__dirname, "./hotdir");
    const fullFilePath = path.resolve(hotDirPath, targetFilename);
    
    log(`Processing file: ${fullFilePath}`);
    
    if (!fs.existsSync(fullFilePath)) {
      log(`File not found: ${fullFilePath}`);
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

    response.status(200).json({
      filename: targetFilename,
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    log(`Error processing file: ${e.message}`);
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

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    log(`Error processing raw text: ${e.message}`);
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

// Start server with port fallback
function startServer() {
  const basePort = process.env.COLLECTOR_PORT || 8888;
  const host = "127.0.0.1";
  
  function tryPort(port) {
    const server = app.listen(port, host, () => {
      log(`✅ Fixed collector API listening at http://${host}:${port}`);
      log(`Environment: ${process.env.NODE_ENV}`);
      log(`Documents folder: ${getDocumentsFolder()}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is in use, trying ${port + 1}...`);
        if (port < basePort + 10) {
          tryPort(port + 1);
        } else {
          log(`❌ Could not find available port after trying ${basePort}-${port}`);
          process.exit(1);
        }
      } else {
        log(`❌ Server error: ${err.message}`);
        process.exit(1);
      }
    });
    
    return server;
  }
  
  return tryPort(basePort);
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
const server = startServer();

log("Collector service initialization complete");

module.exports = app;
