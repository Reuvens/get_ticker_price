import axios from 'axios';

const ticker = '5130067';

// Try potential TASE API endpoints
const apiEndpoints = [
  `https://api.tase.co.il/api/market-data/securities/${ticker}`,
  `https://api.tase.co.il/api/quote/${ticker}`,
  `https://market.tase.co.il/api/market-data/security/${ticker}`,
  `https://www.tase.co.il/api/security/${ticker}/quote`,
  `https://www.tase.co.il/api/v1/security/${ticker}`,
  `https://market.tase.co.il/api/data/security/${ticker}`,
];

for (const url of apiEndpoints) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    console.log(`✓ ${url}`);
    console.log('Response:', JSON.stringify(response.data).substring(0, 200));
  } catch (error) {
    console.log(`✗ ${url} - ${error.response?.status || error.message}`);
  }
}
