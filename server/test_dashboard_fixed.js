const http = require('http');

console.log('Testing Dashboard API after fixing EmbedConfig error...\n');

// Test sessions endpoint
const testSessions = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/chat-dashboard/sessions',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Sessions API Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✓ Found ${jsonData.total} sessions`);
            if (jsonData.sessions && jsonData.sessions.length > 0) {
              jsonData.sessions.forEach((session, i) => {
                console.log(`  ${i+1}. ${session.userName}`);
                console.log(`     Email: ${session.userEmail}`);
                console.log(`     Mobile: ${session.userMobile} ${session.userMobile ? '✓' : '✗'}`);
              });
            }
          } catch (e) {
            console.log('✗ JSON parse error:', e.message);
          }
        } else {
          console.log('✗ Error response:', data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('✗ Request failed:', error.message);
      resolve();
    });

    req.end();
  });
};

// Test embeds endpoint
const testEmbeds = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/chat-dashboard/embeds',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\nEmbeds API Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✓ Found ${jsonData.embeds?.length || 0} embeds`);
          } catch (e) {
            console.log('✗ JSON parse error:', e.message);
          }
        } else {
          console.log('✗ Error response:', data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('✗ Request failed:', error.message);
      resolve();
    });

    req.end();
  });
};

// Run tests
(async () => {
  await testSessions();
  await testEmbeds();
  
  console.log('\n==========================================');
  console.log('Dashboard URLs to test:');
  console.log('- Backend: http://localhost:3001/dashboard/chat-sessions');
  console.log('- Frontend: http://localhost:3000/dashboard/chat-sessions');
  console.log('==========================================');
})();
