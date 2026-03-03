import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, Bell, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp, notificationPermission, requestNotificationPermission } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  useEffect(() => {
    // Show notification banner after a short delay if permission not granted
    if (notificationPermission === 'default' && !sessionStorage.getItem('notif-prompt-dismissed')) {
      const timer = setTimeout(() => setShowNotifBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificationPermission]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleDismissNotif = () => {
    setShowNotifBanner(false);
    sessionStorage.setItem('notif-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    const accepted = await installApp();
    if (accepted) handleDismiss();
  };

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    setShowNotifBanner(false);
  };

  return (
    <>
      {/* Install Banner */}
      {isInstallable && !isInstalled && !dismissed && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Instalar App</p>
              <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla</p>
            </div>
            <Button size="sm" onClick={handleInstall} className="shrink-0">
              Instalar
            </Button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Permission Banner */}
      {showNotifBanner && notificationPermission === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96" style={{ bottom: isInstallable && !isInstalled && !dismissed ? '5rem' : '1rem' }}>
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Notificaciones</p>
              <p className="text-xs text-muted-foreground">Recibe ofertas y recordatorios</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleEnableNotifications} className="shrink-0">
              Activar
            </Button>
            <button onClick={handleDismissNotif} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
