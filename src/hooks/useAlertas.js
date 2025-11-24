import useAlertasStore from '@/store/alertasStore';

export const useAlertas = () => {
  const { alerts, addAlert, updateAlert, removeAlert, triggerAlert } = useAlertasStore();
  
  return {
    alerts,
    addAlert,
    updateAlert,
    removeAlert,
    triggerAlert
  };
};