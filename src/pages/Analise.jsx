import React, { useState } from 'react';
import { Search, Building2, Users, Wallet, BarChart3, FileText, Briefcase, Calendar, Percent, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFiiQuote } from '@/services/fiiService';
import { NewsService } from '@/services/NewsService';
import { toast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

// Card otimizado para mobile (fonte ajustável)
const InfoCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between h-full hover:border-green-500/50 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate mr-1">{title}</span>
      {Icon && <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 opacity-70 flex-shrink-0" />}
    </div>
    <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words leading-tight">
      {value || '-'}
    </div>
  </div>
);

const Analise = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [extraData, setExtraData] = useState(null);
  const [news, setNews] = useState([]);

  const handleSearch = async () => {
    if (!ticker || ticker.length < 4) return;
    setLoading(true);
    setData(null);
    setExtraData(null);
    setNews([]);

    try {
      const quote = await getFiiQuote(ticker.toUpperCase());
      
      if (quote) {
        setData(quote);
        
        try {
            const response = await fetch(`/api/dividend?ticker=${ticker.toUpperCase()}`);
            const result = await response.json();
            if (result.details) {
                setExtraData(result.details);
            }
        } catch (err) {
            console.error("Erro ao buscar detalhes:", err);
        }

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

      <div className="space-y-6 pb-20"> {/* Padding bottom extra para mobile */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Análise Fundamentalista</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Dados detalhados e notícias em tempo real</p>
        </div>

        {/* Barra de Busca Responsiva */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <Input 
            placeholder="Digite o ticker (ex: MXRF11)" 
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="uppercase text-lg h-12" // Altura maior para toque
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full sm:w-32 h-12 text-lg">
            {loading ? '...' : <Search className="h-5 w-5" />}
          </Button>
        </div>

        {/* RESULTADOS */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Cabeçalho do Fundo - Stacked no mobile */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{data.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-bold text-gray-700 dark:text-gray-200">{ticker.toUpperCase()}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{data.sector}</span>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Cotação Atual</p>
                <p className="text-4xl font-bold text-green-600">R$ {data.price.toFixed(2)}</p>
              </div>
            </div>

            {/* GRADE DE INFORMAÇÕES - 2 Colunas no Mobile */}
            {extraData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Linha 1 - Principais */}
                    <InfoCard title="Último Rendimento" value={extraData.ultimoRendimento} icon={Wallet} />
                    <InfoCard title="DY (Yield)" value={data.dividendYield ? `${data.dividendYield.toFixed(2)}%` : '-'} icon={Percent} />
                    <InfoCard title="VPA" value={extraData.vpa} icon={BarChart3} />
                    <InfoCard title="P/VP" value={calculatePVP()} icon={Percent} />

                    {/* Linha 2 - Estrutura */}
                    <InfoCard title="Liquidez Diária" value={data.liquidity || '-'} icon={BarChart3} />
                    <InfoCard title="Vacância" value={extraData.vacancia} icon={Building2} />
                    <div className="col-span-2 sm:col-span-1"> {/* Ocupa 2 colunas no mobile se precisar destaque */}
                        <InfoCard title="Patrimônio" value={extraData.valorPatrimonial} icon={Building2} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <InfoCard title="Cotas" value={extraData.cotasEmitidas} icon={FileText} />
                    </div>

                    {/* Linha 3 - Qualitativo */}
                    <InfoCard title="Tipo" value={extraData.tipoFundo} icon={Briefcase} />
                    <InfoCard title="Segmento" value={extraData.segmento} icon={Briefcase} />
                    <div className="col-span-2 sm:col-span-1">
                        <InfoCard title="Gestão" value={extraData.gestao} icon={Users} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <InfoCard title="Taxa Adm" value={extraData.taxaAdm} icon={Percent} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="animate-pulse">Carregando indicadores detalhados...</div>
                </div>
            )}

            {/* SEÇÃO DE NOTÍCIAS */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
                    Notícias Recentes
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
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base line-clamp-2">{item.title}</h4>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{item.source}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm">Nenhuma notícia recente encontrada.</p>
                )}
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Analise;