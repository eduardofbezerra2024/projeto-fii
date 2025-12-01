import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
// ADICIONEI O 'RefreshCw' AQUI NA LISTA:
import { Search, Trash2, History, TrendingUp, DollarSign, BarChart3, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFiiQuote } from '@/services/fiiService';
import { toast } from '@/components/ui/use-toast';

const Analise = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [fiiData, setFiiData] = useState(null);
  const [history, setHistory] = useState([]);

  // 1. Carregar histórico ao abrir a página
  useEffect(() => {
    const saved = localStorage.getItem('fii_search_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // 2. Função para Salvar no Histórico
  const addToHistory = (newTicker) => {
    const upperTicker = newTicker.toUpperCase();
    const newHistory = [upperTicker, ...history.filter(t => t !== upperTicker)].slice(0, 5);
    
    setHistory(newHistory);
    localStorage.setItem('fii_search_history', JSON.stringify(newHistory));
  };

  // 3. Função para Limpar Histórico
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('fii_search_history');
    toast({ description: "Histórico de busca limpo." });
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!ticker || ticker.length < 4) return;

    setLoading(true);
    try {
      const data = await getFiiQuote(ticker.toUpperCase());
      
      if (data) {
        setFiiData(data);
        addToHistory(ticker);
      } else {
        toast({ variant: "destructive", title: "Não encontrado", description: "Verifique o código do FII." });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao buscar dados." });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (histTicker) => {
    setTicker(histTicker);
    searchDirectly(histTicker);
  };

  const searchDirectly = async (code) => {
    setLoading(true);
    try {
      const data = await getFiiQuote(code);
      if (data) setFiiData(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Análise de FIIs - FII Analyzer</title>
      </Helmet>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análise de FIIs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Análise detalhada de fundos imobiliários</p>
        </div>

        {/* Área de Busca */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input 
              placeholder="Digite o ticker do FII (ex: MXRF11)" 
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </form>

          {/* Histórico */}
          {history.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <History className="h-3 w-3" /> Recentes:
              </span>
              {history.map((histTicker) => (
                <Button 
                  key={histTicker}
                  variant="outline" 
                  size="sm"
                  onClick={() => handleHistoryClick(histTicker)}
                  className="text-xs h-7 bg-gray-50 hover:bg-green-50 hover:text-green-700 border-gray-200"
                >
                  {histTicker}
                </Button>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearHistory}
                className="text-xs h-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                title="Limpar histórico"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {fiiData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{fiiData.name?.split(' ')[0] || ticker}</h2>
                <p className="text-gray-500">{fiiData.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  R$ {fiiData.price?.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Setor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{fiiData.sector}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">P/VP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {(fiiData.price / (fiiData.vpa || 1)).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Dividend Yield (12m)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-600">
                    {fiiData.dividendYield ? `${fiiData.dividendYield.toFixed(2)}%` : '-'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Liquidez</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{fiiData.liquidity || 'Média'}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                 <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Valor Patrimonial</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">R$ {fiiData.vpa?.toFixed(2)}</p>
                    </div>
                 </CardContent>
               </Card>
               
               <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                 <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Activity className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">Ativo na B3</p>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Analise;