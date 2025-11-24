import React from 'react';
import AlertCard from './AlertCard';

const AlertsList = ({ alerts, onEdit, onRemove, onTest }) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">Nenhum alerta configurado</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onEdit={onEdit}
          onRemove={onRemove}
          onTest={onTest}
        />
      ))}
    </div>
  );
};

export default AlertsList;