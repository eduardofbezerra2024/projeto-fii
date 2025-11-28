import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Grid, List, RefreshCw, Clock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarteiraTable from '@/components/carteira/CarteiraTable';
import FIICard from '@/components/carteira/FIICard';
import AddFIIModal from '@/components/carteira/AddFIIModal';
import { useCarteira } from '@/hooks/useCarteira';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import { YieldService } from '@/services/YieldService';
import useCarteiraStore from '@/store/carteiraStore';

const Carteira = () => {
  const { portfolio, metrics, addFII, updateFII, removeFII } = useCarteira();
  const { updateYields } = useCarteiraStore();
// Adicione o fetchPortfolio aqui embaixo:
  const { fetchPortfolio, isLoading } = useCarteiraStore(); // <--- Mude essa linha  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFII, setEditingFII] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);

  // Load last update time on mount
 useEffect(() => {
  // CARREGAR DADOS DO BANCO AO INICIAR
  fetchPortfolio(); // <--- Adicione essa linha no começo

  const storedDate = YieldService.getLastUpdate();
  // ... resto do código igual ...
    if (storedDate) {
      setLastUpdateDate(new Date(storedDate));
    }
    
    // Check if we need an automatic refresh on page load (if > 24h old or never updated)
    const shouldRefresh = !storedDate || (new Date() - new Date(storedDate)) > 24 * 60 * 60 * 1000;
    if (shouldRefresh && portfolio.length > 0) {
      handleRefreshYields();
    }
  }, []);

  // --- CÁLCULO AUTOMÁTICO DO YIELD MÉDIO DA CARTEIRA ---
  const averageYield = useMemo(() => {
    if (!portfolio || portfolio.length === 0 || metrics.currentValue === 0) return 0;

    const weightedSum = portfolio.reduce((acc, fii) => {
      const fiiTotalValue = (fii.currentPrice || 0) * (fii.quantity || 0);
      const fiiYield = fii.dividendYield || 0;
      return acc + (fiiTotalValue * fiiYield);
    }, 0);

    return weightedSum / metrics.currentValue;
  }, [portfolio, metrics.currentValue]);
  // -----------------------------------------------------
  
  const handleAddFII = () => {
    setEditingFII(null);
    setIsModalOpen(true);
  };
  
  const handleEditFII = (fii) => {
    setEditingFII(fii);
    setIsModalOpen(true);
  };
  
  const handleSaveFII = (fiiData) => {
    if (editingFII) {
      updateFII(editingFII.id, fiiData);
       toast({
        title: 'Sucesso',
        description: `${fiiData.ticker} atualizado na carteira.`
      });
    } else {
      addFII(fiiData);
       toast({
        title: 'Sucesso',
        description: `${fiiData.ticker} adicionado à carteira.`
      });
    }
  };
  
  const handleRemoveFII = (id) => {
    removeFII(id);
    toast({
      title: 'Sucesso',
      description: 'FII removido da carteira'
    });
  };

  const handleRefreshYields = async () => {
    if (isUpdating) return;
    if (portfolio.length === 0) {
      toast({ title: "Carteira vazia", description: "Adicione FIIs para atualizar." });
      return;
    }

    setIsUpdating(true);
    try {
      // O YieldService vai usar o getFiiQuote que acabamos de atualizar
      const updates = await YieldService.updatePortfolioYields(portfolio);
      
      if (updates.length > 0) {
        updateYields(updates);
        YieldService.setLastUpdate();
        setLastUpdateDate(new Date());
        
        toast({
          title: "Atualizado",
          description: "Yields e preços atualizados com sucesso."
        });
      } else {
        toast({
          title: "Sem atualizações",
          description: "Não foi possível obter novos dados no momento."
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar dados.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Carteira - FII Analyzer</title>
        <meta name="description" content="Gerencie sua carteira de Fundos Imobiliários" />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Minha Carteira</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Gerencie seus FIIs</span>
              {lastUpdateDate && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Atualizado: {lastUpdateDate.toLocaleDateString()} {lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRefreshYields}
              disabled={isUpdating}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Atualizando...' : 'Atualizar Yields'}
            </Button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-green-50 dark:bg-green-900/20' : ''}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-green-50 dark:bg-green-900/20' : ''}
            >
              <Grid className="h-5 w-5" />
            </Button>
            <Button onClick={handleAddFII} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar FII
            </Button>
          </div>
        </div>
        
        {/* Grid de Métricas com NOVO Card de Yield */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Investido</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalInvested)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Atual</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.currentValue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Yield Médio (12m)</p>
            <div className="flex items-center">
                <Percent className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
{/* Se o número for pequeno (ex: 0.12), multiplica por 100. Se já for grande (12), mostra direto */}
{(averageYield > 1 ? averageYield : averageYield * 100).toFixed(2)}%                </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lucro/Prejuízo</p>
            <p className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.profitLoss)}
            </p>
          </div>
        </div>
        
        {portfolio.length > 0 ? (
          viewMode === 'table' ? (
            <CarteiraTable
              portfolio={portfolio}
              onEdit={handleEditFII}
              onRemove={handleRemoveFII}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((fii) => (
                <FIICard key={fii.id} fii={fii} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Sua carteira está vazia</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Adicione seu primeiro FII para começar a análise.</p>
            <Button onClick={handleAddFII} className="mt-6 bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar FII
            </Button>
          </div>
        )}
        
        <AddFIIModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveFII}
          editingFII={editingFII}
        />
      </div>
    </>
  );
};

export default Carteira;