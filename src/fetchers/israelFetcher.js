import axios from 'axios';
import * as cheerio from 'cheerio';

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
};

/**
 * Fetches current price for an Israeli market ticker.
 * Tries TheMarker first, then Bizportal as fallback.
 * @param {string} ticker - The ticker ID (e.g., '1184076', '5130067')
 * @returns {Promise<Object>} Result object with price, name, currency or error
 */
export async function fetchIsraeliPrice(ticker) {
  // Try TheMarker first (cleaner data, explicit agorot indicators)
  const themarkerResult = await fetchFromTheMarker(ticker);
  if (themarkerResult.success) return themarkerResult;

  // Fallback to Bizportal
  const bizportalResult = await fetchFromBizportal(ticker);
  if (bizportalResult.success) return bizportalResult;

  // All sources failed
  return {
    ticker,
    success: false,
    error: bizportalResult.error || themarkerResult.error || 'Ticker not found'
  };
}

/**
 * Fetch price from TheMarker Finance
 */
async function fetchFromTheMarker(ticker) {
  try {
    const url = `https://finance.themarker.com/mtf/${ticker}`;
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    // Extract security name from page title
    const pageTitle = $('title').text().trim();
    // Title format: "SecurityName - Category - TheMarker Finance"
    const name = pageTitle.split(' - ')[0].trim() || null;

    // Find the main price — first leaf numeric value (the "שער" field)
    let priceText = null;
    $('*').each((i, el) => {
      if (priceText) return;
      const text = $(el).text().trim();
      if ($(el).children().length === 0 && /^[0-9,]+\.\d+$/.test(text) && text.length >= 2) {
        priceText = text;
      }
    });

    if (!priceText) {
      return { ticker, success: false, error: 'No price found on TheMarker' };
    }

    let price = parseFloat(priceText.replace(/,/g, ''));
    if (isNaN(price)) {
      return { ticker, success: false, error: 'Failed to parse price from TheMarker' };
    }

    // Detect if price is in agorot:
    // For bonds: price > 10 typically means shekels (government bonds quoted as % of par)
    // For stocks/ETFs: "שינוי באג׳" indicator means price is in agorot
    const isBond = /אג["׳']ח|bond/i.test(pageTitle);
    const hasAgorotIndicator = /שינוי\s*באגורות|שינוי\s*באג[׳']/i.test(bodyText);

    if (isBond && price > 10) {
      // Bonds with price > 10 are in shekels - don't convert
    } else if (hasAgorotIndicator) {
      // For non-bonds (stocks/ETFs) or small-priced bonds, agorot indicator means convert
      price = price / 100;
    }

    return {
      ticker,
      name,
      price,
      currency: 'ILS',
      success: true
    };
  } catch (error) {
    return {
      ticker,
      success: false,
      error: `TheMarker: ${error.response?.status === 404 ? 'Ticker not found' : error.message}`
    };
  }
}

/**
 * Fetch price from Bizportal (fallback)
 * Bizportal auto-redirects /capitalmarket/quote/generalview/{id} to the
 * correct category (bonds, mutualfunds, tradedfund, capitalmarket).
 */
async function fetchFromBizportal(ticker) {
  try {
    const url = `https://www.bizportal.co.il/capitalmarket/quote/generalview/${ticker}`;
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: 10000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    // Get the security name from the h1 heading
    const name = $('h1').first().text().trim();

    // If no name or the page shows a search page, the ticker was not found
    if (!name || name === 'חיפוש ניירות ערך') {
      return { ticker, success: false, error: 'Ticker not found' };
    }

    // Detect the category from the final redirect URL
    const finalUrl = response.request.res.responseUrl || '';
    const category = finalUrl.match(/bizportal\.co\.il\/(\w+)\//)?.[1] || '';

    let price = null;

    // Strategy 1: For mutual funds — look for "מחיר פדיון" (redemption price)
    const redemptionMatch = bodyText.match(/מחיר פדיון\s*[:\s]*([0-9,.]+)/);
    if (redemptionMatch) {
      price = parseFloat(redemptionMatch[1].replace(/,/g, ''));
    }

    // Strategy 2: For bonds/stocks/ETFs — extract from "שער בסיס" or "שער נעילה"
    if (price === null) {
      // Try "שער נעילה" first (closing price), then "שער בסיס" (base price)
      for (const label of ['שער נעילה', 'שער בסיס', 'שער אחרון']) {
        const match = bodyText.match(new RegExp(label + '[^0-9]{0,10}?([0-9,]+\\.?\\d*)'));
        if (match) {
          const parsed = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) {
            price = parsed;
            break;
          }
        }
      }
    }

    // Strategy 3: First standalone numeric value after the h1
    if (price === null) {
      const priceElements = $('h1').parent().find('*').filter(function () {
        const text = $(this).text().trim();
        return $(this).children().length === 0 && /^\d+\.?\d*$/.test(text);
      });
      if (priceElements.length > 0) {
        price = parseFloat(priceElements.first().text().trim());
      }
    }

    if (price === null || isNaN(price)) {
      return {
        ticker,
        success: false,
        error: `Found "${name}" but could not extract price`
      };
    }

    // Agorot conversion logic:
    // - Mutual funds are always in NIS
    // - For bonds and other securities, check for explicit "באגורות" indicator
    // - If price > 10 for bonds, it's likely in NIS (not agorot)
    // - Otherwise assume agorot for stocks/ETFs

    const isAgorot = /באגורות|באג[׳']/i.test(bodyText);

    if (category === 'mutualfunds') {
      // Mutual funds are always in NIS, no conversion needed
    } else if (category === 'bonds') {
      // For bonds: only convert if explicitly marked as agorot AND price <= 10
      // (Government bonds and most corporate bonds are quoted in NIS)
      if (isAgorot && price <= 10) {
        price = price / 100;
      }
      // Otherwise keep as-is (already in NIS)
    } else {
      // For stocks and ETFs: default to agorot unless marked otherwise
      if (!isAgorot) {
        price = price / 100;
      }
    }

    return {
      ticker,
      name,
      price,
      currency: 'ILS',
      success: true
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { ticker, success: false, error: 'Ticker not found' };
    }
    return {
      ticker,
      success: false,
      error: `Bizportal: ${error.message}`
    };
  }
}
