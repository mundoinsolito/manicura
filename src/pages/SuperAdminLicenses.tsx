import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, CreditCard, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  payment_notes: string | null;
  tenant?: { business_name: string; slug: string; status: string };
  plan?: { name: string; price: number } | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function SuperAdminLicenses() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editExpiry, setEditExpiry] = useState<Date | undefined>();
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const fetchAll = async () => {
    const [{ data: subsData }, { data: plansData }] = await Promise.all([
      (supabase as any).from('tenant_subscriptions').select('*, tenant:tenants(business_name, slug, status), plan:subscription_plans(name, price)').order('created_at', { ascending: false }),
      (supabase as any).from('subscription_plans').select('id, name, price').eq('is_active', true),
    ]);
    setSubs((subsData || []) as Subscription[]);
    setPlans((plansData || []) as Plan[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openEdit = (s: Subscription) => {
    setEditSub(s);
    setEditPlan(s.plan_id || '');
    setEditExpiry(s.expires_at ? parseISO(s.expires_at) : undefined);
    setEditNotes(s.payment_notes || '');
    setEditStatus(s.status);
  };

  const saveEdit = async () => {
    if (!editSub) return;
    const { error } = await (supabase as any).from('tenant_subscriptions').update({
      plan_id: editPlan || null,
      expires_at: editExpiry?.toISOString() || null,
      payment_notes: editNotes || null,
      status: editStatus,
    }).eq('id', editSub.id);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Licencia actualizada');
    setEditSub(null);
    fetchAll();
  };

  const markPaid = async (s: Subscription) => {
    const note = `Pagado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    const newNotes = s.payment_notes ? `${s.payment_notes}\n${note}` : note;
    const newExpiry = addDays(new Date(), 30).toISOString();
    await (supabase as any).from('tenant_subscriptions').update({
      status: 'active',
      payment_notes: newNotes,
      expires_at: newExpiry,
    }).eq('id', s.id);
    // Also activate the tenant
    await (supabase as any).from('tenants').update({ status: 'active' }).eq('id', s.tenant_id);
    toast.success('Marcado como pagado');
    fetchAll();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      trial: { color: 'bg-amber-100 text-amber-700', label: 'Trial' },
      active: { color: 'bg-green-100 text-green-700', label: 'Activo' },
      expired: { color: 'bg-red-100 text-red-700', label: 'Vencido' },
      cancelled: { color: 'bg-muted text-muted-foreground', label: 'Cancelado' },
    };
    const info = map[status] || { color: '', label: status };
    return <Badge variant="secondary" className={`text-xs ${info.color}`}>{info.label}</Badge>;
  };

  const now = new Date();
  const expiringTrial = subs.filter(s => s.status === 'trial' && s.expires_at && isBefore(parseISO(s.expires_at), addDays(now, 7)));
  const activeSubs = subs.filter(s => s.status === 'active');
  const expiredSubs = subs.filter(s => s.status === 'expired' || (s.expires_at && isBefore(parseISO(s.expires_at), now) && s.status !== 'active'));

  const renderList = (list: Subscription[]) => list.length === 0 ? (
    <p className="text-muted-foreground text-sm py-6 text-center">Sin resultados</p>
  ) : (
    <div className="space-y-2">
      {list.map(s => (
        <Card key={s.id}>
          <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{s.tenant?.business_name || 'Sin nombre'}</span>
                {statusBadge(s.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Plan: {s.plan?.name || 'Sin plan'} · 
                {s.expires_at ? ` Expira: ${format(parseISO(s.expires_at), 'dd/MM/yyyy')}` : ' Sin expiración'}
              </p>
              {s.payment_notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{s.payment_notes}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {s.status !== 'active' && (
                <Button size="sm" variant="outline" onClick={() => markPaid(s)}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Marcar pagado
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                <CreditCard className="w-3 h-3 mr-1" /> Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Licencias</h1>
          <p className="text-muted-foreground text-sm">Gestión de suscripciones y cobros</p>
        </div>

        {loading ? <p className="text-muted-foreground">Cargando...</p> : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({subs.length})</TabsTrigger>
              <TabsTrigger value="expiring">
                <AlertTriangle className="w-3 h-3 mr-1" /> Por vencer ({expiringTrial.length})
              </TabsTrigger>
              <TabsTrigger value="active">Activos ({activeSubs.length})</TabsTrigger>
              <TabsTrigger value="expired">Vencidos ({expiredSubs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(subs)}</TabsContent>
            <TabsContent value="expiring">{renderList(expiringTrial)}</TabsContent>
            <TabsContent value="active">{renderList(activeSubs)}</TabsContent>
            <TabsContent value="expired">{renderList(expiredSubs)}</TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={!!editSub} onOpenChange={o => !o && setEditSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Licencia — {editSub?.tenant?.business_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue placeholder="Sin plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (${p.price}/mes)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de expiración</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editExpiry && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editExpiry ? format(editExpiry, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editExpiry} onSelect={setEditExpiry} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Notas de pago</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} placeholder="Ej: Pagó por Pago Móvil el 08/03" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditSub(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
