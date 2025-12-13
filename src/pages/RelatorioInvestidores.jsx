import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, Wallet, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCarteiraStore from '@/store/carteiraStore';
import { formatCurrency } from '@/utils/formatters';

const RelatorioInvestidores = () => {
  const { portfolio } = useCarteiraStore();

  // Lógica para agrupar dados por "owner" (Investidor)
  const dataByInvestor = useMemo(() => {
    const groups = {};

    portfolio.forEach(asset => {
      // Se não tiver nome, chama de "Não Identificado"
      const owner = asset.owner ? asset.owner.trim() : 'Geral';
      
      if (!groups[owner]) {
        groups[owner] = {
          name: owner,
          totalInvested: 0,
          currentValue: 0,
          monthlyIncome: 0,
          assetCount: 0,
          assets: []
        };
      }

      const qtd = Number(asset.quantity);
      const price = Number(asset.price); // Preço Médio
      const curPrice = Number(asset.currentPrice) || price;
      const dividend = Number(asset.last_dividend) || 0;

      groups[owner].totalInvested += price * qtd;
      groups[owner].currentValue += curPrice * qtd;
      groups[owner].monthlyIncome += dividend * qtd;
      groups[owner].assetCount += 1;
      groups[owner].assets.push({
        ticker: asset.ticker,
        qtd,
        total: curPrice * qtd
      });
    });

    // Transforma objeto em array e ordena por valor total
    return Object.values(groups).sort((a, b) => b.currentValue - a.currentValue);
  }, [portfolio]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (portfolio.length === 0) {
    return <div className="p-10 text-center text-gray-500">Sua carteira está vazia. Adicione ativos para ver o relatório.</div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="h-8 w-8 text-blue-600" /> Relatório por Investidor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Veja a divisão do patrimônio entre os sócios da carteira.</p>
      </div>

      {/* GRÁFICOS GERAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Pizza: Divisão do Patrimônio */}
        <Card>
            <CardHeader><CardTitle>Participação no Patrimônio</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={dataByInvestor} dataKey="currentValue" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                            {dataByInvestor.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Gráfico de Barras: Renda Mensal por Investidor */}
        <Card>
            <CardHeader><CardTitle>Renda Mensal (Proventos)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataByInvestor} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="monthlyIncome" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#10b981', fontSize: 12, formatter: (val) => formatCurrency(val) }} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* DETALHES POR PESSOA (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataByInvestor.map((investor, index) => (
            <Card key={index} className="border-t-4" style={{ borderTopColor: COLORS[index % COLORS.length] }}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex justify-between items-center">
                        {investor.name}
                        <span className="text-sm font-normal px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                            {investor.assetCount} ativos
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Patrimônio</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(investor.currentValue)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Renda Mensal</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(investor.monthlyIncome)}</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Principais Ativos:</p>
                        <div className="flex flex-wrap gap-2">
                            {investor.assets.sort((a,b) => b.total - a.total).slice(0, 5).map(asset => (
                                <span key={asset.ticker} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                    {asset.ticker}
                                </span>
                            ))}
                            {investor.assets.length > 5 && <span className="text-xs text-gray-400">+{investor.assets.length - 5}</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

    </div>
  );
};

export default RelatorioInvestidores;