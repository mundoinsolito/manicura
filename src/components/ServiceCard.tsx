import { Service } from '@/lib/supabase';
import { Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: Service;
  showBookButton?: boolean;
}

export function ServiceCard({ service, showBookButton = true }: ServiceCardProps) {
  return (
    <Card className="group overflow-hidden border-0 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in">
      <div className="aspect-[4/3] overflow-hidden relative">
        {service.image_url ? (
          <img 
            src={service.image_url} 
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full hero-gradient flex items-center justify-center">
            <span className="text-6xl">💅</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          {service.name}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {service.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{service.duration} min</span>
          </div>
          <div className="flex items-center gap-1 text-lg font-semibold text-primary">
            <DollarSign className="w-4 h-4" />
            <span>{service.price}</span>
          </div>
        </div>
        
        {showBookButton && (
          <Link to={`/reservar?service=${service.id}`}>
            <Button className="w-full accent-gradient border-0 shadow-soft">
              Reservar
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
