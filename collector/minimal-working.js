const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const path = require('path'); 
const fs = require('fs'); 
const { v4: uuidv4 } = require('uuid'); 
 
const app = express(); 
app.use(cors({ origin: true })); 
app.use(bodyParser.json({ limit: '3GB' })); 
app.use(bodyParser.text({ limit: '3GB' })); 
app.use(bodyParser.urlencoded({ limit: '3GB', extended: true })); 
 
const log = (msg) => console.log(`[${new Date().toISOString()}] COLLECTOR: ${msg}`); 
 
function writeToServerDocuments(document, filename) { 
  try { 
    const documentsFolder = path.resolve(__dirname, '../server/storage/documents'); 
    const customDocsFolder = path.resolve(documentsFolder, 'custom-documents'); 
    if (!fs.existsSync(customDocsFolder)) fs.mkdirSync(customDocsFolder, { recursive: true }); 
    const sanitizedFilename = filename.replace(/[a-zA-Z0-9._-]/g, ''); 
    const destinationFilePath = path.resolve(customDocsFolder, `${sanitizedFilename}.json`); 
    const documentData = Array.isArray(document) ? document[0] : document; 
    fs.writeFileSync(destinationFilePath, JSON.stringify(documentData, null, 4)); 
    log(`Document saved: ${destinationFilePath}`); 
    return { ...documentData, location: `custom-documents/${sanitizedFilename}.json` }; 
  } catch (error) { 
    log(`Error saving document: ${error.message}`); 
    return null; 
  } 
} 
 
app.get('/', (req, res) => { 
  log('Health check requested'); 
  res.json({ online: true, message: 'Collector running', timestamp: new Date().toISOString() }); 
}); 
 
app.post('/process', (req, res) => { 
  const { filename } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; 
  log(`Processing file: ${filename}`); 
  const hotDirPath = path.resolve(__dirname, './hotdir'); 
  const fullFilePath = path.resolve(hotDirPath, filename); 
  if (!fs.existsSync(fullFilePath)) { 
    return res.json({ filename, success: false, reason: 'File not found', documents: [] }); 
  } 
  const content = fs.readFileSync(fullFilePath, 'utf8'); 
  const id = uuidv4(); 
  const title = path.basename(filename, path.extname(filename)); 
  const document = { 
    id, title, docAuthor: 'Unknown', description: `Document from ${filename}`, 
    docSource: filename, chunkSource: `custom-documents/${title}-${id}`, 
    published: new Date().toISOString(), wordCount: content.split(/\s+/).length, 
    pageContent: content, token_count_estimate: Math.ceil(content.length / 4) 
  }; 
  const savedDocument = writeToServerDocuments(document, `${title}-${id}`); 
  res.json({ filename, success: true, reason: null, documents: savedDocument ? [savedDocument] : [] }); 
}); 
 
const server = app.listen(8888, '127.0.0.1', () => { 
  console.log('🎉 SUCCESS! Collector API listening at http://127.0.0.1:8888'); 
  log('Collector service is ready'); 
}); 
 
server.on('error', (err) => { 
  if (err.code === 'EADDRINUSE') { 
    console.log('Port 8888 in use, trying 8889...'); 
    app.listen(8889, '127.0.0.1', () => console.log('🎉 Collector on http://127.0.0.1:8889')); 
  } else { 
    console.error('Server error:', err.message); 
  } 
}); 
