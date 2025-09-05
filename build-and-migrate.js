const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building embed widget and setting up database...');

try {
  // Build embed widget
  console.log('📦 Building embed widget...');
  process.chdir(path.join(__dirname, 'embed'));
  
  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    console.log('📥 Installing dependencies...');
    execSync('npm install', { stdio: 'pipe' });
  }
  
  // Build the widget
  console.log('🏗️ Building with Vite...');
  const buildOutput = execSync('npx vite build', { encoding: 'utf8' });
  console.log('Build output:', buildOutput);
  
  // Process CSS
  if (fs.existsSync('dist/anythingllm-embedded-chat.css')) {
    console.log('🎨 Processing CSS...');
    execSync('npx cleancss -o dist/anythingllm-chat-widget.min.css dist/anythingllm-embedded-chat.css', { stdio: 'pipe' });
  }
  
  // Minify JS
  if (fs.existsSync('dist/anythingllm-chat-widget.js')) {
    console.log('📦 Minifying JavaScript...');
    execSync('npx terser --compress -o dist/anythingllm-chat-widget.min.js -- dist/anythingllm-chat-widget.js', { stdio: 'pipe' });
  }
  
  // Copy files to server
  process.chdir(__dirname);
  const serverEmbedDir = path.join(__dirname, 'server', 'public', 'embed');
  if (!fs.existsSync(serverEmbedDir)) {
    fs.mkdirSync(serverEmbedDir, { recursive: true });
  }
  
  const embedDistDir = path.join(__dirname, 'embed', 'dist');
  if (fs.existsSync(path.join(embedDistDir, 'anythingllm-chat-widget.min.js'))) {
    fs.copyFileSync(
      path.join(embedDistDir, 'anythingllm-chat-widget.min.js'),
      path.join(serverEmbedDir, 'anythingllm-chat-widget.min.js')
    );
    console.log('✅ Copied JS to server/public/embed/');
  }
  
  if (fs.existsSync(path.join(embedDistDir, 'anythingllm-chat-widget.min.css'))) {
    fs.copyFileSync(
      path.join(embedDistDir, 'anythingllm-chat-widget.min.css'),
      path.join(serverEmbedDir, 'anythingllm-chat-widget.min.css')
    );
    console.log('✅ Copied CSS to server/public/embed/');
  }
  
  // Run database migration
  console.log('🗄️ Running database migration...');
  process.chdir(path.join(__dirname, 'server'));
  
  const migrationScript = `
    const { PrechatSubmissions } = require('./models/prechatSubmissions');
    PrechatSubmissions.migrateTable()
      .then(() => {
        console.log('✅ Database migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Database migration failed:', error);
        process.exit(1);
      });
  `;
  
  fs.writeFileSync('temp-migration.js', migrationScript);
  execSync('node temp-migration.js', { stdio: 'inherit' });
  fs.unlinkSync('temp-migration.js');
  
  console.log('🎉 All tasks completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log('✅ Embed widget built and deployed');
  console.log('✅ Database migration completed');
  console.log('✅ Prechat form ready for use');
  console.log('');
  console.log('🔗 Test URLs:');
  console.log('   Widget: http://localhost:3001/embed/test-prechat-widget.html');
  console.log('   Dashboard: http://localhost:3001/settings/prechat-dashboard');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout.toString());
  if (error.stderr) console.error('STDERR:', error.stderr.toString());
  process.exit(1);
}
