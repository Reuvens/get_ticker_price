import axios from 'axios';

/**
 * Fetches current price for a US market ticker from Yahoo Finance
 * @param {string} ticker - The ticker symbol (e.g., 'GOOG', 'VTI')
 * @returns {Promise<Object>} Result object with price and currency or error
 */
export async function fetchUSPrice(ticker) {
  try {
    // Use Yahoo Finance API v8 query endpoint with better headers
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    });

    const chart = response.data?.chart?.result?.[0];
    const meta = chart?.meta;

    if (!meta || meta.regularMarketPrice === undefined) {
      return {
        ticker,
        success: false,
        error: 'Ticker not found'
      };
    }

    return {
      ticker,
      price: meta.regularMarketPrice,
      currency: meta.currency || 'USD',
      success: true
    };
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 400)) {
      return {
        ticker,
        success: false,
        error: 'Ticker not found'
      };
    }

    return {
      ticker,
      success: false,
      error: error.message || 'Failed to fetch price'
    };
  }
}
