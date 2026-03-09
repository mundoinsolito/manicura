import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { CreditCard, Smartphone, DollarSign, ArrowRightLeft, Coins } from 'lucide-react';

const typeIcon: Record<string, React.ElementType> = {
  pago_movil: Smartphone,
  zelle: DollarSign,
  binance: Coins,
  transferencia: ArrowRightLeft,
  efectivo: DollarSign,
};

const typeLabel: Record<string, string> = {
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  binance: 'Binance Pay',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo USD',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentMethodsModal({ open, onOpenChange }: Props) {
  const { data: methods = [] } = usePaymentMethods(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> ¿Cómo pagar?
          </DialogTitle>
        </DialogHeader>
        {methods.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No hay métodos de pago configurados aún.</p>
        ) : (
          <div className="space-y-3">
            {methods.map(m => {
              const Icon = typeIcon[m.type] || CreditCard;
              return (
                <div key={m.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground">({typeLabel[m.type] || m.type})</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {Object.entries(m.details || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
