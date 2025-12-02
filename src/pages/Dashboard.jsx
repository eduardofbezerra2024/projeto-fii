import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, PieChart as PieIcon, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCarteiraStore from '@/store/carteiraStore';
import { formatCurrency } from '@/utils/formatters';

const Dashboard = () => {
  const { portfolio, fetchPortfolio, metrics, isLoading } = useCarteiraStore();

  // Carrega os dados ao abrir o Dashboard
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // --- 1. PREPARAR DADOS PARA O GRÁFICO DE SETORES ---
  const sectorData = useMemo(() => {
    if (!portfolio.length) return [];

    // Agrupa os valores por Tipo (Tijolo, Papel, etc.)
    const distribution = portfolio.reduce((acc, item) => {
      const type = item.fii_type || 'Indefinido';
      const totalValue = (item.currentPrice || item.price) * item.quantity;
      
      acc[type] = (acc[type] || 0) + totalValue;
      return acc;
    }, {});

    // Transforma em formato para o gráfico
    return Object.keys(distribution).map(key => ({
      name: key,
      value: distribution[key]
    })).sort((a, b) => b.value - a.value); // Ordena do maior para o menor
  }, [portfolio]);

  // Cores para o gráfico (Tijolo=Laranja, Papel=Azul, etc)
  const COLORS = {
    'Tijolo': '#f97316', // Orange
    'Papel': '#3b82f6',  // Blue
    'Fiagro': '#22c55e', // Green
    'Infra': '#a855f7',  // Purple
    'Hibrido': '#eab308',// Yellow
    'Outros': '#94a3b8', // Gray
    'Indefinido': '#cbd5e1'
  };

  // --- 2. DADOS FAKE PARA EVOLUÇÃO (Futuramente pegaremos do histórico) ---
  const evolutionData = [
    { name: 'Jan', valor: 1000 },
    { name: 'Fev', valor: 1500 },
    { name: 'Mar', valor: metrics.currentValue || 2000 },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - FII Analyzer</title>
      </Helmet>

      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral da sua liberdade financeira</p>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Patrimônio Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.currentValue)}</div>
              <p className="text-xs text-gray-500">Valor atual de mercado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Investido</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvested)}</div>
              <p className="text-xs text-gray-500">Custo de aquisição</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Resultado</CardTitle>
              <TrendingUp className={`h-4 w-4 ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.profitLoss)}
              </div>
              <p className="text-xs text-gray-500">Valorização da carteira</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ativos</CardTitle>
              <PieIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.length}</div>
              <p className="text-xs text-gray-500">Fundos na carteira</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GRÁFICO DE EVOLUÇÃO (Exemplo) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Evolução Patrimonial</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="valor" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* GRÁFICO DE DISTRIBUIÇÃO (REAL) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Alocação por Tipo</CardTitle>
            </CardHeader>
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
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Outros']} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Adicione ativos para ver o gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;