import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mail, Lock, User, Store, Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    slug: '',
  });
  const [slugError, setSlugError] = useState('');

  const reserved = ['registro', 'login', 'dashboard', 'superadmin', 'admin', 'api', 'app', 'www'];

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
    setForm({ ...form, slug: cleaned });

    if (cleaned.length < 3) {
      setSlugError('Mínimo 3 caracteres');
    } else if (reserved.includes(cleaned)) {
      setSlugError('Este nombre está reservado');
    } else {
      setSlugError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugError || form.slug.length < 3) {
      toast.error('Corrige el enlace de tu página');
      return;
    }

    setLoading(true);
    try {
      // Check slug availability
      const { data: existing } = await (supabase.from('tenants') as any)
        .select('id')
        .eq('slug', form.slug)
        .single();

      if (existing) {
        toast.error('Este enlace ya está en uso, elige otro');
        setLoading(false);
        return;
      }

      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            business_name: form.businessName,
            slug: form.slug,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        // Auto-confirmed, create tenant immediately
        const { error: rpcError } = await (supabase.rpc as any)('register_tenant', {
          _slug: form.slug,
          _business_name: form.businessName,
        });

        if (rpcError) throw rpcError;

        toast.success('¡Cuenta creada! Bienvenida a NailsPro');
        navigate('/dashboard');
      } else {
        toast.success('Revisa tu correo para confirmar tu cuenta');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este correo ya está registrado');
      } else if (error.message?.includes('Slug already taken')) {
        toast.error('Este enlace ya está en uso');
      } else {
        toast.error(error.message || 'Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md shadow-elevated relative z-10">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full accent-gradient flex items-center justify-center shadow-soft">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Crea tu cuenta</CardTitle>
          <CardDescription>14 días gratis · Sin tarjeta de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="María García"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business">Nombre de tu negocio</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="business"
                  placeholder="Uñas María"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Enlace de tu página</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="slug"
                  placeholder="unas-maria"
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {form.slug && !slugError && (
                <p className="text-xs text-muted-foreground">
                  Tu página: <span className="text-primary font-medium">{window.location.host}/{form.slug}</span>
                </p>
              )}
              {slugError && <p className="text-xs text-destructive">{slugError}</p>}
            </div>

            <Button type="submit" className="w-full accent-gradient border-0" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando cuenta...</>
              ) : (
                'Crear mi cuenta gratis'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
