import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// --- FUNÇÃO DE CORREÇÃO SUPER ROBUSTA (MANTIDA IGUAL) ---
const parseValue = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  // Converte para string para limpar
  let str = String(value).trim();
  
  // Se for vazio
  if (str === '') return 0;

  // Remove o "R$" e espaços extras
  str = str.replace('R$', '').trim();

  // DETECÇÃO DE FORMATO:
  if (str.includes(',')) {
    str = str.replace(/\./g, ''); // Remove todos os pontos de milhar
    str = str.replace(',', '.');  // Troca a vírgula decimal por ponto
  } 

  const result = parseFloat(str);
  return isNaN(result) ? 0 : result;
};

// Função auxiliar de cálculo (MANTIDA IGUAL)
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
  dividendHistory: [], // <--- 1. NOVO ESTADO: Onde guardamos os dados do gráfico
  isLoading: false,

  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      console.log("DADOS VINDOS DO BANCO:", data);

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

      console.log("DADOS FORMATADOS:", formatted);

      set({ 
        portfolio: formatted, 
        metrics: calculateMetrics(formatted),
        isLoading: false 
      });

      // <--- 2. GATILHO: Assim que carregar a carteira, calcula o histórico
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
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  },

  removeFII: async (id) => {
    try {
      await PortfolioService.removeAsset(id);
      const newPortfolio = get().portfolio.filter((fii) => fii.id !== id);
      set({ 
        portfolio: newPortfolio, 
        metrics: calculateMetrics(newPortfolio) 
      });
    } catch (error) {
      console.error("Erro ao remover:", error);
      throw error; 
    }
  },

  updateFII: async (id, updatedData) => {
    try {
      const toUpdate = { ...updatedData };
      await PortfolioService.updateAsset(id, toUpdate);
      get().fetchPortfolio();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  },

  // --- FUNÇÃO DE VENDA (MANTIDA IGUAL) ---
  sellFII: async (ticker, quantity, price, date) => {
    try {
      await PortfolioService.sellAsset(ticker, quantity, price, date);
      get().fetchPortfolio();
    } catch (error) {
      console.error("Erro ao vender:", error);
      throw error;
    }
  },

  // --- 3. NOVA FUNÇÃO LÓGICA: CÁLCULO MÊS A MÊS ---
  calculateDividendHistory: async (portfolioData) => {
    const historyMap = {};

    // Para cada FII que você tem...
    const promises = portfolioData.map(async (asset) => {
        try {
            // Chama a nova API para pegar o histórico de pagamentos dele
            const res = await fetch(`/api/dividend_history?ticker=${asset.ticker}`);
            const dividends = await res.json();
            
            if (!Array.isArray(dividends)) return;

            // Define a data de compra (se não tiver, assume hoje para não quebrar)
            const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();

            dividends.forEach(div => {
                const payDate = new Date(div.date);
                
                // LÓGICA DE OURO: Só soma se o pagamento foi DEPOIS que você comprou
                if (payDate >= purchaseDate) {
                    const monthKey = div.monthYear; // Ex: "jan. de 2024"
                    
                    if (!historyMap[monthKey]) {
                        historyMap[monthKey] = 0;
                    }
                    
                    // Soma: (Valor pago no mês * Quantidade de cotas que você tem)
                    historyMap[monthKey] += div.amount * (asset.quantity || 0);
                }
            });
        } catch (err) {
            console.error(`Erro ao calcular histórico para ${asset.ticker}`, err);
        }
    });

    // Espera calcular de todos os FIIs
    await Promise.all(promises);

    // Formata para o gráfico (Array de objetos)
    const chartData = Object.entries(historyMap).map(([name, value]) => ({
        name, 
        value: Number(value.toFixed(2))
    }));
    
    // Opcional: Ordenação simples baseada no texto (pode ser melhorado depois com datas reais)
    // chartData.sort(...); 

    set({ dividendHistory: chartData });
  },
  // ------------------------------------------------

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