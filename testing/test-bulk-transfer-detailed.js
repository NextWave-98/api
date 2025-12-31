require('dotenv').config();
const axios = require('axios');

// Test with explicit number type - try both 'items' and 'products'
const testData = {
  fromLocationId: "50a387a7-a7d4-400c-88a1-c3049346e7c0",
  toLocationId: "0f4ed259-cfd3-4b19-bc96-228221b40bc1",
  items: [{  // Changed from 'products' to 'items'
    productId: "c6d3d55d-309c-462f-998f-a6934734e540",
    quantity: 5  // Using a smaller number for testing
  }]
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YzdlYjIzMy1iMTU2LTRmY2EtYTkwNi0wNTUwYzFjZjc2MzciLCJlbWFpbCI6ImFkbWluQDEyMy5jb20iLCJyb2xlTmFtZSI6IkFETUlOIiwicGVybWlzc2lvbnMiOlsiZGFzaGJvYXJkLnN0YWZmIiwiY3VzdG9tZXJzLmNyZWF0ZSIsImN1c3RvbWVycy5yZWFkIiwiY3VzdG9tZXJzLnVwZGF0ZSIsImN1c3RvbWVycy5kZWxldGUiLCJsb2NhdGlvbnMuY3JlYXRlIiwibG9jYXRpb25zLnJlYWQiLCJsb2NhdGlvbnMudXBkYXRlIiwibG9jYXRpb25zLmRlbGV0ZSIsImxvY2F0aW9ucy5tYW5hZ2UiLCJkZXZpY2VzLmNyZWF0ZSIsImRldmljZXMucmVhZCIsImRldmljZXMudXBkYXRlIiwiZGV2aWNlcy5kZWxldGUiLCJpbnZlbnRvcnkucmVhZCIsImludmVudG9yeS51cGRhdGUiLCJpbnZlbnRvcnkuZGVsZXRlIiwiaW52ZW50b3J5LmFkanVzdCIsImludmVudG9yeS50cmFuc2ZlciIsImludmVudG9yeS5hcHByb3ZlIiwic3RvY2sucmVhZCIsInN0b2NrLndyaXRlIiwic3RvY2suZGVsZXRlIiwic3RvY2suYXBwcm92ZSIsImpvYnNoZWV0cy5jcmVhdGUiLCJqb2JzaGVldHMucmVhZCIsImpvYnNoZWV0cy51cGRhdGUiLCJqb2JzaGVldHMuZGVsZXRlIiwiam9ic2hlZXRzLm1hbmFnZSIsInBhcnRzLmNyZWF0ZSIsInBhcnRzLmRlbGV0ZSIsInBheW1lbnRzLnJlYWQiLCJwYXltZW50cy51cGRhdGUiLCJwYXltZW50cy5kZWxldGUiLCJzdXBwbGllci1wYXltZW50cy5jcmVhdGUiLCJzdXBwbGllci1wYXltZW50cy5kZWxldGUiLCJwcm9kdWN0cy5jcmVhdGUiLCJwcm9kdWN0cy50cmFuc2ZlciIsInByb2R1Y3RzLnJlYWQiLCJwcm9kdWN0cy51cGRhdGUiLCJwcm9kdWN0cy5kZWxldGUiLCJwcm9kdWN0Y2F0ZWdvcmllcy5jcmVhdGUiLCJwcm9kdWN0Y2F0ZWdvcmllcy5yZWFkIiwicHJvZHVjdGNhdGVnb3JpZXMudXBkYXRlIiwicHJvZHVjdGNhdGVnb3JpZXMuZGVsZXRlIiwicHVyY2hhc2VvcmRlcnMuY3JlYXRlIiwicHVyY2hhc2VvcmRlcnMucmVhZCIsInB1cmNoYXNlb3JkZXJzLnVwZGF0ZSIsInB1cmNoYXNlb3JkZXJzLmRlbGV0ZSIsInN1cHBsaWVycy51cGRhdGUiLCJzdXBwbGllcnMuZGVsZXRlIiwidmlld19zYWxlcyIsIndhcnJhbnR5LnJlYWQiLCJ3YXJyYW50eS5jcmVhdGUiLCJyZWFkOnJlcG9ydHMiLCJ1c2Vycy51cGRhdGUiLCJ1c2Vycy5kZWxldGUiLCJyb2xlcy5tYW5hZ2UiLCJkYXNoYm9hcmQuYWRtaW4iLCJzdXBwbGllci1wYXltZW50cy51cGRhdGUiLCJwdXJjaGFzZW9yZGVycy5hcHByb3ZlIiwic3VwcGxpZXJzLmNyZWF0ZSIsInN1cHBsaWVycy5yZWFkIiwic3VwcGxpZXItcGF5bWVudHMucmVhZCIsIndhcnJhbnR5LnVwZGF0ZSIsIndhcnJhbnR5LnZvaWQiLCJ3YXJyYW50eS5yZXNvbHZlIiwid2FycmFudHkuYXNzaWduIiwiZG93bmxvYWQ6cmVwb3J0cyIsInZpZXcuc21zLmxvZ3MiLCJ1c2Vycy5jcmVhdGUiLCJ1c2Vycy5yZWFkIiwiaW52ZW50b3J5LmNyZWF0ZSIsInBhcnRzLnJlYWQiLCJwYXJ0cy51cGRhdGUiLCJwYXltZW50cy5jcmVhdGUiLCJtYW5hZ2Uuc21zIl0sImlhdCI6MTc2NjAwMTg2NywiZXhwIjoxNzY2MDg4MjY3fQ.D8_RMeosdUgISx3BrAeWXXsaIuwpkIqLyvR11F7_iLc';

async function testBulkTransfer() {
  try {
    console.log('Testing bulk transfer endpoint with detailed logging...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    console.log('Data types:');
    console.log('  fromLocationId:', typeof testData.fromLocationId);
    console.log('  toLocationId:', typeof testData.toLocationId);
    console.log('  products[0].productId:', typeof testData.products[0].productId);
    console.log('  products[0].quantity:', typeof testData.products[0].quantity);
    console.log();

    const response = await axios.post(
      'http://localhost:3000/api/products/bulk-transfer',
      testData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ ERROR!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      
      // Additional error details if available
      if (error.response.data.errors) {
        console.error('\nValidation Errors:');
        error.response.data.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testBulkTransfer();
