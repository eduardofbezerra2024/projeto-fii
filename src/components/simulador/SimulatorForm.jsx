import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SimulatorForm = ({ onCalculate }) => {
  const [formData, setFormData] = useState({
    initialInvestment: '10000',
    monthlyContribution: '1000',
    months: '12',
    expectedYield: '8.5'
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate({
      initialInvestment: parseFloat(formData.initialInvestment),
      monthlyContribution: parseFloat(formData.monthlyContribution),
      months: parseInt(formData.months),
      expectedYield: parseFloat(formData.expectedYield)
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Calculator className="h-5 w-5 mr-2 text-green-600" />
        Parâmetros da Simulação
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="initialInvestment">Investimento Inicial (R$)</Label>
          <input
            id="initialInvestment"
            name="initialInvestment"
            type="number"
            step="0.01"
            value={formData.initialInvestment}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="monthlyContribution">Aporte Mensal (R$)</Label>
          <input
            id="monthlyContribution"
            name="monthlyContribution"
            type="number"
            step="0.01"
            value={formData.monthlyContribution}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="months">Período (meses)</Label>
          <input
            id="months"
            name="months"
            type="number"
            value={formData.months}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="expectedYield">Yield Esperado (% ao ano)</Label>
          <input
            id="expectedYield"
            name="expectedYield"
            type="number"
            step="0.01"
            value={formData.expectedYield}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
          Calcular Projeção
        </Button>
      </form>
    </div>
  );
};

export default SimulatorForm;