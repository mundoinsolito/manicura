import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import {
  Sparkles, Calendar, Users, BarChart3, Shield, Smartphone,
  Palette, Check, ArrowRight, Star, CreditCard, Smartphone as PhoneIcon,
  DollarSign, ArrowRightLeft, Coins, HelpCircle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const iconFeatures = [
  { icon: Calendar, title: 'Agenda Online', desc: 'Reservas 24/7 desde el celular' },
  { icon: Users, title: 'Clientes', desc: 'Historial y preferencias' },
  { icon: BarChart3, title: 'Finanzas', desc: 'Ingresos y gastos claros' },
  { icon: Palette, title: 'Tu Marca', desc: 'Colores, logo y portada' },
  { icon: Smartphone, title: 'Página Web', desc: 'URL profesional propia' },
  { icon: Shield, title: 'Seguridad', desc: 'Datos 100% protegidos' },
];

const steps = [
  { num: '1', title: 'Regístrate', desc: 'En menos de 1 minuto' },
  { num: '2', title: 'Personaliza', desc: 'Logo, servicios y horarios' },
  { num: '3', title: 'Recibe citas', desc: 'Comparte y listo' },
];

const payTypeIcon: Record<string, React.ElementType> = {
  pago_movil: PhoneIcon, zelle: DollarSign, binance: Coins,
  transferencia: ArrowRightLeft, efectivo: DollarSign,
};
const payTypeLabel: Record<string, string> = {
  pago_movil: 'Pago Móvil', zelle: 'Zelle', binance: 'Binance Pay',
  transferencia: 'Transferencia', efectivo: 'Efectivo USD',
};

export default function SaasLanding() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { settings: platform } = usePlatformSettings();
  const { data: paymentMethods = [] } = usePaymentMethods(true);

  useEffect(() => {
    (supabase as any).from('subscription_plans')
      .select('*').eq('is_active', true).order('price', { ascending: true })
      .then(({ data }: any) => {
        if (data) setPlans(data.map((p: any) => ({
          ...p, features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
        })));
      });
  }, []);

  const brandName = platform?.brand_name || 'NailsPro';
  const heroTitle = platform?.hero_title || 'Tu negocio de uñas, digitalizado';
  const heroSubtitle = platform?.hero_subtitle || 'La plataforma todo-en-uno para manicuristas profesionales.';
  const ctaText = platform?.cta_text || 'Crear mi cuenta gratis';
  const footerText = platform?.footer_text || `© ${new Date().getFullYear()} NailsPro. Todos los derechos reservados.`;
  const faqItems = platform?.faq_items || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {platform?.brand_logo_url ? (
              <img src={platform.brand_logo_url} className="w-8 h-8 rounded-full object-cover" alt={brandName} />
            ) : (
              <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-display text-lg font-bold">{brandName}</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Iniciar Sesión</Button></Link>
            <Link to="/registro"><Button size="sm" className="accent-gradient border-0">{ctaText}</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-16">
        {platform?.hero_image_url ? (
          <div className="absolute inset-0">
            <img src={platform.hero_image_url} className="w-full h-full object-cover" alt="Hero" />
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 hero-gradient" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>
          </>
        )}
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
              <Star className="w-3 h-3 mr-1" /> 14 días gratis · Sin tarjeta
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 animate-fade-up leading-tight">
              {heroTitle.includes(',') ? (
                <>{heroTitle.split(',')[0]},{' '}<span className="text-gradient">{heroTitle.split(',').slice(1).join(',').trim()}</span></>
              ) : (<span className="text-gradient">{heroTitle}</span>)}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 animate-fade-up max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>{heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/registro"><Button size="lg" className="accent-gradient border-0 shadow-elevated px-8">{ctaText}<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Todo lo que necesitas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {iconFeatures.map((f, i) => (
              <Card key={i} className="card-gradient shadow-card hover:shadow-elevated transition-shadow text-center">
                <CardContent className="pt-4 pb-3 px-3">
                  <div className="w-10 h-10 mx-auto rounded-lg accent-gradient flex items-center justify-center mb-2 shadow-soft">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-sm font-semibold mb-0.5">{f.title}</h3>
                  <p className="text-muted-foreground text-xs">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-6">Empieza en 3 pasos</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-2xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 md:flex-col md:text-center">
                <div className="w-12 h-12 shrink-0 rounded-full accent-gradient flex items-center justify-center shadow-soft">
                  <span className="text-lg font-bold text-primary-foreground">{s.num}</span>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground text-xs">{s.desc}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="hidden md:block w-5 h-5 text-muted-foreground mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-2">Planes simples</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">Empieza gratis, crece a tu ritmo</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={plan.id} className={`relative ${i === 1 ? 'border-primary shadow-elevated md:scale-105' : 'shadow-card'}`}>
                {i === 1 && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><Badge className="accent-gradient border-0 text-xs">Popular</Badge></div>}
                <CardHeader className="text-center pb-2 pt-5">
                  <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                  <div className="mt-2"><span className="text-3xl font-bold">${plan.price}</span><span className="text-muted-foreground text-sm">/mes</span></div>
                </CardHeader>
                <CardContent className="pt-0 pb-5">
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs"><Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <Link to="/registro"><Button className={`w-full ${i === 1 ? 'accent-gradient border-0' : ''}`} variant={i === 1 ? 'default' : 'outline'} size="sm">Comenzar Gratis</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-2">
              <CreditCard className="inline w-6 h-6 mr-2" />Métodos de Pago
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8">Aceptamos múltiples formas de pago</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {paymentMethods.map(m => {
                const Icon = payTypeIcon[m.type] || CreditCard;
                return (
                  <Card key={m.id} className="shadow-card">
                    <CardContent className="py-4 px-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{payTypeLabel[m.type] || m.type}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(m.details || {}).map(([k, v]) => (
                          <p key={k} className="text-xs"><span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span> <span className="font-medium">{v}</span></p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-2">
              <HelpCircle className="inline w-6 h-6 mr-2" />Preguntas Frecuentes
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8">Resolvemos tus dudas</p>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {platform?.brand_logo_url ? (
              <img src={platform.brand_logo_url} className="w-6 h-6 rounded-full object-cover" alt={brandName} />
            ) : (
              <div className="w-6 h-6 rounded-full accent-gradient flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <span className="font-display text-sm font-bold">{brandName}</span>
          </div>
          <p className="text-muted-foreground text-xs">{footerText}</p>
        </div>
      </footer>
    </div>
  );
}
