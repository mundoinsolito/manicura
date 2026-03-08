import { ReactNode, useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { useSettings } from '@/hooks/useSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard, Calendar, Scissors, Users, DollarSign,
  Settings, Tag, Bell, LogOut, Home, Menu
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
  { to: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
  { to: '/dashboard/promociones', label: 'Promociones', icon: Tag },
  { to: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { to: '/dashboard/finanzas', label: 'Finanzas', icon: DollarSign },
  { to: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isSuperAdmin, logout } = useAuth();
  const { tenant } = useTenant();
  const { settings } = useSettings();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  const siteUrl = tenant ? `/${tenant.slug}` : '/';

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <Link to={siteUrl} className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.business_name} className="w-10 h-10 rounded-full object-cover shadow-soft" />
          ) : (
            <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shadow-soft">
              <span className="text-primary-foreground font-display text-lg">✨</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">{settings.business_name || 'Mi Negocio'}</h1>
            <p className="text-xs text-muted-foreground">Panel de Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              <Button variant={isActive ? 'default' : 'ghost'} className={`w-full justify-start ${isActive ? 'accent-gradient border-0' : ''}`}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link to={siteUrl} onClick={() => setSidebarOpen(false)}>
          <Button variant="outline" className="w-full justify-start">
            <Home className="w-4 h-4 mr-3" />
            Ver mi página
          </Button>
        </Link>
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
        <aside className="w-64 bg-card border-r border-border flex flex-col">{sidebarContent}</aside>
      )}
      <main className="flex-1 overflow-auto">
        {isMobile && (
          <div className="sticky top-0 z-40 bg-card border-b border-border p-3 flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">{sidebarContent}</SheetContent>
            </Sheet>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.business_name} className="w-8 h-8 rounded-full object-cover" />
            ) : null}
            <h1 className="font-display text-lg font-semibold flex-1 truncate">{settings.business_name}</h1>
          </div>
        )}
        <div className={isMobile ? 'p-4' : 'p-8'}>{children}</div>
      </main>
    </div>
  );
}
