import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

const IndicatorsPanel = ({ fii }) => {
  const indicators = [
    {
      icon: DollarSign,
      label: 'Último Dividendo',
      value: formatCurrency(fii.lastDividend),
      color: 'green'
    },
    {
      icon: Calendar,
      label: 'Data do Pagamento',
      value: formatDate(fii.dividendDate),
      color: 'blue'
    },
    {
      icon: BarChart3,
      label: 'Patrimônio Líquido',
      value: 'R$ 1.2B',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      label: 'Valorização 12m',
      value: '+15.3%',
      color: 'orange'
    }
  ];
  
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Indicadores Principais
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map((indicator, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[indicator.color]}`}>
              <indicator.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{indicator.label}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{indicator.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndicatorsPanel;