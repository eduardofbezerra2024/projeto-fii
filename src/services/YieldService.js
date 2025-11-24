
import { supabase } from '@/lib/customSupabaseClient';
import { getFiiQuote } from '@/services/fiiService';
import { toast } from '@/components/ui/use-toast';

export const YieldService = {
  /**
   * Updates yields for a list of FIIs.
   * Fetches latest data from API, saves history to Supabase, and returns updated data.
   * @param {Array} portfolio - Array of FII objects from the store
   * @returns {Promise<Array>} - Array of updated yield objects { ticker, yield, price }
   */
  async updatePortfolioYields(portfolio) {
    if (!portfolio || portfolio.length === 0) return [];

    const updates = [];
    const errors = [];

    // Create a unique list of tickers to avoid duplicate requests
    const uniqueTickers = [...new Set(portfolio.map(item => item.ticker))];

    console.log(`[YieldService] Starting update for ${uniqueTickers.length} tickers...`);

    for (const ticker of uniqueTickers) {
      try {
        // 1. Fetch latest data from Brapi via fiiService
        const quote = await getFiiQuote(ticker);

        if (quote) {
          const yieldValue = quote.dividendYield || 0;
          const currentPrice = quote.price || 0;

          // 2. Store history in Supabase
          const { error: dbError } = await supabase
            .from('fii_yields')
            .insert({
              fii_ticker: ticker,
              yield_value: yieldValue,
              price: currentPrice,
              date: new Date().toISOString().split('T')[0]
            });

          if (dbError) {
            console.error(`[YieldService] Error saving history for ${ticker}:`, dbError);
            // We continue even if history save fails, as we want to update the UI
          }

          updates.push({
            ticker,
            dividendYield: yieldValue,
            currentPrice: currentPrice,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[YieldService] Failed to update ${ticker}:`, error);
        errors.push(ticker);
      }
      
      // Small delay to avoid rate limiting if many items
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (errors.length > 0) {
      console.warn(`[YieldService] Completed with errors for: ${errors.join(', ')}`);
    } else {
      console.log('[YieldService] All yields updated successfully');
    }

    return updates;
  },

  /**
   * Gets the last update timestamp from local storage or null
   */
  getLastUpdate() {
    return localStorage.getItem('fii_yield_last_update');
  },

  /**
   * Sets the last update timestamp
   */
  setLastUpdate() {
    localStorage.setItem('fii_yield_last_update', new Date().toISOString());
  }
};
