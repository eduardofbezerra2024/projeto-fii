
import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useAlertasStore from '@/store/alertasStore';
import { formatCurrency } from '@/utils/formatters';

const AlertNotification = () => {
  const { toast } = useToast();
  const notifications = useAlertasStore((state) => state.notifications);
  
  // Effect to show toast when the LATEST notification changes
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Simple check to avoid spamming on reload if we persist notifications
      // Ideally we'd track 'shown' state, but checking timestamp age < 1 min is a decent heuristic
      const isRecent = new Date() - new Date(latest.timestamp) < 60000; 
      
      if (isRecent) {
        toast({
          title: "Alerta de Preço!",
          description: latest.message,
          duration: 5000,
        });
      }
    }
  }, [notifications, toast]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {/* This visual component acts as a permanent 'latest alerts' stack if desired, 
          but for now, we rely on the Toaster for the popups. 
          This component primarily serves as the logic controller for the toasts. */}
    </div>
  );
};

export default AlertNotification;
