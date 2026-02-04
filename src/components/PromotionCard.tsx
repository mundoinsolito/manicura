import { Promotion } from '@/lib/supabase';
import { Calendar, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PromotionCardProps {
  promotion: Promotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-card gold-gradient animate-fade-in">
      <div className="flex flex-col md:flex-row">
        {promotion.image_url && (
          <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden">
            <img 
              src={promotion.image_url} 
              alt={promotion.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardContent className={`p-6 flex-1 ${!promotion.image_url ? 'w-full' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="bg-background/80">
              <Calendar className="w-3 h-3 mr-1" />
              Hasta {format(new Date(promotion.valid_until), 'dd MMM', { locale: es })}
            </Badge>
            
            {promotion.discount_percent && (
              <Badge className="accent-gradient border-0">
                <Percent className="w-3 h-3 mr-1" />
                {promotion.discount_percent}% OFF
              </Badge>
            )}
            
            {promotion.discount_amount && !promotion.discount_percent && (
              <Badge className="accent-gradient border-0">
                <DollarSign className="w-3 h-3 mr-1" />
                -{promotion.discount_amount}
              </Badge>
            )}
          </div>
          
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            {promotion.title}
          </h3>
          
          <p className="text-muted-foreground text-sm">
            {promotion.description}
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
