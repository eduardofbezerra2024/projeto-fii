import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Wallet, BarChart3, Building2, Calendar, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFiiQuote } from '@/services/fiiService';
import useCarteiraStore from '@/store/carteiraStore';
import { formatCurrency } from '@/utils/formatters';

const DetalhesAtivo = () => {
  const { ticker } = useParams(); 
  const navigate = useNavigate();
  const { portfolio } = useCarteiraStore();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState('6mo'); 

  const userPosition = portfolio.find(p => p.ticker === ticker?.toUpperCase());

  useEffect(() => {
    if (!ticker) return;
    fetchData();
  }, [ticker, chartRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const symbol = ticker.toUpperCase();
        
        // 1. Cotação
        const quoteData = await getFiiQuote(symbol);
        setQuote(quoteData);

        // 2. Fundamentos
        const fundRes = await fetch(`/api/dividend?ticker=${symbol}`);
        const fundData = await fundRes.json();
        setFundamentals(fundData.details || {});

        // 3. Histórico
        const histRes = await fetch(`/api/history?ticker=${symbol}&range=${chartRange}`);
        const histData = await histRes.json();
        setChartData(histData);

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    } finally {
        setLoading(false);
    }
  };

  const calculateProfit = () => {
    if (!userPosition || !quote) return 0;
    return (quote.price - userPosition.price) * userPosition.quantity;
  };

  if (loading && !quote) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
        <p className="animate-pulse">Carregando dados do {ticker}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {ticker?.toUpperCase()}
                    {fundamentals?.segmento && (
                        <span className="hidden sm:inline-block text-xs font-normal px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                            {fundamentals.segmento}
                        </span>
                    )}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{quote?.name || 'Fundo Imobiliário'}</p>
            </div>
        </div>
        <div className="text-left sm:text-right bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 sm:border-0 sm:shadow-none sm:bg-transparent">
            <p className="text-xs text-gray-500 uppercase">Preço Atual</p>
            <p className={`text-2xl sm:text-3xl font-bold ${quote?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(quote?.price || 0)}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* GRÁFICO */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Histórico de Preço</CardTitle>
                    <div className="flex gap-1">
                        {['1mo', '6mo', '1y', '5y'].map(range => (
                            <Button 
                                key={range} 
                                variant={chartRange === range ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => setChartRange(range)}
                                className="h-7 text-xs px-2"
                            >
                                {range.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="h-[300px] sm:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} minTickGap={40} />
                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} width={50} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`R$ ${value.toFixed(2)}`, "Preço"]}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                            />
                            <Area type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* CARD DE POSIÇÃO (Se tiver na carteira) */}
            {userPosition && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4 text-blue-800 dark:text-blue-300">
                        <Wallet className="h-6 w-6" />
                        <h3 className="text-xl font-bold">Sua Posição</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Quantidade</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{userPosition.quantity}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Preço Médio</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(userPosition.price)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Investido</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(userPosition.price * userPosition.quantity)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Lucro Hoje</p>
                            <p className={`text-xl sm:text-2xl font-bold ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {calculateProfit() > 0 ? '+' : ''}{formatCurrency(calculateProfit())}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* COLUNA DIREITA: INDICADORES */}
        <div className="space-y-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Info className="h-5 w-5" /> Indicadores
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <CardIndicator title="Último Rendimento" value={fundamentals?.ultimoRendimento || '-'} icon={DollarSign} color="text-green-600" />
                <CardIndicator title="Dividend Yield (12m)" value={quote?.dividendYield ? `${quote.dividendYield}%` : '-'} icon={TrendingUp} />
                <CardIndicator title="P/VP" value={fundamentals?.vpa && quote ? (quote.price / parseFloat(fundamentals.vpa.replace('R$','').replace('.','').replace(',','.'))).toFixed(2) : '-'} icon={BarChart3} />
                <CardIndicator title="Valor Patrimonial" value={fundamentals?.vpa || '-'} icon={Building2} />
                <CardIndicator title="Patrimônio Líquido" value={fundamentals?.valorPatrimonial || '-'} icon={Building2} />
                <CardIndicator title="Vacância" value={fundamentals?.vacancia || '-'} icon={Building2} />
                <CardIndicator title="Público Alvo" value={fundamentals?.publicoAlvo || '-'} icon={Calendar} />
            </div>
        </div>

      </div>
    </div>
  );
};

const CardIndicator = ({ title, value, icon: Icon, color = "text-gray-900 dark:text-white" }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between shadow-sm h-full">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold">{title}</p>
            {Icon && <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"><Icon className="h-4 w-4 text-gray-500" /></div>}
        </div>
        <p className={`text-base sm:text-lg font-bold ${color} break-words`}>{value}</p>
    </div>
);

export default DetalhesAtivo;