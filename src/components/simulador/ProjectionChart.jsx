import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/utils/formatters';

const ProjectionChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Projeção de Crescimento
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF"
            label={{ value: 'Meses', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            stroke="#9CA3AF" 
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="invested" 
            stackId="1"
            stroke="#3B82F6" 
            fill="#3B82F6"
            fillOpacity={0.6}
            name="Investido"
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            stackId="1"
            stroke="#10B981" 
            fill="#10B981"
            fillOpacity={0.6}
            name="Lucro"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectionChart;