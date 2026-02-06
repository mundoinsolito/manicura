import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Client, Appointment } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Heart, Phone, CreditCard } from 'lucide-react';

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
}

export function ClientDetailDialog({ client, open, onOpenChange, appointments }: ClientDetailDialogProps) {
  if (!client) return null;

  const clientAppointments = appointments
    .filter(a => a.client_id === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-primary-foreground font-semibold">
              {client.name.charAt(0)}
            </div>
            {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Cédula</p>
                <p className="font-medium">{client.cedula}</p>
              </div>
            </div>
          </div>

          {client.email && (
            <div className="text-sm">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
          )}

          {client.health_alerts && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Alertas de Salud
              </h4>
              <p className="text-sm text-amber-700">{client.health_alerts}</p>
            </div>
          )}

          {(client.favorite_colors || client.nail_shape || client.preferences) && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <h4 className="font-medium text-rose-800 flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4" />
                Preferencias
              </h4>
              {client.favorite_colors && (
                <p className="text-sm text-rose-700">
                  <span className="font-medium">Colores:</span> {client.favorite_colors}
                </p>
              )}
              {client.nail_shape && (
                <p className="text-sm text-rose-700">
                  <span className="font-medium">Forma:</span> {client.nail_shape}
                </p>
              )}
              {client.preferences && (
                <p className="text-sm text-rose-700 mt-1">{client.preferences}</p>
              )}
            </div>
          )}

          {client.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground">Notas</p>
              <p className="font-medium">{client.notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Historial de Citas ({clientAppointments.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clientAppointments.slice(0, 10).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>{format(parseISO(apt.date), 'dd/MM/yyyy', { locale: es })}</span>
                  <span>{apt.service?.name}</span>
                  <Badge variant="outline">{apt.status}</Badge>
                </div>
              ))}
              {clientAppointments.length === 0 && (
                <p className="text-muted-foreground text-sm">Sin citas registradas</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
