import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatters';

const PortfolioChart = ({ data }) => {
  const chartData = data || [
    { month: 'Jan', invested: 10000, value: 10500 },
    { month: 'Fev', invested: 12000, value: 12800 },
    { month: 'Mar', invested: 14000, value: 15200 },
    { month: 'Abr', invested: 16000, value: 17500 },
    { month: 'Mai', invested: 18000, value: 19800 },
    { month: 'Jun', invested: 20000, value: 22100 }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Evolução da Carteira
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="invested" 
            stroke="#3B82F6" 
            strokeWidth={2}
            name="Investido"
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Valor Atual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;