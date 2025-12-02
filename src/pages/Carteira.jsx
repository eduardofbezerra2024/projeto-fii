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
  // Usamos a store diretamente agora, pois ela gerencia o estado e o banco
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

  // Carregar dados do Banco ao entrar na tela
  useEffect(() => {
    fetchPortfolio(); // <--- Busca os dados do Supabase

    const storedDate = YieldService.getLastUpdate();
    if (storedDate) {
      setLastUpdateDate(new Date(storedDate));
    }
    
    // Checa se precisa atualizar automaticamente (se passou 24h)
    const shouldRefresh = !storedDate || (new Date() - new Date(storedDate)) > 24 * 60 * 60 * 1000;
    if (shouldRefresh && portfolio.length > 0) {
      handleRefreshYields();
    }
  }, []); // Executa apenas uma vez ao montar

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
        toast({
          title: 'Sucesso',
          description: `${fiiData.ticker} atualizado na carteira.`
        });
      } else {
        await addFII(fiiData);
        toast({
          title: 'Sucesso',
          description: `${fiiData.ticker} adicionado à carteira.`
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar no banco de dados.',
        variant: 'destructive'
      });
    }
  };
  
  const handleRemoveFII = async (id) => {
    try {
      await removeFII(id);
      toast({
        title: 'Sucesso',
        description: 'FII removido da carteira'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item.',
        variant: 'destructive'
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
        
        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Investido</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalInvested)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Atual</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.currentValue)}</p>
          </div>
          
          {/* CARD DE RENDA MENSAL (Novo) */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 shadow-sm border border-green-100 dark:border-green-900/30">
            <p className="text-sm text-green-800 dark:text-green-400 mb-1 font-medium">Renda Mensal Estimada</p>
            <div className="flex items-center">
                <Coins className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(metrics.totalDividends)}
                </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lucro/Prejuízo</p>
            <p className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.profitLoss)}
            </p>
          </div>
        </div>
        
        {/* Loading State ou Conteúdo */}
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