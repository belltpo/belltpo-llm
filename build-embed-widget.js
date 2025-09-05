const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building embed widget with updated prechat form...');

try {
  // Change to embed directory and build
  process.chdir(path.join(__dirname, 'embed'));
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🏗️ Building widget...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('🎨 Processing styles...');
  execSync('npx cleancss -o dist/anythingllm-chat-widget.min.css dist/anythingllm-embedded-chat.css', { stdio: 'inherit' });
  
  console.log('📦 Minifying JavaScript...');
  execSync('npx terser --compress -o dist/anythingllm-chat-widget.min.js -- dist/anythingllm-chat-widget.js', { stdio: 'inherit' });
  
  // Copy files to server public directory
  const serverPublicDir = path.join(__dirname, 'server', 'public', 'embed');
  if (!fs.existsSync(serverPublicDir)) {
    fs.mkdirSync(serverPublicDir, { recursive: true });
  }
  
  console.log('📂 Copying files to server public directory...');
  fs.copyFileSync('dist/anythingllm-chat-widget.min.js', path.join(serverPublicDir, 'anythingllm-chat-widget.min.js'));
  fs.copyFileSync('dist/anythingllm-chat-widget.min.css', path.join(serverPublicDir, 'anythingllm-chat-widget.min.css'));
  
  // Copy files to frontend public directory
  const frontendPublicDir = path.join(__dirname, 'frontend', 'public', 'embed');
  if (!fs.existsSync(frontendPublicDir)) {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
  }
  
  console.log('📂 Copying files to frontend public directory...');
  fs.copyFileSync('dist/anythingllm-chat-widget.min.js', path.join(frontendPublicDir, 'anythingllm-chat-widget.min.js'));
  fs.copyFileSync('dist/anythingllm-chat-widget.min.css', path.join(frontendPublicDir, 'anythingllm-chat-widget.min.css'));
  
  console.log('✅ Embed widget built and deployed successfully!');
  console.log('📍 Files available at:');
  console.log('   - /embed/anythingllm-chat-widget.min.js');
  console.log('   - /embed/anythingllm-chat-widget.min.css');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
