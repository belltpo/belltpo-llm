// Simple collector service without problematic dependencies
require("dotenv").config();

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

// Simple logging
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

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

// Simple document storage function
function writeToServerDocuments(document, filename) {
  try {
    const documentsFolder = process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, `../server/storage/documents`)
      : path.resolve(process.env.STORAGE_DIR || __dirname, `documents`);
    
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

// Simple document processing function
function processDocumentContent(filename, content) {
  const id = uuidv4();
  const title = path.basename(filename, path.extname(filename));
  
  // Simple text extraction based on file extension
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
  
  // Simple token count estimation (rough approximation)
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
    message: "Simple collector service is running",
    timestamp: new Date().toISOString()
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
    
    // Save to server documents
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

// Start server
const port = process.env.COLLECTOR_PORT || 8888;
const host = "0.0.0.0";

const server = app.listen(port, host, () => {
  log(`Simple collector API listening at http://${host}:${port}`);
  log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  log(`Storage directory: ${process.env.STORAGE_DIR || 'default'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log(`Port ${port} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    log(`Server error: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('Process terminated');
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  server.close(() => {
    log('Process terminated');
  });
});

module.exports = app;
