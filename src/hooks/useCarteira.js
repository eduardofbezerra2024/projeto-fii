import useCarteiraStore from '@/store/carteiraStore';
import { calculatePortfolioMetrics } from '@/utils/calculations';

export const useCarteira = () => {
  const { portfolio, addFII, updateFII, removeFII, clearPortfolio } = useCarteiraStore();
  
  const metrics = calculatePortfolioMetrics(portfolio);
  
  return {
    portfolio,
    metrics,
    addFII,
    updateFII,
    removeFII,
    clearPortfolio
  };
};