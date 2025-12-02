import { create } from 'zustand';
import { PortfolioService } from '@/services/UserPortfolioService';

// Função auxiliar de cálculo ATUALIZADA
const calculateMetrics = (portfolio) => {
  let totalInvested = 0;
  let currentValue = 0;
  let totalDividends = 0; // <--- NOVO CONTADOR

  portfolio.forEach(fii => {
    const qty = Number(fii.quantity) || 0;
    const pricePaid = Number(fii.price) || 0;
    const currPrice = Number(fii.currentPrice) || pricePaid;
    const dividend = Number(fii.last_dividend) || 0;

    totalInvested += pricePaid * qty;
    currentValue += currPrice * qty;
    totalDividends += dividend * qty; // <--- SOMA AQUI (Valor x Quantidade)
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
        price: Number(item.price),
        quantity: Number(item.quantity),
        currentPrice: Number(item.price),
        last_dividend: Number(item.last_dividend) || 0, // Garante que venha do banco
        fii_type: item.fii_type 
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
      if (updatedData.quantity) toUpdate.quantity = updatedData.quantity;
      if (updatedData.price) toUpdate.price = updatedData.price;
      if (updatedData.purchaseDate) toUpdate.purchase_date = updatedData.purchaseDate;
      if (updatedData.lastDividend) toUpdate.last_dividend = updatedData.lastDividend;
      if (updatedData.fiiType) toUpdate.fii_type = updatedData.fiiType;

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
          currentPrice: Number(updateData.currentPrice),
          // Se a atualização trouxer dividendo novo, usa. Senão mantém o manual.
          // last_dividend: updateData.dividendYield ? ... (Lógica futura)
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