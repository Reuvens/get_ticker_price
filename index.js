#!/usr/bin/env node

import { detectTickerType } from './src/utils/tickerDetector.js';
import { fetchUSPrice } from './src/fetchers/usFetcher.js';
import { fetchIsraeliPrice } from './src/fetchers/israelFetcher.js';
import { displayResults } from './src/display.js';

/**
 * Main entry point for the ticker price CLI tool
 */
async function main() {
  // Get command-line arguments (skip first 2: node and script path)
  const tickers = process.argv.slice(2);

  // Validate input
  if (tickers.length === 0) {
    console.log('Usage: node index.js TICKER1 TICKER2 ...');
    console.log('Example: node index.js GOOG VTI 1160985 5130067');
    console.log('\nNote: Numeric tickers are treated as Israeli market, alphanumeric as US market.');
    process.exit(1);
  }

  console.log(`Fetching prices for ${tickers.length} ticker(s)...\n`);

  // Process each ticker and collect results
  const results = [];

  for (const ticker of tickers) {
    const tickerType = detectTickerType(ticker);

    let result;
    if (tickerType === 'US') {
      result = await fetchUSPrice(ticker);
    } else {
      result = await fetchIsraeliPrice(ticker);
    }

    results.push(result);
  }

  // Display all results
  console.log(''); // Empty line for spacing
  displayResults(results);
}

// Run the main function and handle any uncaught errors
main().catch(error => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});
