import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';
// Função auxiliar de cálculo
const calculateMetrics = (portfolio) => {
  const totalInvested = portfolio.reduce((acc, fii) => acc + (Number(fii.price) * Number(fii.quantity)), 0);
  const currentValue = portfolio.reduce((acc, fii) => acc + ((fii.currentPrice || Number(fii.price)) * Number(fii.quantity)), 0);
  const profitLoss = currentValue - totalInvested;

  return { totalInvested, currentValue, profitLoss };
};

const useCarteiraStore = create((set, get) => ({
  portfolio: [],
  metrics: { totalInvested: 0, currentValue: 0, profitLoss: 0 },
  isLoading: false,

  // A FUNÇÃO QUE FALTAVA: Carregar dados do Banco
  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      const formatted = data.map(item => ({
        ...item,
        id: item.id,
        price: Number(item.price),
        quantity: Number(item.quantity),
        currentPrice: Number(item.price), // Começa com o preço pago
        dividendYield: 0
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
      const savedFii = await PortfolioService.addAsset(fii);
      const currentPortfolio = get().portfolio;
      // Garante números
      const newFii = { 
          ...savedFii, 
          price: Number(savedFii.price),
          quantity: Number(savedFii.quantity),
          currentPrice: Number(savedFii.price), 
          dividendYield: 0 
      };
      
      const newPortfolio = [...currentPortfolio, newFii];
      set({ 
        portfolio: newPortfolio,
        metrics: calculateMetrics(newPortfolio)
      });
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
      if (updatedData.quantity) toUpdate.quantity = updatedData.quantity;
      if (updatedData.price) toUpdate.price = updatedData.price;

      await PortfolioService.updateAsset(id, toUpdate);

      const newPortfolio = get().portfolio.map((fii) =>
        fii.id === id ? { ...fii, ...updatedData } : fii
      );
      set({ 
        portfolio: newPortfolio,
        metrics: calculateMetrics(newPortfolio)
      });
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
          currentPrice: Number(updateData.currentPrice),
          dividendYield: Number(updateData.dividendYield || 0),
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

// Forçando atualização do Git - Versão Final