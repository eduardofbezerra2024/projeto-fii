import React from 'react';
import { Helmet } from 'react-helmet';
import { Wallet, TrendingUp, DollarSign, Percent } from 'lucide-react';
import MetricsCard from '@/components/dashboard/MetricsCard';
import PortfolioChart from '@/components/dashboard/PortfolioChart';
import SectorDistribution from '@/components/dashboard/SectorDistribution';
import PerformanceTable from '@/components/dashboard/PerformanceTable';
import DividendProjection from '@/components/dashboard/DividendProjection';
import { useCarteira } from '@/hooks/useCarteira';

const Dashboard = () => {
  const { portfolio, metrics } = useCarteira();
  
  return (
    <>
      <Helmet>
        <title>Dashboard - FII Analyzer</title>
        <meta name="description" content="Acompanhe seus investimentos em Fundos Imobiliários" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral dos seus investimentos</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Investido"
            value={metrics.totalInvested}
            icon={Wallet}
            index={0}
          />
          <MetricsCard
            title="Valor Atual"
            value={metrics.currentValue}
            change={metrics.profitLoss}
            changePercent={metrics.profitLossPercent}
            icon={TrendingUp}
            index={1}
          />
          <MetricsCard
            title="Dividendos Mensais"
            value={metrics.monthlyDividends}
            icon={DollarSign}
            index={2}
          />
          <MetricsCard
            title="Yield Médio"
            value={`${metrics.avgYield.toFixed(2)}%`}
            icon={Percent}
            index={3}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PortfolioChart />
          </div>
          <div>
            <DividendProjection
              monthlyDividends={metrics.monthlyDividends}
              annualDividends={metrics.annualDividends}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceTable portfolio={portfolio} />
          </div>
          <div>
            <SectorDistribution portfolio={portfolio} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;