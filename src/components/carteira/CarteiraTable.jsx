import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { calculateTotalValue, calculateProfitLoss, calculateProfitLossPercent } from '@/utils/calculations';

const CarteiraTable = ({ portfolio, onEdit, onRemove }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">FII</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Quantidade</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Preço Médio</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Preço Atual</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Valor Total</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Lucro/Prejuízo</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Yield</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item) => {
              const totalValue = calculateTotalValue(item.quantity, item.currentPrice);
              const profitLoss = calculateProfitLoss(item.quantity, item.avgPrice, item.currentPrice);
              const profitLossPercent = calculateProfitLossPercent(item.avgPrice, item.currentPrice);
              const isPositive = profitLoss >= 0;
              
              return (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.ticker}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.sector}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{item.quantity}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{formatCurrency(item.avgPrice)}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{formatCurrency(item.currentPrice)}</td>
                  <td className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{formatCurrency(totalValue)}</td>
                  <td className="text-right py-3 px-4">
                    <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      <div>{formatCurrency(Math.abs(profitLoss))}</div>
                      <div className="text-sm">({formatPercent(Math.abs(profitLossPercent))})</div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                    {formatPercent(item.dividendYield)}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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

export default CarteiraTable;