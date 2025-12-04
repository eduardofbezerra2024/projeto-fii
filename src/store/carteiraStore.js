import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// --- FUNÇÃO DE CORREÇÃO SUPER ROBUSTA ---
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
  // Se tiver vírgula, assumimos formato Brasileiro (ex: 1.000,50 ou 33,45)
  if (str.includes(',')) {
    str = str.replace(/\./g, ''); // Remove todos os pontos de milhar
    str = str.replace(',', '.');  // Troca a vírgula decimal por ponto
  } 
  // Se NÃO tiver vírgula, mas tiver ponto, assumimos formato Americano ou JS puro (33.45)
  // (Nesse caso não fazemos nada, o parseFloat já entende)

  const result = parseFloat(str);
  return isNaN(result) ? 0 : result;
};

// Função auxiliar de cálculo
const calculateMetrics = (portfolio) => {
  let totalInvested = 0;
  let currentValue = 0;
  let totalDividends = 0;

  portfolio.forEach(fii => {
    // Garante números puros
    const qty = parseValue(fii.quantity);
    const pricePaid = parseValue(fii.price); 
    const currPrice = parseValue(fii.currentPrice);
    
    // Se o preço atual for 0, usamos o preço pago para não zerar o total
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
  isLoading: false,

  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      // LOG PARA DEBUG (Olhe no Console F12 se der erro)
      console.log("DADOS VINDOS DO BANCO:", data);

      const formatted = data.map(item => ({
        ...item,
        id: item.id,
        // Aplica a limpeza em todos os campos numéricos
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
      throw error; // <--- AGORA SIM! Joga o erro para a tela ver.
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

  // --- 🔴 NOVA FUNÇÃO DE VENDA ADICIONADA AQUI ---
  sellFII: async (ticker, quantity, price, date) => {
    try {
      // Chama o serviço do Supabase
      await PortfolioService.sellAsset(ticker, quantity, price, date);
      
      // Recarrega a carteira para atualizar o saldo e os lucros
      get().fetchPortfolio();
      
    } catch (error) {
      console.error("Erro ao vender:", error);
      // Repassa o erro para que a tela (Carteira.jsx) possa mostrar o Toast de erro
      throw error;
    }
  },
  // -----------------------------------------------

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