// Minimal collector service without LangChain dependencies
process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { writeToServerDocuments } = require("./utils/files");
const { tokenizeString } = require("./utils/tokenizer");
const { ACCEPTED_MIMES } = require("./utils/constants");
const { reqBody } = require("./utils/http");
const { verifyPayloadIntegrity } = require("./middleware/verifyIntegrity");

const app = express();
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(
  bodyParser.text({ limit: FILE_LIMIT }),
  bodyParser.json({ limit: FILE_LIMIT }),
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

// Simple document processing without LangChain
function processDocumentContent(filename, content) {
  const id = uuidv4();
  const title = path.basename(filename, path.extname(filename));
  const extension = path.extname(filename).toLowerCase();
  
  // Basic text extraction based on file type
  let pageContent = "";
  
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
    // For other file types, use content as-is
    pageContent = content.toString();
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
app.post("/process", [verifyPayloadIntegrity], async function (request, response) {
  const { filename, options = {} } = reqBody(request);
  
  try {
    const targetFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");
    const hotDirPath = path.resolve(
      process.env.NODE_ENV === "development" 
        ? path.resolve(__dirname, `./hotdir`) 
        : process.env.STORAGE_DIR 
          ? path.resolve(process.env.STORAGE_DIR, `./hotdir`)
          : path.resolve(__dirname, `./storage/hotdir`)
    );
    
    const fullFilePath = path.resolve(hotDirPath, targetFilename);
    
    if (!fs.existsSync(fullFilePath)) {
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
    const savedDocument = await writeToServerDocuments(
      [document],
      `${document.title}-${document.id}`
    );

    response.status(200).json({
      filename: targetFilename,
      success: true,
      reason: null,
      documents: savedDocument ? [document] : [],
    });
  } catch (e) {
    console.error("Error processing file:", e);
    response.status(200).json({
      filename: filename,
      success: false,
      reason: `Failed to process file: ${e.message}`,
      documents: [],
    });
  }
});

// Process link endpoint
app.post("/process-link", [verifyPayloadIntegrity], async function (request, response) {
  const { link, options = {} } = reqBody(request);
  
  try {
    // Simple link processing without Puppeteer
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
      pageContent: `This is a placeholder for content from: ${link}\n\nTo enable full web scraping, LangChain dependencies need to be properly configured.`,
      token_count_estimate: 50,
    };

    const savedDocument = await writeToServerDocuments(
      [document],
      `${document.title}-${document.id}`
    );

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [document] : [],
    });
  } catch (e) {
    console.error("Error processing link:", e);
    response.status(200).json({
      success: false,
      reason: `Failed to process link: ${e.message}`,
      documents: [],
    });
  }
});

// Process raw text endpoint
app.post("/process-raw-text", [verifyPayloadIntegrity], async function (request, response) {
  const { textContent, metadata = {} } = reqBody(request);
  
  try {
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

    const savedDocument = await writeToServerDocuments(
      [document],
      `${document.title}-${document.id}`
    );

    response.status(200).json({
      success: true,
      reason: null,
      documents: savedDocument ? [document] : [],
    });
  } catch (e) {
    console.error("Error processing raw text:", e);
    response.status(200).json({
      success: false,
      reason: `Failed to process raw text: ${e.message}`,
      documents: [],
    });
  }
});

// Health check endpoint
app.get("/", function (_, response) {
  response.sendStatus(200);
});

// Accept file uploads
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
  console.log(`Document collector API listening at http://${host}:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
