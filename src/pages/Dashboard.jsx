import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, PieChart as PieIcon, DollarSign, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCarteiraStore from '@/store/carteiraStore';
import { formatCurrency } from '@/utils/formatters';

const Dashboard = () => {
  const { portfolio, fetchPortfolio, metrics, isLoading } = useCarteiraStore();

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // 1. DADOS POR TIPO (Setores)
  const sectorData = useMemo(() => {
    if (!portfolio.length) return [];
    const distribution = portfolio.reduce((acc, item) => {
      const type = item.fii_type || 'Indefinido';
      const totalValue = (item.currentPrice || item.price) * item.quantity;
      acc[type] = (acc[type] || 0) + totalValue;
      return acc;
    }, {});

    return Object.keys(distribution).map(key => ({
      name: key,
      value: distribution[key]
    })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // 2. DADOS POR ATIVO (Qual FII pesa mais na carteira?)
  const assetsData = useMemo(() => {
    if (!portfolio.length) return [];
    return portfolio.map(item => ({
      name: item.ticker,
      value: (item.currentPrice || item.price) * item.quantity
    })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // Cores fixas para Tipos
  const COLORS_TYPE = {
    'Tijolo': '#f97316', 'Papel': '#3b82f6', 'Fiagro': '#22c55e',
    'Infra': '#a855f7', 'Hibrido': '#eab308', 'Outros': '#94a3b8', 'Indefinido': '#cbd5e1'
  };

  // Cores dinâmicas para Ativos (uma lista bonita para ir pegando)
  const COLORS_ASSETS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <>
      <Helmet>
        <title>Dashboard - FII Analyzer</title>
      </Helmet>

      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral da sua carteira</p>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Patrimônio Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : formatCurrency(metrics.currentValue)}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Renda Mensal</CardTitle>
              <Coins className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {isLoading ? "..." : formatCurrency(metrics.totalDividends)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Lucro/Prejuízo</CardTitle>
              <TrendingUp className={`h-4 w-4 ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? "..." : formatCurrency(metrics.profitLoss)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ativos</CardTitle>
              <PieIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* GRÁFICO 1: SETORES (Tipos) */}
          <Card className="col-span-1">
            <CardHeader><CardTitle>Diversificação por Setor</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {portfolio.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_TYPE[entry.name] || COLORS_TYPE['Outros']} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Adicione ativos para ver o gráfico</div>
              )}
            </CardContent>
          </Card>

          {/* GRÁFICO 2: ATIVOS (Peso na Carteira) */}
          <Card className="col-span-1">
            <CardHeader><CardTitle>Peso dos Ativos</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {portfolio.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0} // Pizza cheia para diferenciar
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_ASSETS[index % COLORS_ASSETS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Carteira vazia</div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
};

export default Dashboard;