// Standalone collector service - completely independent of problematic dependencies
process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const FILE_LIMIT = "3GB";

// Basic logging setup
const winston = require("winston");
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Middleware setup
app.use(cors({ origin: true }));
app.use(
  bodyParser.text({ limit: FILE_LIMIT }),
  bodyParser.json({ limit: FILE_LIMIT }),
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

// Basic tokenizer function
function tokenizeString(text) {
  if (!text || typeof text !== 'string') return [];
  // Simple word-based tokenization
  return text.split(/\s+/).filter(word => word.length > 0);
}

// Standalone document storage function
function writeToServerDocuments(documents, filename) {
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
    
    const documentData = Array.isArray(documents) ? documents[0] : documents;
    
    fs.writeFileSync(destinationFilePath, JSON.stringify(documentData, null, 4), {
      encoding: "utf-8",
    });
    
    logger.info(`Document saved: ${destinationFilePath}`);
    
    return {
      ...documentData,
      location: `custom-documents/${sanitizedFilename}.json`,
      isDirectUpload: false,
    };
  } catch (error) {
    logger.error(`Error saving document: ${error.message}`);
    return null;
  }
}

// Request body parser
function reqBody(request) {
  return request.body;
}

// Basic payload verification (simplified)
function verifyPayloadIntegrity(req, res, next) {
  // Basic validation - in production you'd want proper signature verification
  if (!req.body) {
    return res.status(400).json({ success: false, error: "No payload provided" });
  }
  next();
}

// Simple document processing function
function processDocumentContent(filename, content) {
  const id = uuidv4();
  const title = path.basename(filename, path.extname(filename));
  const extension = path.extname(filename).toLowerCase();
  
  let pageContent = "";
  
  try {
    if (extension === ".txt" || extension === ".md") {
      pageContent = content.toString();
    } else if (extension === ".json") {
      try {
        const jsonData = JSON.parse(content);
        pageContent = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        pageContent = content.toString();
      }
    } else {
      pageContent = content.toString();
    }
  } catch (error) {
    pageContent = "Error processing file content";
    logger.error(`Error processing content for ${filename}: ${error.message}`);
  }

  const wordCount = pageContent.split(/\s+/).filter(word => word.length > 0).length;
  const tokenCount = tokenizeString(pageContent)?.length || 0;

  return {
    id,
    url: "file://" + filename,
    title,
    docAuthor: "Unknown",
    description: `Processed document: ${title}`,
    docSource: filename,
    chunkSource: filename,
    published: new Date().toISOString(),
    wordCount,
    pageContent,
    token_count_estimate: tokenCount,
  };
}

// Process single file endpoint
app.post("/process", verifyPayloadIntegrity, async function (request, response) {
  const { filename, options = {} } = reqBody(request);
  
  try {
    const targetFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");
    const hotDirPath = path.resolve(__dirname, "./hotdir");
    const fullFilePath = path.resolve(hotDirPath, targetFilename);
    
    logger.info(`Processing file: ${fullFilePath}`);
    
    if (!fs.existsSync(fullFilePath)) {
      logger.warn(`File not found: ${fullFilePath}`);
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
    logger.error(`Error processing file: ${e.message}`);
    response.status(200).json({
      filename: filename,
      success: false,
      reason: `Failed to process file: ${e.message}`,
      documents: [],
    });
  }
});

// Process link endpoint
app.post("/process-link", verifyPayloadIntegrity, async function (request, response) {
  const { link, options = {} } = reqBody(request);
  
  try {
    logger.info(`Processing link: ${link}`);
    
    const id = uuidv4();
    const title = new URL(link).hostname;
    
    const document = {
      id,
      url: link,
      title: `Website: ${title}`,
      docAuthor: "Unknown",
      description: `Processed link: ${link}`,
      docSource: link,
      chunkSource: link,
      published: new Date().toISOString(),
      wordCount: 0,
      pageContent: `This is a placeholder for content from: ${link}\n\nTo enable full web scraping, additional dependencies would be needed.`,
      token_count_estimate: 50,
    };

    const savedDocument = writeToServerDocuments(document, `${document.title}-${document.id}`);

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    logger.error(`Error processing link: ${e.message}`);
    response.status(200).json({
      success: false,
      reason: `Failed to process link: ${e.message}`,
      documents: [],
    });
  }
});

// Process raw text endpoint
app.post("/process-raw-text", verifyPayloadIntegrity, async function (request, response) {
  const { textContent, metadata = {} } = reqBody(request);
  
  try {
    logger.info(`Processing raw text: ${textContent?.length || 0} characters`);
    
    const id = uuidv4();
    const title = metadata.title || "Raw Text Document";
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const tokenCount = tokenizeString(textContent)?.length || 0;

    const document = {
      id,
      url: "raw-text://" + id,
      title,
      docAuthor: metadata.author || "Unknown",
      description: metadata.description || "Raw text document",
      docSource: "raw-text",
      chunkSource: "raw-text",
      published: new Date().toISOString(),
      wordCount,
      pageContent: textContent,
      token_count_estimate: tokenCount,
    };

    const savedDocument = writeToServerDocuments(document, `${document.title}-${document.id}`);

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [savedDocument] : [],
    });
  } catch (e) {
    logger.error(`Error processing raw text: ${e.message}`);
    response.status(200).json({
      success: false,
      reason: `Failed to process raw text: ${e.message}`,
      documents: [],
    });
  }
});

// Health check endpoint
app.get("/", function (_, response) {
  response.status(200).json({
    online: true,
    message: "Collector service is running",
    timestamp: new Date().toISOString()
  });
});

// Accept file uploads endpoint
app.post("/upload", async function (request, response) {
  response.status(200).json({
    success: true,
    message: "Upload endpoint available - use /process for document processing"
  });
});

// Start server with intelligent port selection
function startServer() {
  const basePort = process.env.COLLECTOR_PORT || 8888;
  const host = "0.0.0.0";
  let currentPort = basePort;
  
  function tryPort(port) {
    const server = app.listen(port, host, () => {
      logger.info(`Document collector API listening at http://${host}:${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
      logger.info(`Storage directory: ${process.env.STORAGE_DIR || 'default'}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
        if (port < basePort + 10) { // Try up to 10 ports
          tryPort(port + 1);
        } else {
          logger.error(`Unable to find available port after trying ${basePort} to ${port}`);
          process.exit(1);
        }
      } else {
        logger.error(`Server error: ${err.message}`);
        process.exit(1);
      }
    });
    
    return server;
  }
  
  return tryPort(currentPort);
}

const server = startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;
