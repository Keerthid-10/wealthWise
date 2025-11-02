// Currency conversion rates relative to INR
// In production, these should be fetched from an API or database
const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,   // 1 INR = 0.012 USD
  EUR: 0.011,   // 1 INR = 0.011 EUR
  GBP: 0.0095,  // 1 INR = 0.0095 GBP
  JPY: 1.79,    // 1 INR = 1.79 JPY
  AUD: 0.018,   // 1 INR = 0.018 AUD
  CAD: 0.016,   // 1 INR = 0.016 CAD
  CHF: 0.011,   // 1 INR = 0.011 CHF
  CNY: 0.087,   // 1 INR = 0.087 CNY
  AED: 0.044    // 1 INR = 0.044 AED
};

// Currency symbols
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  AED: 'د.إ'
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || !fromCurrency || !toCurrency) {
    return amount;
  }

  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to INR first
  const amountInINR = amount / EXCHANGE_RATES[fromCurrency];

  // Then convert to target currency
  const convertedAmount = amountInINR * EXCHANGE_RATES[toCurrency];

  return parseFloat(convertedAmount.toFixed(2));
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
const getCurrencySymbol = (currency) => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
const formatCurrency = (amount, currency) => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Get all available currencies
 * @returns {array} List of currency codes
 */
const getAvailableCurrencies = () => {
  return Object.keys(EXCHANGE_RATES);
};

/**
 * Update exchange rates (for future API integration)
 * @param {object} newRates - New exchange rates
 */
const updateExchangeRates = (newRates) => {
  Object.assign(EXCHANGE_RATES, newRates);
};

module.exports = {
  convertCurrency,
  getCurrencySymbol,
  formatCurrency,
  getAvailableCurrencies,
  updateExchangeRates,
  EXCHANGE_RATES,
  CURRENCY_SYMBOLS
};
