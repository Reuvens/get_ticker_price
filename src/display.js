/**
 * Displays the fetched ticker results in a clean format
 * @param {Array<Object>} results - Array of result objects from fetchers
 */
export function displayResults(results) {
  results.forEach(result => {
    if (result.success) {
      const symbol = getCurrencySymbol(result.currency);
      const formattedPrice = result.price.toFixed(2);
      const nameLabel = result.name ? ` (${result.name})` : '';
      console.log(`${result.ticker}${nameLabel}: ${symbol}${formattedPrice} ${result.currency}`);
    } else {
      console.log(`Error: ${result.ticker} - ${result.error}`);
    }
  });
}

/**
 * Returns the currency symbol for display
 * @param {string} currency - Currency code (USD, ILS, etc.)
 * @returns {string} Currency symbol
 */
function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'ILS': '₪',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥'
  };

  return symbols[currency] || '';
}
