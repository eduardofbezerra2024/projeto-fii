import React, { useState } from 'react';
import { Search, Building2, Users, Wallet, BarChart3, FileText, Briefcase, Calendar, Percent, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFiiQuote } from '@/services/fiiService';
import { NewsService } from '@/services/NewsService';
import { toast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

// Componente visual para cada "Card" de informação
const InfoCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between h-full hover:border-green-500/50 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
      {Icon && <Icon className="h-4 w-4 text-green-600 opacity-70" />}
    </div>
    <div className="text-lg font-bold text-gray-900 dark:text-white break-words">
      {value || '-'}
    </div>
  </div>
);

const Analise = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null); // Dados básicos (Preço, Nome)
  const [extraData, setExtraData] = useState(null); // Dados do Scraper (CNPJ, Vacância, etc)
  const [news, setNews] = useState([]); // Notícias

  const handleSearch = async () => {
    if (!ticker || ticker.length < 4) return;
    setLoading(true);
    setData(null);
    setExtraData(null);
    setNews([]);

    try {
      // 1. Busca dados básicos (Preço, Nome) da Brapi
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setData(quote);
        
        // 2. Busca dados COMPLETOS do seu Scraper (Investidor10)
        try {
            const response = await fetch(`/api/dividend?ticker=${ticker.toUpperCase()}`);
            const result = await response.json();
            if (result.details) {
                setExtraData(result.details);
            }
        } catch (err) {
            console.error("Erro ao buscar detalhes:", err);
        }

        // 3. Busca Notícias
        try {
            const newsItems = await NewsService.getRecentNews(ticker.toUpperCase());
            setNews(newsItems);
        } catch (err) {
            console.error("Erro ao buscar notícias:", err);
        }

      } else {
        toast({ title: "Não encontrado", description: "Verifique o código do ativo.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha na busca.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para calcular P/VP se tivermos os dados
  const calculatePVP = () => {
      if (data?.price && extraData?.vpa) {
          const vpaValue = parseFloat(extraData.vpa.replace('R$','').replace(/\s/g, '').replace(',','.').trim());
          if (!isNaN(vpaValue) && vpaValue > 0) {
              return (data.price / vpaValue).toFixed(2);
          }
      }
      return '-';
  };

  return (
    <>
      <Helmet>
        <title>Análise de FIIs - FII Analyzer</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análise Fundamentalista</h1>
          <p className="text-gray-600 dark:text-gray-400">Dados detalhados e notícias em tempo real</p>
        </div>

        {/* Barra de Busca */}
        <div className="flex gap-2 max-w-lg">
          <Input 
            placeholder="Digite o ticker (ex: MXRF11)" 
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="uppercase text-lg"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-green-600 hover:bg-green-700 w-32">
            {loading ? '...' : <Search className="h-5 w-5" />}
          </Button>
        </div>

        {/* RESULTADOS */}
        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Cabeçalho do Fundo */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{data.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-bold text-gray-700 dark:text-gray-200">{ticker.toUpperCase()}</span>
                    <span className="text-gray-500 dark:text-gray-400">{data.sector}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Cotação Atual</p>
                <p className="text-4xl font-bold text-green-600">R$ {data.price.toFixed(2)}</p>
              </div>
            </div>

            {/* GRADE DE INFORMAÇÕES COMPLETAS (ESTILO INVESTIDOR10) */}
            {extraData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Linha 1 - Principais */}
                    <InfoCard title="Último Rendimento" value={extraData.ultimoRendimento} icon={Wallet} />
                    <InfoCard title="Valor Patrimonial" value={extraData.valorPatrimonial} icon={Building2} />
                    <InfoCard title="VPA (Valor por Cota)" value={extraData.vpa} icon={BarChart3} />
                    <InfoCard title="P/VP" value={calculatePVP()} icon={Percent} />

                    {/* Linha 2 - Estrutura */}
                    <InfoCard title="Cotistas" value={extraData.cotistas} icon={Users} />
                    <InfoCard title="Cotas Emitidas" value={extraData.cotasEmitidas} icon={FileText} />
                    <InfoCard title="Liquidez Diária" value={data.liquidity || '-'} icon={BarChart3} />
                    <InfoCard title="Vacância" value={extraData.vacancia} icon={Building2} />

                    {/* Linha 3 - Qualitativo */}
                    <InfoCard title="Tipo de Fundo" value={extraData.tipoFundo} icon={Briefcase} />
                    <InfoCard title="Segmento" value={extraData.segmento} icon={Briefcase} />
                    <InfoCard title="Gestão" value={extraData.gestao} icon={Users} />
                    <InfoCard title="Mandato" value={extraData.mandato} icon={FileText} />

                    {/* Linha 4 - Detalhes */}
                    <InfoCard title="CNPJ" value={extraData.cnpj} icon={FileText} />
                    <InfoCard title="Prazo" value={extraData.prazo} icon={Calendar} />
                    <div className="col-span-1 sm:col-span-2">
                        <InfoCard title="Taxa de Administração" value={extraData.taxaAdm} icon={Percent} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    Carregando indicadores detalhados...
                </div>
            )}

            {/* SEÇÃO DE NOTÍCIAS */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
                    Últimas Notícias sobre {ticker.toUpperCase()}
                </h3>
                
                {news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {news.map((item, index) => (
                            <a 
                                key={index} 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow hover:border-blue-300"
                            >
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h4>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{item.source}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma notícia recente encontrada.</p>
                )}
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Analise;