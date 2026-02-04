import { ReactNode } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  DollarSign, 
  Settings, 
  Tag,
  LogOut,
  Home
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

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shadow-soft">
              <span className="text-primary-foreground font-display text-lg">✨</span>
            </div>
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
              <Link key={item.to} to={item.to}>
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
          <Link to="/">
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
