/**
 * Test inventory endpoint and display detailed error
 */

const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing: GET /api/inventory?page=1&limit=10\n');
    
    const response = await axios.get('http://localhost:3000/api/inventory?page=1&limit=10', {
      validateStatus: () => true
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.status === 500) {
      console.log('\n❌ Server error - Check server logs for stack trace');
      console.log('💡 Common causes:');
      console.log('   - Database connection issue');
      console.log('   - Table/column name mismatch');
      console.log('   - Missing foreign key relations');
      console.log('   - Invalid query syntax');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running on http://localhost:3000');
      console.log('💡 Start server with: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testEndpoint();
