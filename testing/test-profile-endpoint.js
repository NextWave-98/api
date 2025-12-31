const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MzhlYTE5Zi1jMzZiLTQzNTYtYWYwNC04ODU2MjBmOWJlMDIiLCJlbWFpbCI6Im1hbmFnZXIuc291dGhAZXhhbXBsZS5jb20iLCJyb2xlTmFtZSI6Ik1BTkFHRVIiLCJwZXJtaXNzaW9ucyI6WyJ1c2Vycy5yZWFkIiwiZGV2aWNlcy51cGRhdGUiLCJ1c2Vycy5jcmVhdGUiLCJpbnZlbnRvcnkudHJhbnNmZXIiLCJpbnZlbnRvcnkuY3JlYXRlIiwiam9ic2hlZXRzLnVwZGF0ZSIsImludmVudG9yeS5hcHByb3ZlIiwicGFydHMuY3JlYXRlIiwic3RvY2sucmVhZCIsImpvYnNoZWV0cy5tYW5hZ2UiLCJwYXltZW50cy5yZWFkIiwicGF5bWVudHMudXBkYXRlIiwicGFydHMucmVhZCIsInN0b2NrLndyaXRlIiwic3VwcGxpZXItcGF5bWVudHMuY3JlYXRlIiwic3VwcGxpZXItcGF5bWVudHMucmVhZCIsInBhcnRzLnVwZGF0ZSIsInByb2R1Y3RzLmNyZWF0ZSIsInBheW1lbnRzLmNyZWF0ZSIsInN1cHBsaWVyLXBheW1lbnRzLnVwZGF0ZSIsInByb2R1Y3RzLnRyYW5zZmVyIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RjYXRlZ29yaWVzLnJlYWQiLCJwcm9kdWN0Y2F0ZWdvcmllcy51cGRhdGUiLCJwcm9kdWN0cy51cGRhdGUiLCJwdXJjaGFzZW9yZGVycy5jcmVhdGUiLCJwcm9kdWN0Y2F0ZWdvcmllcy5jcmVhdGUiLCJwdXJjaGFzZW9yZGVycy51cGRhdGUiLCJwdXJjaGFzZW9yZGVycy5yZWFkIiwic3VwcGxpZXJzLmNyZWF0ZSIsInB1cmNoYXNlb3JkZXJzLmFwcHJvdmUiLCJzdXBwbGllcnMudXBkYXRlIiwic3VwcGxpZXJzLnJlYWQiLCJ2aWV3X3NhbGVzIiwic3RvY2suYXBwcm92ZSIsImpvYnNoZWV0cy5jcmVhdGUiLCJkZXZpY2VzLmNyZWF0ZSIsImpvYnNoZWV0cy5yZWFkIiwiaW52ZW50b3J5LmFkanVzdCIsImludmVudG9yeS51cGRhdGUiLCJsb2NhdGlvbnMucmVhZCIsImxvY2F0aW9ucy51cGRhdGUiLCJjdXN0b21lcnMudXBkYXRlIiwicm9sZXMubWFuYWdlIiwibG9jYXRpb25zLm1hbmFnZSIsInVzZXJzLnVwZGF0ZSIsImRhc2hib2FyZC5zdGFmZiIsImludmVudG9yeS5yZWFkIiwiY3VzdG9tZXJzLmNyZWF0ZSIsImRhc2hib2FyZC5hZG1pbiIsImRldmljZXMucmVhZCIsImN1c3RvbWVycy5yZWFkIiwibG9jYXRpb25zLmNyZWF0ZSIsIndhcnJhbnR5LnJlYWQiLCJ3YXJyYW50eS5jcmVhdGUiLCJ3YXJyYW50eS51cGRhdGUiLCJ3YXJyYW50eS5yZXNvbHZlIiwid2FycmFudHkudm9pZCIsIndhcnJhbnR5LmFzc2lnbiJdLCJpYXQiOjE3NjQ5NDAxNjcsImV4cCI6MTc2NTAyNjU2N30.QKxbOC8yD1znRAM_oaCBKJnI-sv2l7UyI8-6bqeUMYk';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users/profile',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Testing endpoint: http://localhost:3000/api/users/profile');
console.log('📋 Token:', token.substring(0, 50) + '...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📥 Response Status:', res.statusCode);
    console.log('📦 Response Body:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('📄 Parsed JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('⚠️  Could not parse as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
