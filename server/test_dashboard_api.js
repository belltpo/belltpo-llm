const http = require('http');

// Test the dashboard API endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/chat-dashboard/sessions',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\n=== Dashboard API Response ===');
      console.log(`Total sessions: ${jsonData.total}`);
      
      if (jsonData.sessions && jsonData.sessions.length > 0) {
        console.log('\n=== Session Details ===');
        jsonData.sessions.forEach((session, index) => {
          console.log(`\n${index + 1}. ${session.userName}`);
          console.log(`   Email: ${session.userEmail}`);
          console.log(`   Mobile: ${session.userMobile}`);
          console.log(`   Region: ${session.userRegion}`);
          console.log(`   Messages: ${session.messageCount}`);
          console.log(`   Status: ${session.status}`);
        });
      } else {
        console.log('No sessions found');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
