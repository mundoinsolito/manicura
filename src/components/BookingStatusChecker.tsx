import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase, Appointment } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, CreditCard, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function BookingStatusChecker() {
  const [open, setOpen] = useState(false);
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searched, setSearched] = useState(false);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) {
      toast.error('Ingresa tu cédula');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // First find client by cedula
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('cedula', cedula.trim())
        .single();

      if (!client) {
        setAppointments([]);
        return;
      }

      // Get appointments for this client
      const { data: apts } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*)
        `)
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(10);

      setAppointments(apts || []);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCedula('');
      setAppointments([]);
      setSearched(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          Consultar Mi Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Consulta el Estado de tu Cita</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ingresa tu cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </form>

        {searched && (
          <div className="mt-4">
            {appointments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={statusColors[apt.status]}>
                        {statusLabels[apt.status]}
                      </Badge>
                      <span className="text-sm font-medium">${apt.payment_amount}</span>
                    </div>
                    <p className="font-medium">{apt.service?.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(apt.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No se encontraron citas con esta cédula
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
