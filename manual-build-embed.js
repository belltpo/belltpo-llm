const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Manual embed widget build process...');

const embedDir = path.join(__dirname, 'embed');
const distDir = path.join(embedDir, 'dist');
const serverPublicDir = path.join(__dirname, 'server', 'public', 'embed');

// Ensure directories exist
if (!fs.existsSync(serverPublicDir)) {
  fs.mkdirSync(serverPublicDir, { recursive: true });
  console.log('📁 Created server/public/embed directory');
}

try {
  // Change to embed directory
  process.chdir(embedDir);
  console.log('📂 Changed to embed directory');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found in embed directory');
    process.exit(1);
  }
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ npm install failed, trying with --force...');
    execSync('npm install --force', { stdio: 'inherit' });
  }
  
  // Build with vite
  console.log('🏗️ Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Check if build files exist
  const jsFile = path.join(distDir, 'anythingllm-chat-widget.js');
  const cssFile = path.join(distDir, 'anythingllm-embedded-chat.css');
  
  if (fs.existsSync(jsFile)) {
    console.log('✅ JavaScript build file found');
    
    // Minify JS
    console.log('📦 Minifying JavaScript...');
    execSync(`npx terser --compress -o "${path.join(distDir, 'anythingllm-chat-widget.min.js')}" -- "${jsFile}"`, { stdio: 'inherit' });
    
    // Copy to server
    fs.copyFileSync(
      path.join(distDir, 'anythingllm-chat-widget.min.js'),
      path.join(serverPublicDir, 'anythingllm-chat-widget.min.js')
    );
    console.log('✅ Copied minified JS to server');
  } else {
    console.log('⚠️ JavaScript build file not found, checking alternatives...');
    const files = fs.readdirSync(distDir);
    console.log('Available files:', files);
  }
  
  if (fs.existsSync(cssFile)) {
    console.log('✅ CSS build file found');
    
    // Minify CSS
    console.log('🎨 Minifying CSS...');
    execSync(`npx cleancss -o "${path.join(distDir, 'anythingllm-chat-widget.min.css')}" "${cssFile}"`, { stdio: 'inherit' });
    
    // Copy to server
    fs.copyFileSync(
      path.join(distDir, 'anythingllm-chat-widget.min.css'),
      path.join(serverPublicDir, 'anythingllm-chat-widget.min.css')
    );
    console.log('✅ Copied minified CSS to server');
  } else {
    console.log('⚠️ CSS build file not found');
  }
  
  console.log('🎉 Build process completed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
