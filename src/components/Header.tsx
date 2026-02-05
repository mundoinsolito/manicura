import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { Calendar, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { settings } = useSettings();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
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
            <h1 className="font-display text-xl font-semibold text-foreground">
              {settings.business_name}
            </h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link to="/reservar">
              <Button variant="default" size="sm" className="accent-gradient border-0 shadow-soft">
                <Calendar className="w-4 h-4 mr-2" />
                Reservar
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
