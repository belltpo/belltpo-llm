const http = require('http');

// Simple test to check if our API server is running
function testAPI() {
  console.log('Testing API server...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/test-dashboard',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      testSessions();
    });
  });

  req.on('error', (e) => {
    console.error(`API test error: ${e.message}`);
  });

  req.end();
}

function testSessions() {
  console.log('\nTesting sessions endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat-dashboard/sessions',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Sessions Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const sessions = JSON.parse(data);
        console.log(`Found ${sessions.sessions?.length || 0} sessions`);
        if (sessions.sessions && sessions.sessions.length > 0) {
          console.log('First session:', sessions.sessions[0]);
          testSessionDetails(sessions.sessions[0].sessionId);
        }
      } catch (e) {
        console.error('Failed to parse sessions response:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Sessions test error: ${e.message}`);
  });

  req.end();
}

function testSessionDetails(sessionId) {
  console.log(`\nTesting session details for: ${sessionId}`);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/chat-dashboard/sessions/${sessionId}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Session Details Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const sessionData = JSON.parse(data);
        console.log('Session Info:', sessionData.sessionInfo);
        console.log(`Chat History: ${sessionData.chatHistory?.length || 0} messages`);
      } catch (e) {
        console.error('Failed to parse session details:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Session details test error: ${e.message}`);
  });

  req.end();
}

// Run the test
testAPI();
