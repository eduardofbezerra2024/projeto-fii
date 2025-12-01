import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Trash2, History, TrendingUp, DollarSign, Activity, RefreshCw, ExternalLink, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFiiQuote } from '@/services/fiiService';
import { NewsService } from '@/services/NewsService'; // <--- Importamos o serviço de notícias
import { toast } from '@/components/ui/use-toast';

const Analise = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [fiiData, setFiiData] = useState(null);
  const [news, setNews] = useState([]); // <--- Estado para guardar as notícias
  const [history, setHistory] = useState([]);

  // 1. Carregar histórico ao abrir
  useEffect(() => {
    const saved = localStorage.getItem('fii_search_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const addToHistory = (newTicker) => {
    const upperTicker = newTicker.toUpperCase();
    const newHistory = [upperTicker, ...history.filter(t => t !== upperTicker)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('fii_search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('fii_search_history');
    toast({ description: "Histórico limpo." });
  };

  // FUNÇÃO PRINCIPAL DE BUSCA (ATUALIZADA)
  const performSearch = async (code) => {
    setLoading(true);
    setFiiData(null);
    setNews([]); // Limpa notícias antigas

    try {
      // 1. Busca Dados Financeiros
      const data = await getFiiQuote(code);
      
      if (data) {
        setFiiData(data);
        addToHistory(code);

        // 2. Busca Notícias (Só busca se achou o FII)
        try {
          const recentNews = await NewsService.getRecentNews(code);
          setNews(recentNews);
        } catch (newsError) {
          console.error("Erro ao buscar notícias:", newsError);
        }

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

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!ticker || ticker.length < 4) return;
    performSearch(ticker.toUpperCase());
  };

  const handleHistoryClick = (histTicker) => {
    setTicker(histTicker);
    performSearch(histTicker);
  };

  return (
    <>
      <Helmet>
        <title>Análise de FIIs - FII Analyzer</title>
      </Helmet>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análise de FIIs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Dados financeiros e notícias em tempo real</p>
        </div>

        {/* Área de Busca */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input 
              placeholder="Digite o ticker (ex: HGLG11)" 
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="flex-1 uppercase"
            />
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </form>

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
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs h-7 text-red-400 hover:bg-red-50">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {fiiData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. Cabeçalho e Preço */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{fiiData.name?.split(' ')[0] || ticker}</h2>
                <p className="text-gray-500">{fiiData.name}</p>
              </div>
              <div className="text-right bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-xl border border-green-100 dark:border-green-900/30">
                <p className="text-sm text-gray-500 dark:text-gray-400">Cotação Atual</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  R$ {fiiData.price?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* 2. Grid de Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Setor</CardTitle></CardHeader>
                <CardContent><div className="text-lg font-bold">{fiiData.sector}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">P/VP</CardTitle></CardHeader>
                <CardContent><div className="text-lg font-bold">{(fiiData.price / (fiiData.vpa || 1)).toFixed(2)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Dividend Yield (12m)</CardTitle></CardHeader>
                <CardContent><div className="text-lg font-bold text-green-600">{fiiData.dividendYield ? `${fiiData.dividendYield.toFixed(2)}%` : '-'}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Valor Patrimonial</CardTitle></CardHeader>
                <CardContent><div className="text-lg font-bold">R$ {fiiData.vpa?.toFixed(2)}</div></CardContent>
              </Card>
            </div>

            {/* 3. SEÇÃO DE NOTÍCIAS (NOVO) */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
                Últimas Notícias sobre {ticker}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.length > 0 ? (
                  news.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <Card className="h-full hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 line-clamp-2 mb-2">
                            {item.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{item.source}</span>
                            <span className="flex items-center">
                              {new Date(item.date).toLocaleDateString()} 
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500">Nenhuma notícia recente encontrada para este fundo.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Analise;