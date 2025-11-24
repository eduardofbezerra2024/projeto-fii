import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import SimulatorForm from '@/components/simulador/SimulatorForm';
import SimulatorResults from '@/components/simulador/SimulatorResults';
import ProjectionChart from '@/components/simulador/ProjectionChart';
import { calculateFutureValue, calculateAccumulatedDividends, calculateProjectionData } from '@/utils/calculations';

const Simulador = () => {
  const [results, setResults] = useState(null);
  const [projectionData, setProjectionData] = useState(null);
  
  const handleCalculate = (params) => {
    const futureValue = calculateFutureValue(
      params.initialInvestment,
      params.monthlyContribution,
      params.months,
      params.expectedYield
    );
    
    const accumulatedDividends = calculateAccumulatedDividends(
      params.initialInvestment,
      params.monthlyContribution,
      params.months,
      params.expectedYield
    );
    
    const totalInvested = params.initialInvestment + (params.monthlyContribution * params.months);
    const totalProfit = futureValue - totalInvested;
    
    setResults({
      futureValue,
      accumulatedDividends,
      totalInvested,
      totalProfit
    });
    
    const chartData = calculateProjectionData(
      params.initialInvestment,
      params.monthlyContribution,
      params.months,
      params.expectedYield
    );
    
    setProjectionData(chartData);
  };
  
  return (
    <>
      <Helmet>
        <title>Simulador - FII Analyzer</title>
        <meta name="description" content="Simule o crescimento dos seus investimentos em FIIs" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Simulador de Investimentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Projete o crescimento da sua carteira</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <SimulatorForm onCalculate={handleCalculate} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <SimulatorResults results={results} />
            <ProjectionChart data={projectionData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Simulador;