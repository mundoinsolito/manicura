import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  trial_days: number;
  max_clients: number;
  max_appointments_month: number;
  is_active: boolean;
  features: string[];
}

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    trial_days: 14,
    max_clients: 50,
    max_appointments_month: 100,
    is_active: true,
    features: '',
  });

  const fetchPlans = async () => {
    const { data } = await (supabase as any).from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
    if (data) {
      setPlans(data.map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })));
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      trial_days: plan.trial_days,
      max_clients: plan.max_clients,
      max_appointments_month: plan.max_appointments_month,
      is_active: plan.is_active,
      features: plan.features.join('\n'),
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, trial_days: 14, max_clients: 50, max_appointments_month: 100, is_active: true, features: '' });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      trial_days: form.trial_days,
      max_clients: form.max_clients,
      max_appointments_month: form.max_appointments_month,
      is_active: form.is_active,
      features: form.features.split('\n').filter(Boolean),
    };

    let error;
    if (editing) {
      ({ error } = await (supabase as any).from('subscription_plans').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await (supabase as any).from('subscription_plans').insert(payload));
    }

    if (error) {
      toast.error('Error al guardar');
    } else {
      toast.success('Plan guardado');
      setOpen(false);
      fetchPlans();
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Planes</h1>
            <p className="text-muted-foreground">Gestiona los planes de suscripción</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nuevo Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio mensual ($)</Label>
                    <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Días de prueba</Label>
                    <Input type="number" value={form.trial_days} onChange={e => setForm({ ...form, trial_days: +e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Máx. clientes (-1 = ilimitado)</Label>
                    <Input type="number" value={form.max_clients} onChange={e => setForm({ ...form, max_clients: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Máx. citas/mes</Label>
                    <Input type="number" value={form.max_appointments_month} onChange={e => setForm({ ...form, max_appointments_month: +e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Features (una por línea)</Label>
                  <textarea
                    className="w-full border border-input rounded-md p-2 text-sm bg-background"
                    rows={4}
                    value={form.features}
                    onChange={e => setForm({ ...form, features: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <Label>Activo</Label>
                </div>
                <Button onClick={handleSave} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <Card key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <p className="text-3xl font-bold">${p.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Clientes: {p.max_clients === -1 ? 'Ilimitados' : p.max_clients}</p>
                  <p>Citas/mes: {p.max_appointments_month === -1 ? 'Ilimitadas' : p.max_appointments_month}</p>
                  <p>Trial: {p.trial_days} días</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
