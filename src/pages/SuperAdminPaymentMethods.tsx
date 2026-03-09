import { useState } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import {
  usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod,
  PaymentMethod,
} from '@/hooks/usePaymentMethods';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';

const typeLabel: Record<string, string> = {
  pago_movil: 'Pago Móvil', zelle: 'Zelle', binance: 'Binance Pay',
  transferencia: 'Transferencia', efectivo: 'Efectivo USD',
};

export default function SuperAdminPaymentMethods() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const create = useCreatePaymentMethod();
  const update = useUpdatePaymentMethod();
  const remove = useDeletePaymentMethod();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const handleSave = async (data: { name: string; type: string; details: Record<string, string>; sort_order: number }) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...data });
        toast.success('Método actualizado');
      } else {
        await create.mutateAsync({ ...data, is_active: true });
        toast.success('Método creado');
      }
      setModalOpen(false);
      setEditing(null);
    } catch { toast.error('Error al guardar'); }
  };

  const handleToggle = async (m: PaymentMethod) => {
    await update.mutateAsync({ id: m.id, is_active: !m.is_active });
  };

  const handleReorder = async (m: PaymentMethod, dir: 'up' | 'down') => {
    const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(x => x.id === m.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await update.mutateAsync({ id: m.id, sort_order: other.sort_order });
    await update.mutateAsync({ id: other.id, sort_order: m.sort_order });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este método de pago?')) return;
    await remove.mutateAsync(id);
    toast.success('Eliminado');
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Métodos de Pago</h1>
            <p className="text-muted-foreground text-sm">Gestiona los métodos de cobro de la plataforma</p>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : methods.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No hay métodos de pago configurados
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {[...methods].sort((a, b) => a.sort_order - b.sort_order).map((m, i) => (
              <Card key={m.id}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === 0}
                      onClick={() => handleReorder(m, 'up')}><ArrowUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" disabled={i === methods.length - 1}
                      onClick={() => handleReorder(m, 'down')}><ArrowDown className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{m.name}</span>
                      <Badge variant="outline" className="text-xs">{typeLabel[m.type] || m.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {Object.entries(m.details || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  </div>
                  <Switch checked={m.is_active} onCheckedChange={() => handleToggle(m)} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setModalOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PaymentMethodModal
        open={modalOpen} onOpenChange={setModalOpen}
        method={editing} saving={create.isPending || update.isPending}
        nextOrder={methods.length}
        onSave={handleSave}
      />
    </SuperAdminLayout>
  );
}
