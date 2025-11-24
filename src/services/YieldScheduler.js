
import { YieldService } from './YieldService';
import useCarteiraStore from '@/store/carteiraStore';
import { toast } from '@/components/ui/use-toast';

const CHECK_INTERVAL = 60 * 1000; // Check every minute
const SCHEDULE_HOUR = 9; // 9 AM

export const YieldScheduler = {
  intervalId: null,

  init() {
    if (this.intervalId) return;

    console.log('[YieldScheduler] Initialized');
    
    // Initial check
    this.checkAndRun();

    // Periodic check
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, CHECK_INTERVAL);
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  async checkAndRun() {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().split('T')[0];
    
    const lastUpdate = YieldService.getLastUpdate();
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate).toISOString().split('T')[0] : null;

    // Run if:
    // 1. It's past 9 AM
    // 2. AND we haven't run today yet
    if (currentHour >= SCHEDULE_HOUR && lastUpdateDate !== today) {
      console.log('[YieldScheduler] Triggering scheduled yield update...');
      await this.runUpdate();
    }
  },

  async runUpdate() {
    const store = useCarteiraStore.getState();
    const portfolio = store.portfolio;

    if (!portfolio || portfolio.length === 0) {
      console.log('[YieldScheduler] Portfolio empty, skipping update.');
      return;
    }

    toast({
      title: "Atualização Automática",
      description: "Atualizando yields e preços dos FIIs...",
    });

    try {
      const updates = await YieldService.updatePortfolioYields(portfolio);
      
      if (updates.length > 0) {
        store.updateYields(updates);
        YieldService.setLastUpdate();
        
        toast({
          title: "Atualização Concluída",
          description: `${updates.length} FIIs atualizados com sucesso.`,
          variant: "default" // success
        });
      }
    } catch (error) {
      console.error('[YieldScheduler] Update failed:', error);
      toast({
        title: "Erro na Atualização",
        description: "Não foi possível atualizar os yields automaticamente.",
        variant: "destructive"
      });
    }
  }
};
