/**
 * Test the inventory endpoint to see the actual error
 */

const axios = require('axios');

async function testInventoryEndpoint() {
  try {
    console.log('🧪 Testing inventory endpoint...\n');
    
    // Test without authentication first to see if it's a DB issue
    const response = await axios.get('http://localhost:3000/api/inventory?page=1&limit=10', {
      validateStatus: () => true // Don't throw on any status
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 401) {
      console.log('\n⚠️  Endpoint requires authentication.');
      console.log('You need to:');
      console.log('1. Login first to get a token');
      console.log('2. Include the token in Authorization header');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Server is not running!');
      console.log('Please start the server with: npm run dev');
    }
  }
}

testInventoryEndpoint();
