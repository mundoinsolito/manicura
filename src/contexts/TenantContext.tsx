import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export interface Tenant {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  status: string;
  trial_ends_at: string;
  logo_url: string | null;
  cover_image_url: string | null;
  created_at: string;
}

interface TenantContextType {
  tenantId: string | null;
  tenant: Tenant | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenant: null,
  loading: false,
});

export function TenantProvider({
  children,
  source,
}: {
  children: ReactNode;
  source: 'slug' | 'auth';
}) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setLoading(true);
      setNotFound(false);

      try {
        let query = (supabase as any).from('tenants').select('*');

        if (source === 'slug' && slug) {
          query = query.eq('slug', slug);
        } else if (source === 'auth' && user) {
          query = query.eq('owner_id', user.id);
        } else {
          setLoading(false);
          return;
        }

        const { data, error } = await query.single();

        if (!cancelled) {
          if (error || !data) {
            setNotFound(true);
            setTenant(null);
          } else {
            setTenant(data as Tenant);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [slug, user?.id, source]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound && source === 'slug') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold mb-4">No encontrado</h1>
          <p className="text-muted-foreground mb-6">Este negocio no existe o fue suspendido.</p>
          <a href="/" className="text-primary hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenantId: tenant?.id || null, tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
