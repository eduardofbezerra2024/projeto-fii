import React from 'react';
import { TrendingUp, DollarSign, PiggyBank, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const SimulatorResults = ({ results }) => {
  if (!results) return null;
  
  const cards = [
    {
      icon: PiggyBank,
      label: 'Total Investido',
      value: results.totalInvested,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Valor Final',
      value: results.futureValue,
      color: 'green'
    },
    {
      icon: DollarSign,
      label: 'Dividendos Acumulados',
      value: results.accumulatedDividends,
      color: 'purple'
    },
    {
      icon: Calendar,
      label: 'Lucro Total',
      value: results.totalProfit,
      color: 'orange'
    }
  ];
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Resultados da Simulação
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${colorClasses[card.color]} rounded-xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-start justify-between mb-2">
              <card.icon className="h-8 w-8" />
            </div>
            <p className="text-sm opacity-90 mb-1">{card.label}</p>
            <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulatorResults;