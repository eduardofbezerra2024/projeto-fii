import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// --- FUNÇÃO DE CORREÇÃO (MANTIDA) ---
const parseValue = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  let str = String(value).trim();
  if (str === '') return 0;
  str = str.replace('R$', '').trim();
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } 
  const result = parseFloat(str);
  return isNaN(result) ? 0 : result;
};

// --- MANTIDA IGUAL ---
const calculateMetrics = (portfolio) => {
  let totalInvested = 0;
  let currentValue = 0;
  let totalDividends = 0;

  portfolio.forEach(fii => {
    const qty = parseValue(fii.quantity);
    const pricePaid = parseValue(fii.price); 
    const currPrice = parseValue(fii.currentPrice);
    const finalCurrentPrice = currPrice > 0 ? currPrice : pricePaid;
    const dividend = parseValue(fii.last_dividend);

    totalInvested += pricePaid * qty;
    currentValue += finalCurrentPrice * qty;
    totalDividends += dividend * qty;
  });

  const profitLoss = currentValue - totalInvested;
  return { totalInvested, currentValue, profitLoss, totalDividends };
};

const useCarteiraStore = create((set, get) => ({
  portfolio: [],
  metrics: { totalInvested: 0, currentValue: 0, profitLoss: 0, totalDividends: 0 },
  dividendHistory: [], 
  dividendByAsset: [], // <--- 1. NOVO ESTADO: Ranking por Ativo
  isLoading: false,

  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      const formatted = data.map(item => ({
        ...item,
        id: item.id,
        price: parseValue(item.price),
        quantity: parseValue(item.quantity),
        currentPrice: parseValue(item.currentPrice) || parseValue(item.price),
        last_dividend: parseValue(item.last_dividend),
        fii_type: item.fii_type,
        owner: item.owner || 'Geral' 
      }));

      set({ 
        portfolio: formatted, 
        metrics: calculateMetrics(formatted),
        isLoading: false 
      });

      // Calcula históricos
      get().calculateDividendHistory(formatted);

    } catch (error) {
      console.error("Erro ao buscar portfolio:", error);
      set({ isLoading: false });
    }
  },

  addFII: async (fii) => {
    try {
      await PortfolioService.addTransaction(fii);
      get().fetchPortfolio();
    } catch (error) { console.error(error); }
  },

  removeFII: async (id) => {
    try {
      await PortfolioService.removeAsset(id);
      const newPortfolio = get().portfolio.filter((fii) => fii.id !== id);
      set({ portfolio: newPortfolio, metrics: calculateMetrics(newPortfolio) });
    } catch (error) { throw error; }
  },

  updateFII: async (id, updatedData) => {
    try {
      const toUpdate = { ...updatedData };
      await PortfolioService.updateAsset(id, toUpdate);
      get().fetchPortfolio();
    } catch (error) { console.error(error); }
  },

  sellFII: async (ticker, quantity, price, date) => {
    try {
      await PortfolioService.sellAsset(ticker, quantity, price, date);
      get().fetchPortfolio();
    } catch (error) { throw error; }
  },

  // --- CÁLCULO DE HISTÓRICO E POR ATIVO ---
  calculateDividendHistory: async (portfolioData) => {
    const historyMap = {};
    const assetMap = {}; // <--- Acumulador por Ativo

    const promises = portfolioData.map(async (asset) => {
        try {
            const res = await fetch(`/api/dividend_history?ticker=${asset.ticker}`);
            const dividends = await res.json();
            
            if (!Array.isArray(dividends)) return;

            const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();

            dividends.forEach(div => {
                const payDate = new Date(div.date);
                
                if (payDate >= purchaseDate) {
                    const totalReceived = div.amount * (asset.quantity || 0);
                    
                    // 1. Soma no Mês (para o gráfico de evolução)
                    const monthKey = div.monthYear;
                    if (!historyMap[monthKey]) historyMap[monthKey] = 0;
                    historyMap[monthKey] += totalReceived;

                    // 2. Soma no Ativo (para o gráfico novo)
                    if (!assetMap[asset.ticker]) assetMap[asset.ticker] = 0;
                    assetMap[asset.ticker] += totalReceived;
                }
            });
        } catch (err) {
            console.error(`Erro calc history ${asset.ticker}`, err);
        }
    });

    await Promise.all(promises);

    // Formata Evolução (Mês a Mês)
    const chartData = Object.entries(historyMap).map(([name, value]) => ({
        name, 
        value: Number(value.toFixed(2))
    }));

    // Formata Por Ativo (Ranking)
    const assetChartData = Object.entries(assetMap).map(([ticker, value]) => ({
        name: ticker,
        value: Number(value.toFixed(2))
    })).sort((a, b) => b.value - a.value); // Ordena do maior pagador para o menor

    set({ 
        dividendHistory: chartData,
        dividendByAsset: assetChartData // <--- Salva no estado
    });
  },

  updateYields: (updates) => set((state) => {
    const newPortfolio = state.portfolio.map((fii) => {
      const updateData = updates.find((u) => u.id === fii.id);
      if (updateData) {
        return {
          ...fii,
          currentPrice: parseValue(updateData.currentPrice),
          dividendYield: parseValue(updateData.dividendYield),
          lastUpdated: updateData.lastUpdated
        };
      }
      return fii;
    });
    return {
      portfolio: newPortfolio,
      metrics: calculateMetrics(newPortfolio),
    };
  }),
}));

export default useCarteiraStore;