import { toast } from '@/components/ui/use-toast';

const API_TOKEN = '4XzKd7WSjY8wddaYLrq8WZ';
const BASE_URL = 'https://brapi.com.br/api';

/**
 * Busca dados da API Brapi com timeout para não travar a tela.
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
 * Verifica se o ticker existe.
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
    return { exists: false };
  }
};

/**
 * Busca histórico de dividendos.
 */
export const getFiiDividendHistory = async (ticker) => {
  try {
    const url = `${BASE_URL}/quote/${ticker}?token=${API_TOKEN}&dividends=true`;
    const data = await fetchWithTimeout(url);

    if (data.error || !data.results || !data.results[0].dividendsData?.cashDividends) {
      return [];
    }

    const dividends = data.results[0].dividendsData.cashDividends;
    
    // Filtra e ordena para garantir os dados certos
    return dividends
        .map(div => ({
            date: new Date(div.paymentDate).toISOString().split('T')[0],
            value: div.rate
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Mais recentes primeiro
        .slice(0, 12); // Pega os últimos 12
  } catch (error) {
    console.error("getFiiDividendHistory error:", error);
    return [];
  }
};

/**
 * Busca cotação e AGORA CALCULA O YIELD SE PRECISAR.
 */
export const getFiiQuote = async (ticker) => {
  try {
    const url = `${BASE_URL}/quote/${ticker}?token=${API_TOKEN}&range=1d&fundamental=true`;
    const data = await fetchWithTimeout(url);
    
    if (data.error || !data.results || data.results.length === 0) {
      throw new Error(data.error || 'Ticker não encontrado');
    }

    const result = data.results[0];
    const currentPrice = result.regularMarketPrice || 0;

    // --- LÓGICA BLINDADA DE YIELD ---
    let finalYield = result.dividendYield || 0;

    // Se a API mandou ZERO ou NADA, a gente calcula na mão!
    if (!finalYield || finalYield === 0) {
        console.log(`Yield zerado para ${ticker}. Calculando manualmente...`);
        try {
            // Busca o histórico dos últimos 12 meses
            const dividends = await getFiiDividendHistory(ticker);
            
            // Soma tudo que foi pago nos últimos 365 dias
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            const sumDividends = dividends
                .filter(d => new Date(d.date) >= oneYearAgo)
                .reduce((acc, curr) => acc + curr.value, 0);
            
            if (currentPrice > 0) {
                // Cálculo: (Soma Dividendos / Preço Atual) * 100
                finalYield = (sumDividends / currentPrice) * 100;
            }
        } catch (err) {
            console.error("Erro ao calcular yield manual:", err);
        }
    }
    // --------------------------------

    // Tratamento de Setor
    let sector = result.sector;
    if (!sector && result.longName) {
      const longNameLower = result.longName.toLowerCase();
      if (longNameLower.includes('imobiliário') || longNameLower.includes('imobiliario')) {
        sector = 'Fundo Imobiliário';
      } else if (longNameLower.includes('renda fixa')) {
        sector = 'Renda Fixa';
      }
    }
    if (!sector) sector = 'Fundo Imobiliário';

    return {
      price: currentPrice,
      vpa: result.bookValue || 0,
      dividendYield: finalYield, // Agora vai com o valor calculado se precisar
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