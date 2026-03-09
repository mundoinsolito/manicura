import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, Shield, Settings, KeyRound, Wallet, MessageSquare } from 'lucide-react';

const navItems = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/superadmin/tenants', label: 'Tenants', icon: Users },
  { to: '/superadmin/licencias', label: 'Licencias', icon: KeyRound },
  { to: '/superadmin/pagos', label: 'Métodos de Pago', icon: Wallet },
  { to: '/superadmin/mensajes', label: 'Mensajes', icon: MessageSquare, badgeKey: 'unreadMessages' as const },
  { to: '/superadmin/plans', label: 'Planes', icon: CreditCard },
  { to: '/superadmin/settings', label: 'Plataforma', icon: Settings },
];

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    (supabase as any).from('support_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_type', 'tenant')
      .eq('is_read', false)
      .then(({ count }: any) => setUnreadMessages(count || 0));
  }, [location.pathname]);

  const badges: Record<string, number> = { unreadMessages };

  const sidebar = (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">Super Admin</h1>
            <p className="text-xs text-muted-foreground">Panel de gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.to;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
              <Button variant={active ? 'default' : 'ghost'} className="w-full justify-start">
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
                {badgeCount > 0 && (
                  <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs h-5 min-w-5 flex items-center justify-center">
                    {badgeCount}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={logout}>
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border flex flex-col">{sidebar}</aside>
      )}

      <main className="flex-1 overflow-auto">
        {isMobile && (
          <div className="sticky top-0 z-40 bg-card border-b border-border p-3 flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">{sidebar}</SheetContent>
            </Sheet>
            <Shield className="w-5 h-5 text-destructive" />
            <h1 className="font-display text-lg font-semibold">Super Admin</h1>
            {unreadMessages > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs">{unreadMessages}</Badge>
            )}
          </div>
        )}
        <div className={isMobile ? 'p-4' : 'p-8'}>{children}</div>
      </main>
    </div>
  );
}
