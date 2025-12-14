import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// Função auxiliar para limpar números (R$ 1.000,00 -> 1000.00)
const parseValue = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  let str = String(value).trim();
  if (str === '') return 0;
  // Remove R$ e espaços
  str = str.replace('R$', '').trim();
  // Se tiver vírgula, assume formato PT-BR (remove ponto de milhar, troca vírgula por ponto)
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } 
  const result = parseFloat(str);
  return isNaN(result) ? 0 : result;
};

// Calcula totais da carteira
const calculateMetrics = (portfolio) => {
  let totalInvested = 0;
  let currentValue = 0;
  let totalDividends = 0;

  portfolio.forEach(fii => {
    const qty = parseValue(fii.quantity);
    const pricePaid = parseValue(fii.price); 
    const currPrice = parseValue(fii.currentPrice);
    
    // Se preço atual for 0 ou inválido, usa o preço pago para não zerar o gráfico
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
  dividendByAsset: [],
  evolutionHistory: [],
  isLoading: false,

  // Ação principal: Buscar dados do banco
  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      // Formata os dados vindos do banco
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

      // Dispara cálculos secundários
      get().calculateDividendHistory(formatted);
      get().fetchEvolutionHistory();

    } catch (error) {
      console.error("Erro ao buscar portfolio:", error);
      set({ isLoading: false });
    }
  },

  addFII: async (fii) => { 
      try { 
          await PortfolioService.addTransaction(fii); 
          get().fetchPortfolio(); 
      } catch (e) { 
          console.error(e);
          throw e; // Lança o erro para a tela ver
      } 
  },
  
  removeFII: async (id) => { 
      try { 
          await PortfolioService.removeAsset(id); 
          // Atualiza o estado local imediatamente
          const newPortfolio = get().portfolio.filter((f) => f.id !== id); 
          set({ 
            portfolio: newPortfolio, 
            metrics: calculateMetrics(newPortfolio) 
          }); 
      } catch (e) { 
          console.error(e);
          throw e; // Lança o erro para a tela ver
      } 
  },
  
  updateFII: async (id, d) => { 
      try { 
          await PortfolioService.updateAsset(id, d); 
          get().fetchPortfolio(); 
      } catch (e) { 
          console.error(e);
          throw e; // Lança o erro para a tela ver
      } 
  },
  
  sellFII: async (t, q, p, d) => { 
      try { 
          await PortfolioService.sellAsset(t, q, p, d); 
          get().fetchPortfolio(); 
      } catch (e) { 
          console.error(e);
          throw e; // Lança o erro para a tela ver
      } 
  },

  calculateDividendHistory: async (portfolioData) => {
    const historyMap = {};
    const assetMap = {};
    
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
                    const monthKey = div.monthYear; 

                    if (!historyMap[monthKey]) historyMap[monthKey] = 0;
                    historyMap[monthKey] += totalReceived;

                    if (!assetMap[asset.ticker]) assetMap[asset.ticker] = 0;
                    assetMap[asset.ticker] += totalReceived;
                }
            });
        } catch (err) { console.error(err); }
    });

    await Promise.all(promises);
    
    const chartData = Object.entries(historyMap).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
    const assetChartData = Object.entries(assetMap).map(([ticker, value]) => ({ name: ticker, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value);
    
    set({ dividendHistory: chartData, dividendByAsset: assetChartData });
  },

  fetchEvolutionHistory: async () => {
    try {
        const historyData = await PortfolioService.getEvolutionHistory();
        
        const formattedHistory = historyData.map(item => ({
            name: new Date(item.snapshot_date).toLocaleDateString('pt-BR', { month: 'short' }),
            fullDate: new Date(item.snapshot_date).toLocaleDateString('pt-BR'),
            valor: Number(item.total_value)
        }));

        const currentTotal = get().metrics.currentValue;
        if (currentTotal > 0) {
            formattedHistory.push({ name: 'Atual', fullDate: 'Hoje', valor: currentTotal });
        }

        set({ evolutionHistory: formattedHistory });
    } catch (error) { console.error("Erro evolução:", error); }
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
    return { portfolio: newPortfolio, metrics: calculateMetrics(newPortfolio) };
  }),
}));

export default useCarteiraStore;