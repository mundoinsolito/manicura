import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod } from '@/hooks/usePaymentMethods';

const TYPES = [
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'binance', label: 'Binance Pay' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo USD' },
];

const FIELDS: Record<string, { key: string; label: string }[]> = {
  pago_movil: [
    { key: 'banco', label: 'Banco' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'cedula', label: 'Cédula/RIF' },
  ],
  zelle: [
    { key: 'email', label: 'Email' },
    { key: 'nombre', label: 'Nombre del titular' },
  ],
  binance: [
    { key: 'binance_id', label: 'ID de Binance / Pay ID' },
  ],
  transferencia: [
    { key: 'banco', label: 'Banco' },
    { key: 'cuenta', label: 'Nº de cuenta' },
    { key: 'beneficiario', label: 'Beneficiario' },
  ],
  efectivo: [
    { key: 'instrucciones', label: 'Instrucciones' },
  ],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: PaymentMethod | null;
  onSave: (data: { name: string; type: string; details: Record<string, string>; sort_order: number }) => void;
  saving?: boolean;
  nextOrder?: number;
}

export function PaymentMethodModal({ open, onOpenChange, method, onSave, saving, nextOrder = 0 }: Props) {
  const [type, setType] = useState('pago_movil');
  const [name, setName] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (method) {
      setType(method.type);
      setName(method.name);
      setDetails(method.details || {});
    } else {
      setType('pago_movil');
      setName('');
      setDetails({});
    }
  }, [method, open]);

  const fields = FIELDS[type] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name || TYPES.find(t => t.value === type)?.label || type,
      type,
      details,
      sort_order: method?.sort_order ?? nextOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{method ? 'Editar' : 'Nuevo'} Método de Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={v => { setType(v); setDetails({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder={TYPES.find(t => t.value === type)?.label} />
          </div>
          {fields.map(f => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.key === 'instrucciones' ? (
                <Textarea value={details[f.key] || ''} rows={3}
                  onChange={e => setDetails(d => ({ ...d, [f.key]: e.target.value }))} />
              ) : (
                <Input value={details[f.key] || ''}
                  onChange={e => setDetails(d => ({ ...d, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
