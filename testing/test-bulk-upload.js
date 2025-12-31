const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testBulkUpload() {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream('phone_shop_categories.csv'));

    const response = await axios.post(
      'http://localhost:3000/api/productcategories/bulk-upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    console.log('Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testBulkUpload();
