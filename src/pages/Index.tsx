import { PublicLayout } from '@/components/PublicLayout';
import { useServices } from '@/hooks/useServices';
import { useSettings } from '@/hooks/useSettings';
import { usePromotions } from '@/hooks/usePromotions';
import { ServiceCard } from '@/components/ServiceCard';
import { PromotionCard } from '@/components/PromotionCard';
import { BookingStatusChecker } from '@/components/BookingStatusChecker';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Heart, Star } from 'lucide-react';

const featureIcons = [Star, Heart, Calendar];

const Index = () => {
  const { services, loading: servicesLoading } = useServices();
  const { settings, loading: settingsLoading } = useSettings();
  const { activePromotions } = usePromotions();

  const activeServices = services.filter(s => s.is_active);
  const featureTags = settings.feature_tags || [];
  const enabledFeatureTags = featureTags.filter(tag => tag.enabled);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background */}
        {settingsLoading ? (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        ) : settings.cover_image_url ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${settings.cover_image_url})` }}
          >
            <div className="absolute inset-0 bg-black/35" />
          </div>
        ) : (
          <div className="absolute inset-0 hero-gradient" />
        )}
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 mb-8 animate-fade-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/80">Belleza profesional para tus uñas</span>
            </div>
            
            {settingsLoading ? (
              <div className="w-64 h-16 mx-auto rounded bg-white/20 animate-pulse mb-6" />
            ) : settings.business_name ? (
              <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-up drop-shadow-lg" style={{ animationDelay: '0.1s' }}>
                {settings.business_name}
              </h1>
            ) : null}
            
            <p className="text-lg md:text-xl text-white/90 mb-10 animate-fade-up drop-shadow-md" style={{ animationDelay: '0.2s' }}>
              Déjate consentir con nuestros servicios de manicura profesional. 
              Calidad, estilo y cuidado en cada detalle.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/reservar">
                <Button size="lg" className="accent-gradient border-0 shadow-elevated px-8 text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Cita
                </Button>
              </Link>
              <BookingStatusChecker />
            </div>

            <div className="mt-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/servicios">
                <Button variant="outline" className="bg-black/20 border-white/30 text-white hover:bg-black/30 hover:text-white backdrop-blur-sm">
                  Ver todos los servicios →
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {enabledFeatureTags.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {enabledFeatureTags.map((tag, index) => {
                const IconComponent = featureIcons[index % featureIcons.length];
                return (
                  <div 
                    key={tag.id} 
                    className="text-center p-6 rounded-2xl card-gradient shadow-card animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full accent-gradient flex items-center justify-center shadow-soft">
                      <IconComponent className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2">{tag.title}</h3>
                    <p className="text-muted-foreground text-sm">{tag.description}</p>
                  </div>
                );
              })}
          </div>
          )}
        </div>
      </section>

      {/* Promotions */}
      {activePromotions.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Promociones Especiales
              </h2>
              <p className="text-muted-foreground">
                No te pierdas nuestras ofertas exclusivas
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activePromotions.slice(0, 4).map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Preview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Descubre nuestra variedad de servicios de manicura profesional
            </p>
          </div>
          
          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeServices.slice(0, 6).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
              
              {activeServices.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Próximamente agregaremos nuestros servicios
                  </p>
                </div>
              )}
              
              {activeServices.length > 6 && (
                <div className="text-center mt-10">
                  <Link to="/servicios">
                    <Button variant="outline" size="lg">
                      Ver todos los servicios
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            ¿Lista para lucir unas uñas increíbles?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Reserva tu cita hoy y déjate consentir por profesionales
          </p>
          <Link to="/reservar">
            <Button size="lg" className="accent-gradient border-0 shadow-elevated px-10 text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              Reservar Ahora
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
