import React from 'react';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const DividendProjection = ({ monthlyDividends, annualDividends }) => {
  return (
    <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-xl p-6 shadow-lg text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <DollarSign className="h-5 w-5 mr-2" />
        Projeção de Dividendos
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Mensal</span>
          </div>
          <span className="text-2xl font-bold">{formatCurrency(monthlyDividends)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Anual</span>
          </div>
          <span className="text-2xl font-bold">{formatCurrency(annualDividends)}</span>
        </div>
      </div>
      
      <p className="text-sm mt-4 opacity-90">
        Baseado no yield médio atual da carteira
      </p>
    </div>
  );
};

export default DividendProjection;