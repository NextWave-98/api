const axios = require('axios');

// Test with minimal payload and check for detailed error messages
const testBulkSMS = async () => {
  const instance = axios.create({
    baseURL: 'https://quicksend.lk/Client/api.php',
    auth: {
      username: 'lankatechsolutions.live@gmail.com',
      password: '6346021676926705b46c14963587508',
    },
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  try {
    // Test with just one phone number first
    const singlePhone = '94787514907';
    const simpleMessage = 'Test SMS';

    console.log('Testing with minimal payload:');
    console.log('Phone:', singlePhone);
    console.log('Message:', simpleMessage);

    // Test single SMS with different sender IDs
    const senderIds = ['QKSendDemo', 'LankaTech S', 'INFO', 'ALERT'];

    for (const senderId of senderIds) {
      console.log(`\n=== Testing with sender ID: ${senderId} ===`);

      const payload = {
        FUN: 'SEND_SINGLE',
        senderID: senderId,
        to: singlePhone,
        msg: `Test from ${senderId}: ${simpleMessage}`,
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      try {
        const response = await instance.post('', payload);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('Full response:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (error) {
        console.error(`Error with ${senderId}:`, error.response?.data || error.message);
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Try to get account info with different functions
    console.log('\n=== Trying different account functions ===');
    const accountFunctions = ['GET_BALANCE', 'GET_CREDITS', 'ACCOUNT_INFO', 'GET_ACCOUNT'];

    for (const func of accountFunctions) {
      try {
        const response = await instance.post('', { FUN: func });
        console.log(`${func} Response:`, JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.log(`${func} Error:`, error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('General Error:', error.response?.data || error.message);
  }
};

testBulkSMS();