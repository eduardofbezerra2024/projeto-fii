import React from 'react';
import { Bell, Edit, Trash2, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { AlertTypes } from '@/types';

const AlertCard = ({ alert, onEdit, onRemove, onTest }) => {
  const getAlertTypeLabel = (type) => {
    const labels = {
      [AlertTypes.PRICE_BELOW]: 'Preço abaixo de',
      [AlertTypes.PRICE_ABOVE]: 'Preço acima de',
      [AlertTypes.YIELD_ABOVE]: 'Yield acima de',
      [AlertTypes.NEW_DIVIDEND]: 'Novo dividendo'
    };
    return labels[type] || type;
  };
  
  const getAlertValue = () => {
    if (alert.type === AlertTypes.YIELD_ABOVE) {
      return formatPercent(alert.value);
    }
    if (alert.type === AlertTypes.NEW_DIVIDEND) {
      return 'Notificar';
    }
    return formatCurrency(alert.value);
  };
  
  const statusColors = {
    active: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    triggered: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{alert.ticker}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[alert.status]}`}>
          {alert.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{getAlertTypeLabel(alert.type)}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{getAlertValue()}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTest(alert.id)}
        >
          <TestTube className="h-4 w-4 mr-1" />
          Testar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(alert)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(alert.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export default AlertCard;