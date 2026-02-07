import { ReactNode, useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  DollarSign, 
  Settings, 
  Tag,
  LogOut,
  Home,
  Menu
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/agenda', label: 'Agenda', icon: Calendar },
  { to: '/admin/servicios', label: 'Servicios', icon: Scissors },
  { to: '/admin/promociones', label: 'Promociones', icon: Tag },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/finanzas', label: 'Finanzas', icon: DollarSign },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          {settings.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.business_name}
              className="w-10 h-10 rounded-full object-cover shadow-soft"
            />
          ) : (
            <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shadow-soft">
              <span className="text-primary-foreground font-display text-lg">✨</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              {settings.business_name}
            </h1>
            <p className="text-xs text-muted-foreground">Panel de Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start ${isActive ? 'accent-gradient border-0' : ''}`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link to="/" onClick={() => setSidebarOpen(false)}>
          <Button variant="outline" className="w-full justify-start">
            <Home className="w-4 h-4 mr-3" />
            Ver sitio
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border flex flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        {isMobile && (
          <div className="sticky top-0 z-40 bg-card border-b border-border p-3 flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 flex flex-col">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.business_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : null}
            <h1 className="font-display text-lg font-semibold flex-1 truncate">{settings.business_name}</h1>
          </div>
        )}
        <div className={isMobile ? "p-4" : "p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
