const axios = require('axios');

async function testJobSheetCreation() {
  try {
    const response = await axios.post('http://localhost:3000/api/jobsheets', {
      customerId: '043b234b-9c5a-4243-a010-8f5f7d9dba19',
      deviceId: 'eb4a53f9-a438-4141-92f5-b08f8505c621',
      locationId: '04cac4ad-eef8-4d90-b1cd-c3c1f2dc0342',
      issueDescription: 'Test issue',
      priority: 'HIGH',
      estimatedCost: 100.00,
      labourCost: 50.00,
      partsCost: 30.00,
      discountAmount: 5.00,
      totalAmount: 75.00,
      paidAmount: 0.00,
      balanceAmount: 75.00,
      warrantyPeriod: 12
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });

    console.log('JobSheet created successfully:', response.data);
  } catch (error) {
    console.error('Error creating jobsheet:', error.response?.data || error.message);
  }
}

testJobSheetCreation();