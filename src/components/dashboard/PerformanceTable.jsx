import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { calculateProfitLoss, calculateProfitLossPercent } from '@/utils/calculations';

const PerformanceTable = ({ portfolio }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance dos FIIs
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">FII</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Qtd</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Preço Médio</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Preço Atual</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Lucro/Prejuízo</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Yield</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item) => {
              const profitLoss = calculateProfitLoss(item.quantity, item.avgPrice, item.currentPrice);
              const profitLossPercent = calculateProfitLossPercent(item.avgPrice, item.currentPrice);
              const isPositive = profitLoss >= 0;
              
              return (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.ticker}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{item.quantity}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{formatCurrency(item.avgPrice)}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{formatCurrency(item.currentPrice)}</td>
                  <td className="text-right py-3 px-4">
                    <div className={`flex items-center justify-end space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{formatCurrency(Math.abs(profitLoss))}</span>
                      <span className="text-sm">({formatPercent(Math.abs(profitLossPercent))})</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                    {formatPercent(item.dividendYield)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceTable;