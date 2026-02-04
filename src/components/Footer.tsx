import { useSettings } from '@/hooks/useSettings';
import { Instagram, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">
              {settings.business_name}
            </h3>
            <p className="text-muted-foreground text-sm">
              Belleza y cuidado profesional para tus uñas. Reserva tu cita y déjate consentir.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Horarios</h4>
            <p className="text-muted-foreground text-sm">
              Lunes a Sábado<br />
              {settings.opening_time} - {settings.closing_time}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contacto</h4>
            <div className="space-y-2">
              <a 
                href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                {settings.whatsapp_number}
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {settings.business_name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
