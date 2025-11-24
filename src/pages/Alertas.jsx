
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AlertsList from '@/components/alertas/AlertsList';
import AlertForm from '@/components/alertas/AlertForm';
import { useAlertas } from '@/hooks/useAlertas';
import { toast } from '@/components/ui/use-toast';
import { AlertService } from '@/services/AlertService';

const Alertas = () => {
  const { alerts, addAlert, updateAlert, removeAlert } = useAlertas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const handleAddAlert = () => {
    setEditingAlert(null);
    setIsModalOpen(true);
  };
  
  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };
  
  const handleSaveAlert = (alertData) => {
    if (editingAlert) {
      updateAlert(editingAlert.id, alertData);
    } else {
      addAlert(alertData);
    }
  };
  
  const handleRemoveAlert = (id) => {
    removeAlert(id);
    toast({
      title: 'Sucesso',
      description: 'Alerta removido'
    });
  };
  
  const handleTestAlert = (id) => {
    // Trigger global check for convenience, or we could filter by ID in the future
    handleRunCheck();
  };

  const handleRunCheck = async () => {
    setIsTesting(true);
    toast({ 
      title: 'Verificando Alertas...', 
      description: 'Buscando preços atuais e verificando regras.', 
    });
    
    try {
      const stats = await AlertService.checkDailyPrices();
      
      if (stats.error) {
        throw new Error(stats.error);
      }

      if (stats.message) {
         toast({
            title: 'Aviso',
            description: stats.message,
         });
         return;
      }

      const description = `FIIs verificados: ${stats.checked}. Alertas disparados: ${stats.triggered}.`;

      toast({
        title: 'Verificação Concluída',
        description: description,
        variant: stats.triggered > 0 ? 'default' : 'default', // both default usually implies success/neutral in shadcn unless customized
        className: stats.triggered > 0 ? 'border-l-4 border-green-500' : ''
      });

      if (stats.triggered > 0) {
          // Additional visual cue
          setTimeout(() => {
            toast({
                title: 'Notificações Enviadas',
                description: 'Verifique seu email para detalhes dos alertas.',
            });
          }, 1500);
      }

    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro na verificação',
        description: error.message || 'Ocorreu um erro ao processar os alertas.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Alertas - FII Analyzer</title>
        <meta name="description" content="Configure alertas para seus FIIs" />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alertas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie notificações automáticas de preço</p>
          </div>
          <div className="flex items-center gap-2">
             <Button 
                variant="outline" 
                onClick={handleRunCheck} 
                disabled={isTesting}
                className="whitespace-nowrap"
            >
                {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <PlayCircle className="h-4 w-4 mr-2" />
                )}
                {isTesting ? 'Verificando...' : 'Testar Agora'}
            </Button>
            <Button onClick={handleAddAlert} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                <Plus className="h-5 w-5 mr-2" />
                Novo Alerta
            </Button>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-semibold mb-2">Monitoramento Automático</h3>
                <p className="mb-2 text-blue-50">
                  O sistema verifica os preços diariamente às 09:00. Você pode usar o botão "Testar Agora" para forçar uma verificação imediata.
                </p>
            </div>
          </div>
        </div>
        
        <AlertsList
          alerts={alerts}
          onEdit={handleEditAlert}
          onRemove={handleRemoveAlert}
          onTest={handleTestAlert}
        />
        
        <AlertForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAlert}
          editingAlert={editingAlert}
        />
      </div>
    </>
  );
};

export default Alertas;
