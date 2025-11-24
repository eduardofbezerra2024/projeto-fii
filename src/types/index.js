// This file can be used to define shared types and interfaces.

/**
 * @typedef {object} FII
 * @property {string} id
 * @property {string} ticker
 * @property {number} quantity
 * @property {number} averagePrice
 * @property {string} sector
 * @property {number|null} dividendYield
 */

/**
 * @typedef {object} FIIQuote
 * @property {number} price
 * @property {number} vpa
 * @property {number|null} dividendYield
 * @property {string} sector
 * @property {string} liquidity
 * @property {string} name
 */

/**
 * @typedef {object} FIIDividend
 * @property {string} date
 * @property {number} value
 */
 
/**
 * @typedef {object} AlertPreferences
 * @property {string} id
 * @property {string} user_id
 * @property {string|null} whatsapp_number
 * @property {boolean} enable_price_alerts
 * @property {number} price_threshold
 * @property {boolean} enable_dividend_alerts
 * @property {number} dividend_threshold
 * @property {boolean} enable_news_alerts
 * @property {string} created_at
 * @property {string} updated_at
 */

 /**
 * @typedef {object} AlertHistoryItem
 * @property {string} id
 * @property {string} user_id
 * @property {string} fii_ticker
 * @property {string} alert_type
 * @property {string} message
 * @property {string} sent_at
 */

/**
 * Enum for alert types.
 * @readonly
 * @enum {string}
 */
export const AlertTypes = {
  PRICE_BELOW: 'price_below',
  PRICE_ABOVE: 'price_above',
  YIELD_ABOVE: 'yield_above',
  NEW_DIVIDEND: 'new_dividend',
};

/**
 * Enum for alert statuses.
 * @readonly
 * @enum {string}
 */
export const AlertStatus = {
  ACTIVE: 'active',
  TRIGGERED: 'triggered',
  INACTIVE: 'inactive',
};