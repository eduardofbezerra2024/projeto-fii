
import { AlertService } from './AlertService';

const STORAGE_KEY = 'fii_last_check_date';

export const AlertScheduler = {
  intervalId: null,

  init() {
    if (this.intervalId) return;

    // Check immediately on load
    this.checkAndRun();

    // Then check every 15 minutes if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 15 * 60 * 1000); 
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  checkAndRun() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Logic: Run if it's after 9 AM and hasn't run today yet
    if (currentHour >= 9) {
      const lastRunDate = localStorage.getItem(STORAGE_KEY);
      const todayStr = now.toISOString().split('T')[0];

      if (lastRunDate !== todayStr) {
        console.log('Scheduler: Triggering daily alert check...');
        
        AlertService.checkDailyPrices()
          .then(() => {
            localStorage.setItem(STORAGE_KEY, todayStr);
            console.log('Scheduler: Daily check completed.');
          })
          .catch(err => {
            console.error('Scheduler: Daily check failed', err);
          });
      } else {
        // Already run today
      }
    }
  }
};
