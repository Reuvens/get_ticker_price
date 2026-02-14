# Stock Price CLI Tool

A simple command-line tool to fetch current prices for financial instruments from both US and Israeli markets.

## Features

- Fetch current prices for US market tickers (stocks, ETFs, bonds)
- Fetch current prices for Israeli market tickers (stocks, bonds, mutual funds)
- Support for multiple tickers in a single command
- Clean, easy-to-read output with currency symbols and security names
- Automatic market detection based on ticker format

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```bash
node index.js TICKER1 TICKER2 ...
```

### Examples

**US Market tickers:**
```bash
node index.js GOOG
node index.js AAPL MSFT TSLA
node index.js VTI SPY
```

**Israeli Market tickers (numeric IDs):**
```bash
node index.js 1184076
node index.js 5130067
node index.js 1166180
```

**Mixed tickers:**
```bash
node index.js GOOG 1184076 VTI 5130067
```

### Output Format

```
GOOG: $306.02 USD
VTI: $336.65 USD
5130067 (אי.בי.אי. (6F) אסטרטגיות): ₪191.14 ILS
1159250 (ISHARES CORE S&P 500 UCITS ETF): ₪2261.80 ILS
1184076 (ממשל שקלית 1152 -אג"ח): ₪0.77 ILS
```

### Make It Executable (Optional)

To install globally and use as a command:

```bash
npm install -g .
ticker-price GOOG VTI 1184076
```

Or make the script executable locally:

```bash
chmod +x index.js
./index.js GOOG VTI
```

## How It Works

### Market Detection

- **Numeric tickers** (e.g., `1184076`, `5130067`) → Israeli market (TASE via Bizportal)
- **Alphanumeric tickers** (e.g., `GOOG`, `VTI`) → US market (Yahoo Finance)

### Data Sources

- **US Markets**: Yahoo Finance API (free, no API key required, real-time during market hours)
- **Israeli Markets**: TheMarker Finance (primary), Bizportal.co.il (fallback) — supports stocks, bonds, ETFs, and mutual funds
- Israeli prices are automatically converted from agorot to shekels where applicable

## Dependencies

- `axios` - HTTP client for API calls and web requests
- `cheerio` - HTML parsing for Bizportal scraping

## Known Limitations

1. **Israeli Market Data**: Uses web scraping from TheMarker and Bizportal which may break if website structures change. If Israeli ticker lookup fails, check manually at [finance.themarker.com](https://finance.themarker.com) or [bizportal.co.il](https://www.bizportal.co.il).

2. **Market Hours**: Prices shown are current during market hours, last closing price when markets are closed.

3. **No Real-Time Streaming**: Tool fetches prices on demand, doesn't provide live updates.

4. **Rate Limiting**: Processing tickers sequentially to avoid rate limiting issues.

## Error Handling

The tool handles errors gracefully:
- Invalid tickers show error messages without crashing
- Network errors are caught and displayed
- Other tickers continue processing even if one fails

## License

ISC
