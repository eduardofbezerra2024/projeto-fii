import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// --- FUNÇÃO DE CORREÇÃO (NOVA) ---
// Transforma "R$ 33,34" ou "33,34" em 33.34 (número válido)
const parseValue = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Converte para string, remove R$, espaços e pontos de milhar
  let str = String(value).replace('R$', '').trim();
  
  // Se tiver vírgula, assume que é decimal: remove pontos de milhar e troca vírgula por ponto
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(str) || 0;
};

// Função auxiliar de cálculo
const calculateMetrics = (portfolio) => {
  let totalInvested = 0;
  let currentValue = 0;
  let totalDividends = 0;

  portfolio.forEach(fii => {
    // Agora usamos parseValue para garantir que não venha NaN
    const qty = parseValue(fii.quantity);
    const pricePaid = parseValue(fii.price); 
    const currPrice = parseValue(fii.currentPrice) || pricePaid; // Fallback se preço atual for 0
    const dividend = parseValue(fii.last_dividend);

    totalInvested += pricePaid * qty;
    currentValue += currPrice * qty;
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
      
      const formatted = data.map(item => ({
        ...item,
        id: item.id,
        // --- AQUI ESTAVA O ERRO ---
        // Trocamos Number() por parseValue() para aceitar vírgulas
        price: parseValue(item.price),
        quantity: parseValue(item.quantity),
        // Se currentPrice vier vazio, usa o preço pago inicialmente
        currentPrice: parseValue(item.currentPrice) || parseValue(item.price),
        last_dividend: parseValue(item.last_dividend),
        // --------------------------
        fii_type: item.fii_type,
        owner: item.owner || 'Geral'
      }));

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
    }
  },

  updateFII: async (id, updatedData) => {
    try {
      const toUpdate = {};
      // Usa parseValue aqui também para garantir que salve certo no banco se quiser
      if (updatedData.quantity) toUpdate.quantity = updatedData.quantity;
      if (updatedData.price) toUpdate.price = updatedData.price;
      if (updatedData.purchaseDate) toUpdate.purchase_date = updatedData.purchaseDate;
      if (updatedData.lastDividend) toUpdate.last_dividend = updatedData.lastDividend;
      if (updatedData.fiiType) toUpdate.fii_type = updatedData.fiiType;
      if (updatedData.owner) toUpdate.owner = updatedData.owner; 

      await PortfolioService.updateAsset(id, toUpdate);
      get().fetchPortfolio();

    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
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