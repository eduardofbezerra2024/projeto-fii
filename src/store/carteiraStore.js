import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Função auxiliar para calcular métricas (Total investido, valor atual, lucro, etc)
const calculateMetrics = (portfolio) => {
  const totalInvested = portfolio.reduce((acc, fii) => acc + (fii.price * fii.quantity), 0);
  const currentValue = portfolio.reduce((acc, fii) => acc + (fii.currentPrice * fii.quantity), 0);
  const profitLoss = currentValue - totalInvested;
  
  return {
    totalInvested,
    currentValue,
    profitLoss,
  };
};

const useCarteiraStore = create(
  persist(
    (set) => ({
      portfolio: [],
      metrics: {
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
      },

      // Adicionar um FII
      addFII: (fii) => set((state) => {
        // Se já tiver preço atual vindo (do form), usa ele. Se não, usa o preço pago.
        const currentPrice = fii.currentPrice || fii.price;
        const newFii = { 
            ...fii, 
            id: Date.now(), // Gera um ID único
            currentPrice: Number(currentPrice),
            dividendYield: fii.dividendYield || 0 // Garante que comece com 0 se não tiver
        };
        
        const newPortfolio = [...state.portfolio, newFii];
        return {
          portfolio: newPortfolio,
          metrics: calculateMetrics(newPortfolio),
        };
      }),

      // Remover um FII
      removeFII: (id) => set((state) => {
        const newPortfolio = state.portfolio.filter((fii) => fii.id !== id);
        return {
          portfolio: newPortfolio,
          metrics: calculateMetrics(newPortfolio),
        };
      }),

      // Editar um FII manual
      updateFII: (id, updatedData) => set((state) => {
        const newPortfolio = state.portfolio.map((fii) =>
          fii.id === id ? { ...fii, ...updatedData } : fii
        );
        return {
          portfolio: newPortfolio,
          metrics: calculateMetrics(newPortfolio),
        };
      }),

      // --- AQUI ESTAVA O PROBLEMA ANTES ---
      // Essa é a função que recebe os dados do botão "Atualizar Yields"
      updateYields: (updates) => set((state) => {
        const newPortfolio = state.portfolio.map((fii) => {
          // Procura se tem atualização para este FII
          const updateData = updates.find((u) => u.id === fii.id);
          
          if (updateData) {
            // Se achou, atualiza TUDO: Preço E Yield
            return {
              ...fii,
              currentPrice: Number(updateData.currentPrice),
              // O Pulo do Gato: Força a salvar o dividendYield novo
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
    }),
    {
      name: 'fii-wallet-storage', // Nome para salvar no navegador
    }
  )
);

export default useCarteiraStore;