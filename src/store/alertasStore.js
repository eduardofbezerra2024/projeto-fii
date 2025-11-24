
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AlertStatus } from '@/types';

const useAlertasStore = create(
  persist(
    (set) => ({
      alerts: [
        {
          id: '1',
          ticker: 'RZTR11',
          type: 'price_below',
          value: 115.00,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      notifications: [], // New state for in-app notifications

      addAlert: (alert) => {
        set((state) => ({
          alerts: [...state.alerts, { 
            ...alert, 
            id: Date.now().toString(),
            status: AlertStatus.ACTIVE,
            createdAt: new Date().toISOString()
          }]
        }));
      },
      
      updateAlert: (id, updatedAlert) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id ? { ...alert, ...updatedAlert } : alert
          )
        }));
      },
      
      removeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((alert) => alert.id !== id)
        }));
      },
      
      triggerAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id ? { ...alert, status: AlertStatus.TRIGGERED } : alert
          )
        }));
      },

      // New actions for notifications
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      }
    }),
    {
      name: 'alertas-storage'
    }
  )
);

export default useAlertasStore;
