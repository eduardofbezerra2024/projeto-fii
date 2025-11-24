import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { calculateTotalValue, calculateProfitLoss, calculateProfitLossPercent } from '@/utils/calculations';

const FIICard = ({ fii }) => {
  const totalValue = calculateTotalValue(fii.quantity, fii.currentPrice);
  const profitLoss = calculateProfitLoss(fii.quantity, fii.avgPrice, fii.currentPrice);
  const profitLossPercent = calculateProfitLossPercent(fii.avgPrice, fii.currentPrice);
  const isPositive = profitLoss >= 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{fii.ticker}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{fii.sector}</p>
        </div>
        <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          <span className="font-medium">{formatPercent(Math.abs(profitLossPercent))}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Quantidade</span>
          <span className="font-medium text-gray-900 dark:text-white">{fii.quantity}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(fii.avgPrice)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Preço Atual</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(fii.currentPrice)}</span>
        </div>
        
        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Valor Total</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Yield</span>
          <span className="font-medium text-green-600 dark:text-green-400">{formatPercent(fii.dividendYield)}</span>
        </div>
      </div>
    </div>
  );
};

export default FIICard;