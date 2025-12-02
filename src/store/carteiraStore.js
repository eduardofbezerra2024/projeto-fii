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

  // Carregar dados do Banco
  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const data = await PortfolioService.getPortfolio();
      
      const formatted = data.map(item => ({
        ...item,
        id: item.id,
        price: Number(item.price),
        quantity: Number(item.quantity),
        currentPrice: Number(item.price), // Começa com o preço pago até atualizar
        dividendYield: 0,
        // Garante que o tipo venha do banco
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
      // Chama o serviço que já trata o mapeamento de fiiType -> fii_type
      await PortfolioService.addTransaction(fii);
      
      // Recarrega do banco para garantir dados sincronizados
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

  // --- A CORREÇÃO ESTÁ AQUI ---
  updateFII: async (id, updatedData) => {
    try {
      // Agora preparamos todos os campos para enviar ao banco
      const toUpdate = {};
      
      // Mapeia os nomes que vêm do Modal para os nomes do Banco
      if (updatedData.quantity) toUpdate.quantity = updatedData.quantity;
      if (updatedData.price) toUpdate.price = updatedData.price;
      if (updatedData.purchaseDate) toUpdate.purchase_date = updatedData.purchaseDate;
      if (updatedData.lastDividend) toUpdate.last_dividend = updatedData.lastDividend;
      if (updatedData.fiiType) toUpdate.fii_type = updatedData.fiiType; // <--- O TIPO ESTAVA FALTANDO AQUI

      await PortfolioService.updateAsset(id, toUpdate);

      // Atualiza a tela localmente na hora
      const newPortfolio = get().portfolio.map((fii) =>
        fii.id === id ? { ...fii, ...toUpdate, fii_type: updatedData.fiiType || fii.fii_type } : fii
      );
      
      set({ 
        portfolio: newPortfolio,
        metrics: calculateMetrics(newPortfolio)
      });
      
      // Recarrega do banco para garantir
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