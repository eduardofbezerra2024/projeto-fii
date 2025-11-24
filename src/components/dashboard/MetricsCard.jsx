import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const MetricsCard = ({ title, value, change, changePercent, icon: Icon, index = 0 }) => {
  const isPositive = change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </h3>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{formatCurrency(Math.abs(change))}</span>
              {changePercent !== undefined && (
                <span>({formatPercent(Math.abs(changePercent))})</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricsCard;