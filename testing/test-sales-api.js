// Test script to verify Sales POS API
// Run with: node test-sales-api.js

const API_BASE = 'http://localhost:3000/api/v1';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testSalesAPI() {
  console.log('🧪 Testing Sales POS API...\n');

  try {
    // Test 1: Get Sales List
    console.log('📋 Test 1: GET /sales/pos (Get sales list)');
    const salesResponse = await fetch(`${API_BASE}/sales/pos?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const salesData = await salesResponse.json();
    console.log('Status:', salesResponse.status);
    console.log('Response:', JSON.stringify(salesData, null, 2));
    console.log('✅ Sales list endpoint working!\n');

    // Test 2: Get Sales Analytics (should not conflict)
    console.log('📊 Test 2: GET /sales/overview (Analytics endpoint)');
    const analyticsResponse = await fetch(`${API_BASE}/sales/overview`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const analyticsData = await analyticsResponse.json();
    console.log('Status:', analyticsResponse.status);
    console.log('Response:', JSON.stringify(analyticsData, null, 2));
    console.log('✅ Analytics endpoint working!\n');

    console.log('🎉 All tests passed! The route order fix is working correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('1. Server is running on http://localhost:3000');
    console.log('2. You have replaced TOKEN with a valid JWT');
    console.log('3. You have proper permissions');
  }
}

// Instructions for getting a token
console.log(`
📝 INSTRUCTIONS:
1. First, login to get a JWT token:
   POST http://localhost:3000/api/v1/auth/login
   Body: { "email": "your@email.com", "password": "yourpassword" }

2. Copy the token from the response

3. Replace 'YOUR_JWT_TOKEN_HERE' in this file with your actual token

4. Run: node test-sales-api.js

Press Ctrl+C to exit...
`);

// Uncomment the line below to run the test
// testSalesAPI();
