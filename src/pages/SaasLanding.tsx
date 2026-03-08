import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, Calendar, Users, BarChart3, Shield, Smartphone,
  Palette, Check, ArrowRight, Star
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

const features = [
  { icon: Calendar, title: 'Agenda Online', desc: 'Tus clientas reservan citas 24/7 desde su celular' },
  { icon: Users, title: 'Gestión de Clientes', desc: 'Historial, preferencias y datos de cada clienta' },
  { icon: BarChart3, title: 'Finanzas Claras', desc: 'Ingresos, gastos y ganancia neta en un solo lugar' },
  { icon: Palette, title: 'Tu Marca', desc: 'Personaliza colores, logo y portada de tu página' },
  { icon: Smartphone, title: 'Tu Página Web', desc: 'Cada negocio tiene su propia URL profesional' },
  { icon: Shield, title: 'Datos Seguros', desc: 'Tus datos están protegidos con seguridad empresarial' },
];

const steps = [
  { num: '1', title: 'Regístrate', desc: 'Crea tu cuenta en menos de 1 minuto' },
  { num: '2', title: 'Personaliza', desc: 'Sube tu logo, agrega servicios y horarios' },
  { num: '3', title: 'Recibe citas', desc: 'Comparte tu página y empieza a recibir reservas' },
];

export default function SaasLanding() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    (supabase as any).from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .then(({ data }: any) => {
        if (data) {
          setPlans(data.map((p: any) => ({
            ...p,
            features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
          })));
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">NailsPro</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link to="/registro">
              <Button size="sm" className="accent-gradient border-0">Comenzar Gratis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Star className="w-4 h-4 mr-1" /> 14 días gratis · Sin tarjeta de crédito
            </Badge>

            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-up">
              Tu negocio de uñas,{' '}
              <span className="text-gradient">digitalizado</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              La plataforma todo-en-uno para manicuristas profesionales.
              Agenda, clientes, finanzas y tu propia página web en minutos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/registro">
                <Button size="lg" className="accent-gradient border-0 shadow-elevated px-8 text-lg">
                  Crear mi cuenta gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Herramientas profesionales diseñadas especialmente para negocios de manicura
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="card-gradient shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center mb-4 shadow-soft">
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Empieza en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full accent-gradient flex items-center justify-center shadow-soft">
                  <span className="text-2xl font-bold text-primary-foreground">{s.num}</span>
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-muted-foreground">
              Empieza gratis, crece a tu ritmo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <Card
                key={plan.id}
                className={`relative ${i === 1 ? 'border-primary shadow-elevated scale-105' : 'shadow-card'}`}
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="accent-gradient border-0">Más Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/registro">
                    <Button
                      className={`w-full ${i === 1 ? 'accent-gradient border-0' : ''}`}
                      variant={i === 1 ? 'default' : 'outline'}
                    >
                      Comenzar Gratis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            ¿Lista para digitalizar tu negocio?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Únete a cientos de manicuristas que ya gestionan sus citas de forma profesional
          </p>
          <Link to="/registro">
            <Button size="lg" className="accent-gradient border-0 shadow-elevated px-10 text-lg">
              Crear mi cuenta gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">NailsPro</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NailsPro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
