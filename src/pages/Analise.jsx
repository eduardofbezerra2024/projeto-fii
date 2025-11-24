import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FIIAnalysisCard from '@/components/analise/FIIAnalysisCard';
import IndicatorsPanel from '@/components/analise/IndicatorsPanel';
import HistoricalChart from '@/components/analise/HistoricalChart';
import { useFIIData } from '@/hooks/useFIIData';
import { toast } from '@/components/ui/use-toast';

const Analise = () => {
  const { fiis, getFIIByTicker } = useFIIData();
  const [selectedFII, setSelectedFII] = useState(fiis[0]);
  const [searchTicker, setSearchTicker] = useState('');
  
  const handleSearch = () => {
    const fii = getFIIByTicker(searchTicker.toUpperCase());
    if (fii) {
      setSelectedFII(fii);
    } else {
      toast({
        title: 'FII não encontrado',
        description: 'Tente outro ticker',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Análise - FII Analyzer</title>
        <meta name="description" content="Análise detalhada de Fundos Imobiliários" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análise de FIIs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Análise detalhada de fundos imobiliários</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                placeholder="Digite o ticker do FII (ex: RZTR11)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {fiis.map((fii) => (
              <Button
                key={fii.id}
                variant={selectedFII?.id === fii.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFII(fii)}
                className={selectedFII?.id === fii.id ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {fii.ticker}
              </Button>
            ))}
          </div>
        </div>
        
        {selectedFII && (
          <div className="space-y-6">
            <FIIAnalysisCard fii={selectedFII} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IndicatorsPanel fii={selectedFII} />
              <HistoricalChart ticker={selectedFII.ticker} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Analise;