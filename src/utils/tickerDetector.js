/**
 * Detects whether a ticker is from US or Israeli market
 * @param {string} ticker - The ticker symbol to detect
 * @returns {string} 'IL' for Israeli market (numeric), 'US' for US market (alphanumeric)
 */
export function detectTickerType(ticker) {
  // Israeli tickers are purely numeric
  if (/^\d+$/.test(ticker)) {
    return 'IL';
  }
  // Everything else is treated as US market
  return 'US';
}
