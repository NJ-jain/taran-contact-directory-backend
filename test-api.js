const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await axios.get('https://taran-contact-directory-backend.vercel.app/api/members', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.taran.co.in/'
      },
      timeout: 10000
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Request error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAPI();
