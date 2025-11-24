import { toast } from '@/components/ui/use-toast';

const API_TOKEN = '4XzKd7WSjY8wddaYLrq8WZ';
const BASE_URL = 'https://brapi.com.br/api';

/**
 * Fetches data from the Brapi API with a timeout.
 * @param {string} url The URL to fetch.
 * @param {number} timeout The timeout in milliseconds.
 * @returns {Promise<any>}
 */
const fetchWithTimeout = async (url, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('A requisição demorou muito e foi cancelada.');
    }
    throw error;
  }
};

/**
 * Searches if a FII ticker exists using the Brapi API.
 * @param {string} ticker The FII ticker.
 * @returns {Promise<{exists: boolean}>}
 */
export const searchFii = async (ticker) => {
  try {
    const url = `${BASE_URL}/quote/${ticker}?token=${API_TOKEN}`;
    const data = await fetchWithTimeout(url);
    
    if (data.error || !data.results || data.results.length === 0) {
      return { exists: false };
    }
    
    return { exists: true };
  } catch (error) {
    console.error("searchFii error:", error);
    // Don't show a toast here to avoid being too noisy on blur
    return { exists: false };
  }
};

/**
 * Gets quote data for a FII from the Brapi API.
 * @param {string} ticker The FII ticker.
 * @returns {Promise<import('@/types').FIIQuote | null>}
 */
export const getFiiQuote = async (ticker) => {
  try {
    const url = `${BASE_URL}/quote/${ticker}?token=${API_TOKEN}&range=1d&fundamental=true`;
    const data = await fetchWithTimeout(url);
    
    console.log(`Brapi API response for ${ticker}:`, data);

    if (data.error || !data.results || data.results.length === 0) {
      throw new Error(data.error || 'Ticker não encontrado');
    }

    const result = data.results[0];

    // Handle missing dividendYield - set to null to indicate it needs to be filled.
    const dividendYield = result.dividendYield || null;

    // --- SECTOR DETECTION LOGIC ---
    let sector = result.sector;
    console.log(`[Sector Debug] Initial sector from API for ${ticker}:`, sector);

    if (!sector && result.longName) {
      const longNameLower = result.longName.toLowerCase();
      console.log(`[Sector Debug] No sector from API. Analyzing longName: "${result.longName}"`);

      if (longNameLower.includes('imobiliário') || longNameLower.includes('imobiliario')) {
        sector = 'Fundo Imobiliário';
        console.log(`[Sector Debug] Keyword 'imobiliario' found. Sector set to: "${sector}"`);
      } else if (longNameLower.includes('renda fixa')) {
        sector = 'Renda Fixa';
        console.log(`[Sector Debug] Keyword 'renda fixa' found. Sector set to: "${sector}"`);
      }
    }

    // Default to "Fundo Imobiliário" if still no sector is found
    if (!sector) {
      sector = 'Fundo Imobiliário';
      console.log(`[Sector Debug] No keywords matched. Defaulting sector to: "${sector}"`);
    }
    // --- END SECTOR DETECTION LOGIC ---

    return {
      price: result.regularMarketPrice || 0,
      vpa: result.bookValue || 0,
      dividendYield: dividendYield,
      sector: sector,
      liquidity: result.liquidity || 'Não informado',
      name: result.longName || 'Nome não disponível',
    };
  } catch (error) {
    console.error("getFiiQuote error:", error);
    toast({
        title: 'Erro ao buscar FII',
        description: error.message,
        variant: 'destructive',
    });
    return null;
  }
};

/**
 * Gets dividend history for a FII from the Brapi API.
 * @param {string} ticker The FII ticker.
 * @returns {Promise<import('@/types').FIIDividend[]>}
 */
export const getFiiDividendHistory = async (ticker) => {
  try {
    const url = `${BASE_URL}/quote/${ticker}?token=${API_TOKEN}&dividends=true`;
    const data = await fetchWithTimeout(url);

    if (data.error || !data.results || !data.results[0].dividendsData?.cashDividends) {
      throw new Error(data.error || 'Histórico de dividendos não encontrado');
    }

    const dividends = data.results[0].dividendsData.cashDividends;
    
    return dividends.map(div => ({
      date: new Date(div.paymentDate).toISOString().split('T')[0],
      value: div.rate
    })).slice(0, 12); // Return last 12 dividends
  } catch (error) {
    console.error("getFiiDividendHistory error:", error);
    toast({
        title: 'Erro ao buscar Dividendos',
        description: error.message,
        variant: 'destructive',
    });
    return [];
  }
};