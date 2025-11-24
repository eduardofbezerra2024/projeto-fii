
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCarteiraStore = create(
  persist(
    (set, get) => ({
      portfolio: [
        {
          id: '1',
          ticker: 'RZTR11',
          name: 'RBR Alpha Multiestratégia Real Estate',
          sector: 'Real Estate',
          quantity: 100,
          avgPrice: 115.00,
          currentPrice: 120.50,
          dividendYield: 8.5,
          lastUpdated: null
        },
        {
          id: '2',
          ticker: 'CPTS11',
          name: 'Capitânia Securities II',
          sector: 'Logistics',
          quantity: 150,
          avgPrice: 92.00,
          currentPrice: 95.30,
          dividendYield: 7.2,
          lastUpdated: null
        }
      ],
      
      addFII: (fii) => {
        set((state) => ({
          portfolio: [...state.portfolio, { ...fii, id: Date.now().toString(), lastUpdated: new Date().toISOString() }]
        }));
      },
      
      updateFII: (id, updatedFII) => {
        set((state) => ({
          portfolio: state.portfolio.map((item) =>
            item.id === id ? { ...item, ...updatedFII } : item
          )
        }));
      },
      
      // New action to batch update yields and prices
      updateYields: (updates) => {
        set((state) => {
          const newPortfolio = state.portfolio.map((item) => {
            const update = updates.find(u => u.ticker === item.ticker);
            if (update) {
              return {
                ...item,
                dividendYield: update.dividendYield,
                currentPrice: update.currentPrice,
                lastUpdated: update.lastUpdated
              };
            }
            return item;
          });
          return { portfolio: newPortfolio };
        });
      },
      
      removeFII: (id) => {
        set((state) => ({
          portfolio: state.portfolio.filter((item) => item.id !== id)
        }));
      },
      
      clearPortfolio: () => {
        set({ portfolio: [] });
      }
    }),
    {
      name: 'carteira-storage'
    }
  )
);

export default useCarteiraStore;
