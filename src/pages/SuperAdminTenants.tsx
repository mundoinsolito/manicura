import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Clock, Ban, ExternalLink, Search, Save, Copy, MessageSquare } from 'lucide-react';

interface TenantRow {
  id: string;
  slug: string;
  business_name: string;
  status: string;
  trial_ends_at: string;
  created_at: string;
  owner_id: string;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  trial: { label: 'Trial', variant: 'secondary', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'Activo', variant: 'default', color: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspendido', variant: 'destructive', color: 'bg-red-100 text-red-700' },
  banned: { label: 'Baneado', variant: 'destructive', color: 'bg-red-200 text-red-800' },
};

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [notes, setNotes] = useState('');
  const [tenantStats, setTenantStats] = useState<{ clients: number; services: number; appointments: number }>({ clients: 0, services: 0, appointments: 0 });

  const fetchTenants = async () => {
    const { data } = await (supabase as any).from('tenants').select('*').order('created_at', { ascending: false });
    setTenants((data || []) as TenantRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenantStats = async (tenantId: string) => {
    const [{ count: clients }, { count: services }, { count: appointments }] = await Promise.all([
      (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      (supabase as any).from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      (supabase as any).from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]);
    setTenantStats({ clients: clients || 0, services: services || 0, appointments: appointments || 0 });
  };

  const openDrawer = (t: TenantRow) => {
    setSelected(t);
    setNotes(t.notes || '');
    fetchTenantStats(t.id);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from('tenants').update({ status }).eq('id', id);
    if (error) { toast.error('Error al actualizar'); return; }
    toast.success('Estado actualizado');
    fetchTenants();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const saveNotes = async () => {
    if (!selected) return;
    await (supabase as any).from('tenants').update({ notes }).eq('id', selected.id);
    toast.success('Notas guardadas');
    fetchTenants();
  };

  const filtered = tenants.filter(t =>
    t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = (status: string | null) => status ? filtered.filter(t => t.status === status) : filtered;

  const renderList = (list: TenantRow[]) => list.length === 0 ? (
    <p className="text-muted-foreground text-sm py-6 text-center">Sin resultados</p>
  ) : (
    <div className="space-y-2">
      {list.map(t => {
        const cfg = statusConfig[t.status] || statusConfig.trial;
        return (
          <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDrawer(t)}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{t.business_name}</span>
                  <Badge variant={cfg.variant} className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{t.slug} · {format(parseISO(t.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <a href={`/${t.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground text-sm">Gestiona las cuentas de manicuristas</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o slug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? <p className="text-muted-foreground">Cargando...</p> : (
          <Tabs defaultValue="all">
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">Todos ({filtered.length})</TabsTrigger>
              <TabsTrigger value="trial">Trial ({byStatus('trial').length})</TabsTrigger>
              <TabsTrigger value="active">Activos ({byStatus('active').length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspendidos ({byStatus('suspended').length})</TabsTrigger>
              <TabsTrigger value="banned">Baneados ({byStatus('banned').length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(filtered)}</TabsContent>
            <TabsContent value="trial">{renderList(byStatus('trial'))}</TabsContent>
            <TabsContent value="active">{renderList(byStatus('active'))}</TabsContent>
            <TabsContent value="suspended">{renderList(byStatus('suspended'))}</TabsContent>
            <TabsContent value="banned">{renderList(byStatus('banned'))}</TabsContent>
          </Tabs>
        )}
      </div>

      {/* Drawer de detalle */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.business_name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig[selected.status]?.variant || 'secondary'}
                    className={statusConfig[selected.status]?.color}>
                    {statusConfig[selected.status]?.label || selected.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">/{selected.slug}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(selected.slug); toast.success('Copiado'); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Registrado:</span> {format(parseISO(selected.created_at), 'dd/MM/yyyy')}</p>
                  {selected.status === 'trial' && <p><span className="text-muted-foreground">Trial hasta:</span> {format(parseISO(selected.trial_ends_at), 'dd/MM/yyyy')}</p>}
                  <p><span className="text-muted-foreground">Owner ID:</span> <span className="font-mono text-xs">{selected.owner_id.slice(0, 8)}...</span></p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Clientes', value: tenantStats.clients },
                    { label: 'Servicios', value: tenantStats.services },
                    { label: 'Citas', value: tenantStats.appointments },
                  ].map(s => (
                    <div key={s.label} className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <Label>Notas internas</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas sobre este tenant..." />
                  <Button size="sm" className="mt-2" onClick={saveNotes} disabled={notes === (selected.notes || '')}>
                    <Save className="w-3 h-3 mr-1" /> Guardar notas
                  </Button>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-semibold">Acciones</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.status !== 'active' && (
                      <Button size="sm" onClick={() => updateStatus(selected.id, 'active')}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Activar
                      </Button>
                    )}
                    {selected.status !== 'suspended' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, 'suspended')}>
                        <Clock className="w-3 h-3 mr-1" /> Suspender
                      </Button>
                    )}
                    {selected.status !== 'banned' && (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(selected.id, 'banned')}>
                        <Ban className="w-3 h-3 mr-1" /> Banear
                      </Button>
                    )}
                    <a href={`/${selected.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" /> Ver página</Button>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SuperAdminLayout>
  );
}
