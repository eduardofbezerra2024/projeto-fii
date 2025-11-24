import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const FIIAnalysisCard = ({ fii }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{fii.ticker}</h2>
          <p className="text-gray-600 dark:text-gray-400">{fii.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(fii.currentPrice)}</p>
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-end">
            <TrendingUp className="h-4 w-4 mr-1" />
            +2.5% no mês
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Setor</p>
          <p className="font-semibold text-gray-900 dark:text-white">{fii.sector}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">P/VP</p>
          <p className="font-semibold text-gray-900 dark:text-white">{fii.pvp}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dividend Yield</p>
          <p className="font-semibold text-green-600 dark:text-green-400">{formatPercent(fii.dividendYield)}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Liquidez</p>
          <p className="font-semibold text-gray-900 dark:text-white">{fii.liquidity}</p>
        </div>
      </div>
    </div>
  );
};

export default FIIAnalysisCard;