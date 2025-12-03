import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Grid, List, RefreshCw, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarteiraTable from '@/components/carteira/CarteiraTable';
import FIICard from '@/components/carteira/FIICard';
import AddFIIModal from '@/components/carteira/AddFIIModal';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import { YieldService } from '@/services/YieldService';
import useCarteiraStore from '@/store/carteiraStore';

const Carteira = () => {
  const { 
    portfolio, 
    metrics, 
    addFII, 
    updateFII, 
    removeFII, 
    updateYields, 
    fetchPortfolio, 
    isLoading 
  } = useCarteiraStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFII, setEditingFII] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);

  useEffect(() => {
    fetchPortfolio();
    const storedDate = YieldService.getLastUpdate();
    if (storedDate) {
      setLastUpdateDate(new Date(storedDate));
    }
    const shouldRefresh = !storedDate || (new Date() - new Date(storedDate)) > 24 * 60 * 60 * 1000;
    if (shouldRefresh && portfolio.length > 0) {
      handleRefreshYields();
    }
  }, []);

  const handleAddFII = () => {
    setEditingFII(null);
    setIsModalOpen(true);
  };
  
  const handleEditFII = (fii) => {
    setEditingFII(fii);
    setIsModalOpen(true);
  };
  
  const handleSaveFII = async (fiiData) => {
    try {
      if (editingFII) {
        await updateFII(editingFII.id, fiiData);
        toast({ title: 'Sucesso', description: `${fiiData.ticker} atualizado.` });
      } else {
        await addFII(fiiData);
        toast({ title: 'Sucesso', description: `${fiiData.ticker} adicionado.` });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  };
  
  const handleRemoveFII = async (id) => {
    try {
      await removeFII(id);
      toast({ title: 'Sucesso', description: 'Removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao remover.', variant: 'destructive' });
    }
  };

  const handleRefreshYields = async () => {
    if (isUpdating) return;
    if (portfolio.length === 0) {
      toast({ title: "Carteira vazia", description: "Adicione FIIs para atualizar." });
      return;
    }
    setIsUpdating(true);
    try {
      const updates = await YieldService.updatePortfolioYields(portfolio);
      if (updates.length > 0) {
        updateYields(updates);
        YieldService.setLastUpdate();
        setLastUpdateDate(new Date());
        toast({ title: "Atualizado", description: "Preços atualizados." });
      } else {
        toast({ title: "Tudo certo", description: "Valores já estão atuais." });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Carteira - FII Analyzer</title>
      </Helmet>
      
      <div className="space-y-6 pb-20"> {/* pb-20 dá espaço para scrollar até o fim no celular */}
        
        {/* CABEÇALHO RESPONSIVO */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Minha Carteira</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Gerencie seus FIIs</span>
              {lastUpdateDate && (
                <span className="hidden md:inline text-xs bg-gray-100 px-2 py-1 rounded-full">
                   Atualizado: {lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshYields}
              disabled={isUpdating}
              className="flex-1 md:flex-none gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '...' : 'Atualizar'}
            </Button>

            {/* Esconde botões de Grid/List no celular (pq lá é sempre Card) */}
            <div className="hidden md:flex gap-1">
                <div className="h-9 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <Button variant="outline" size="icon" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-green-50' : ''}>
                <List className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-green-50' : ''}>
                <Grid className="h-5 w-5" />
                </Button>
            </div>

            <Button onClick={handleAddFII} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
        
        {/* CARDS DE MÉTRICAS - Scroll horizontal no celular para caber tudo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <p className="text-xs text-gray-500 uppercase font-bold">Patrimônio</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.currentValue)}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 shadow-sm border border-green-100 dark:border-green-900/30 flex flex-col justify-center">
            <p className="text-xs text-green-700 uppercase font-bold mb-1">Renda Mensal</p>
            <div className="flex items-center">
                <Coins className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(metrics.totalDividends)}
                </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hidden md:flex flex-col justify-center">
            <p className="text-xs text-gray-500 uppercase font-bold">Investido</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalInvested)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <p className="text-xs text-gray-500 uppercase font-bold">Lucro</p>
            <p className={`text-xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.profitLoss)}
            </p>
          </div>
        </div>
        
        {/* LISTA PRINCIPAL */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando carteira...</div>
        ) : portfolio.length > 0 ? (
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
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mx-4">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Comece agora</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Adicione seu primeiro FII.</p>
            <Button onClick={handleAddFII} className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
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