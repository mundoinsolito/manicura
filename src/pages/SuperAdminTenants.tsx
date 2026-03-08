import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Ban, ExternalLink } from 'lucide-react';

interface TenantRow {
  id: string;
  slug: string;
  business_name: string;
  status: string;
  trial_ends_at: string;
  created_at: string;
  owner_id: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    trial: { label: 'Trial', variant: 'secondary' },
    active: { label: 'Activo', variant: 'default' },
    suspended: { label: 'Suspendido', variant: 'destructive' },
    banned: { label: 'Baneado', variant: 'destructive' },
  };
  const info = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
};

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    const { data } = await (supabase.from('tenants') as any)
      .select('*')
      .order('created_at', { ascending: false });
    setTenants((data || []) as TenantRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from('tenants') as any)
      .update({ status })
      .eq('id', id);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      toast.success('Estado actualizado');
      fetchTenants();
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Gestiona las cuentas de manicuristas</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : tenants.length === 0 ? (
            <p className="text-muted-foreground">No hay tenants registrados</p>
          ) : (
            tenants.map(t => (
              <Card key={t.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{t.business_name}</h3>
                        {statusBadge(t.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Slug: <span className="font-mono text-foreground">/{t.slug}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrado: {format(new Date(t.created_at), 'dd/MM/yyyy')}
                        {t.status === 'trial' && ` · Trial hasta: ${format(new Date(t.trial_ends_at), 'dd/MM/yyyy')}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a href={`/${t.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3 mr-1" /> Ver página
                        </Button>
                      </a>
                      {t.status !== 'active' && (
                        <Button size="sm" onClick={() => updateStatus(t.id, 'active')}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Activar
                        </Button>
                      )}
                      {t.status !== 'suspended' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, 'suspended')}>
                          <Clock className="w-3 h-3 mr-1" /> Suspender
                        </Button>
                      )}
                      {t.status !== 'banned' && (
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(t.id, 'banned')}>
                          <Ban className="w-3 h-3 mr-1" /> Banear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
