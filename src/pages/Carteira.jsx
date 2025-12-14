import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, RefreshCw, Clock, Percent } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import CarteiraTable from '@/components/carteira/CarteiraTable';
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
    sellFII, 
    fetchPortfolio,
    updateYields,
    isLoading 
  } = useCarteiraStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFII, setEditingFII] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);

  useEffect(() => {
    if (portfolio.length === 0) {
      fetchPortfolio();
    }
  }, [fetchPortfolio, portfolio.length]);

  useEffect(() => {
    const storedDate = YieldService.getLastUpdate();
    if (storedDate) {
      setLastUpdateDate(new Date(storedDate));
    }
  }, []);

  const averageYield = useMemo(() => {
    if (!portfolio || portfolio.length === 0 || metrics.currentValue === 0) return 0;
    const weightedSum = portfolio.reduce((acc, fii) => {
      const fiiTotalValue = (fii.currentPrice || 0) * (fii.quantity || 0);
      const fiiYield = fii.dividendYield || 0;
      return acc + (fiiTotalValue * fiiYield);
    }, 0);
    return weightedSum / metrics.currentValue;
  }, [portfolio, metrics.currentValue]);
  
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
        toast({ title: 'Sucesso', description: `${fiiData.ticker} atualizado na carteira.` });
      } else {
        await addFII(fiiData);
        toast({ title: 'Sucesso', description: `${fiiData.ticker} adicionado à carteira.` });
      }
    } catch (error) {
      console.error(error);
      // Aqui mostramos o erro para o usuário!
      toast({ 
        title: "Erro ao salvar", 
        description: "Verifique se todos os campos estão preenchidos corretamente.", 
        variant: "destructive" 
      });
    }
  };
  
  const handleRemoveFII = async (id) => {
    try {
      await removeFII(id);
      toast({ title: 'Sucesso', description: 'FII removido da carteira' });
    } catch (error) {
       toast({ title: "Erro", description: "Falha ao remover item.", variant: "destructive" });
    }
  };

  const handleSellFII = async (saleData) => {
    try {
      await sellFII(saleData.ticker, saleData.quantity, saleData.price, saleData.date);
      toast({ 
        title: 'Venda Realizada', 
        description: `Venda de ${saleData.quantity} cotas de ${saleData.ticker} registrada com sucesso.` 
      });
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Erro na venda", 
        description: error.message || "Não foi possível realizar a venda.", 
        variant: "destructive" 
      });
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
        toast({ title: "Atualizado", description: "Yields e preços atualizados com sucesso." });
      } else {
        toast({ title: "Sem atualizações", description: "Não foi possível obter novos dados no momento." });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao atualizar dados.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Carteira - FII Analyzer</title>
      </Helmet>
      
      <div className="space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Minha Carteira</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>Gerencie seus FIIs</span>
              {lastUpdateDate && (
                <>
                  <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Atualizado: {lastUpdateDate.toLocaleDateString()} {lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleRefreshYields}
              disabled={isUpdating}
              className="gap-2 flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="sm:hidden">Atualizar</span>
              <span className="hidden sm:inline">{isUpdating ? 'Atualizando...' : 'Atualizar Yields'}</span>
            </Button>
            
            <Button onClick={handleAddFII} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
        
        {/* GRID DE MÉTRICAS */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Investido</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {isLoading ? "..." : formatCurrency(metrics.totalInvested)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor Atual</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
               {isLoading ? "..." : formatCurrency(metrics.currentValue)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Yield Médio</p>
            <div className="flex items-center">
                <Percent className="h-4 w-4 text-blue-500 mr-1" />
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                {(averageYield > 1 ? averageYield : averageYield * 100).toFixed(2)}%
                </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lucro/Prejuízo</p>
            <p className={`text-lg sm:text-2xl font-bold truncate ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {isLoading ? "..." : formatCurrency(metrics.profitLoss)}
            </p>
          </div>
        </div>
        
        {/* TABELA DE ATIVOS */}
        {portfolio.length > 0 ? (
            <div className="overflow-x-auto">
                <CarteiraTable
                  portfolio={portfolio}
                  onEdit={handleEditFII}
                  onRemove={handleRemoveFII}
                  onSell={handleSellFII} 
                />
            </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mx-4 sm:mx-0">
            {isLoading ? (
               <p className="text-gray-500">Carregando carteira...</p>
            ) : (
              <>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Sua carteira está vazia</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 px-4">Adicione seu primeiro FII para começar a análise.</p>
                <Button onClick={handleAddFII} className="mt-6 bg-green-600 hover:bg-green-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar FII
                </Button>
              </>
            )}
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