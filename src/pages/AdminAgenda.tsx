import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAppointments } from '@/hooks/useAppointments';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { useCustomSchedules } from '@/hooks/useCustomSchedules';
import { useSettings } from '@/hooks/useSettings';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useTransactions } from '@/hooks/useTransactions';
import { ClientDetailDialog } from '@/components/ClientDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isFuture, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Ban, Trash2, CheckCircle, XCircle, AlertCircle, Plus, CreditCard, DollarSign, Search, MessageCircle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/lib/supabase';
import { formatTime12h, openWhatsApp } from '@/lib/utils';

export default function AdminAgenda() {
  const { appointments, updateAppointment, deleteAppointment, addAppointment } = useAppointments();
  const { blockedTimes, addBlockedTime, deleteBlockedTime, isTimeBlocked } = useBlockedTimes();
  const { setScheduleForDate, getScheduleForDate } = useCustomSchedules();
  const { settings } = useSettings();
  const { clients, addClient } = useClients();
  const { services } = useServices();
  const { addTransaction } = useTransactions();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ status: 'pending', amount: '', confirmed: false });
  const [customHoursForDay, setCustomHoursForDay] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [blockForm, setBlockForm] = useState({
    date: new Date(),
    start_time: settings.opening_time,
    end_time: settings.closing_time,
    reason: '',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    cedula: '',
    name: '',
    phone: '',
    service_id: '',
    date: new Date(),
    time: '',
  });
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => 
    a.status !== 'cancelled' && 
    (isFuture(parseISO(a.date)) || isToday(parseISO(a.date)))
  ).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const activeServices = services.filter(s => s.is_active);

  const filterBySearch = (apts: typeof appointments) => {
    if (!searchTerm.trim()) return apts;
    const term = searchTerm.toLowerCase().trim();
    return apts.filter(a =>
      a.client?.name?.toLowerCase().includes(term) ||
      a.client?.cedula?.includes(term) ||
      a.client?.phone?.includes(term)
    );
  };

  const filteredPending = filterBySearch(pendingAppointments);
  const filteredUpcoming = filterBySearch(upcomingAppointments);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  };

  const getBlockedForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedTimes.filter(bt => bt.date === dateStr);
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const selectedDateBlocked = selectedDate ? getBlockedForDate(selectedDate) : [];

  const handleStatusChange = async (id: string, status: string) => {
    const result = await updateAppointment(id, { status: status as any });
    if (result.success) {
      toast.success('Estado actualizado');
    } else {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    const result = await deleteAppointment(id);
    if (result.success) {
      toast.success('Cita eliminada');
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addBlockedTime({
      date: format(blockForm.date, 'yyyy-MM-dd'),
      start_time: blockForm.start_time,
      end_time: blockForm.end_time,
      reason: blockForm.reason || null,
    });
    if (result.success) {
      toast.success('Horario bloqueado');
      setBlockDialogOpen(false);
    } else {
      toast.error('Error al bloquear');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    const result = await deleteBlockedTime(id);
    if (result.success) {
      toast.success('Bloqueo eliminado');
    }
  };

  const handleCedulaSearch = () => {
    const client = clients.find(c => c.cedula === appointmentForm.cedula.trim());
    if (client) {
      setExistingClient(client);
      setIsNewClient(false);
      setAppointmentForm(f => ({ ...f, name: client.name, phone: client.phone }));
    } else {
      setExistingClient(null);
      setIsNewClient(true);
      setAppointmentForm(f => ({ ...f, name: '', phone: '' }));
    }
  };

  const getAvailableTimeSlots = () => {
    if (!appointmentForm.date) return [];

    const dateStr = format(appointmentForm.date, 'yyyy-MM-dd');
    const selectedService = services.find(s => s.id === appointmentForm.service_id);
    const serviceDuration = selectedService?.duration || 30;

    const customHours = getScheduleForDate(dateStr);

    const bookedRanges = appointments
      .filter(a => a.date === dateStr && a.status !== 'cancelled')
      .map(a => {
        const [h, m] = a.time.split(':').map(Number);
        const startMinutes = h * 60 + m;
        const duration = a.service?.duration || 60;
        return { start: startMinutes, end: startMinutes + duration };
      });

    const isSlotConflicting = (slotMinutes: number) => {
      const slotEnd = slotMinutes + serviceDuration;
      return bookedRanges.some(range => slotMinutes < range.end && slotEnd > range.start);
    };

    let baseSlots: string[];

    if (customHours) {
      baseSlots = customHours;
    } else if (settings.schedule_mode === 'manual' && settings.manual_hours.length > 0) {
      baseSlots = settings.manual_hours;
    } else {
      const slots: string[] = [];
      const [openHour, openMin] = settings.opening_time.split(':').map(Number);
      const [closeHour, closeMin] = settings.closing_time.split(':').map(Number);
      const interval = settings.time_slot_interval || 30;
      for (let h = openHour; h <= closeHour; h++) {
        for (let m = 0; m < 60; m += interval) {
          if (h === openHour && m < openMin) continue;
          if (h === closeHour && m > closeMin) continue;
          slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }
      baseSlots = slots;
    }

    const [closeHour, closeMin] = settings.closing_time.split(':').map(Number);
    const closeMinutes = closeHour * 60 + closeMin;

    return baseSlots.filter(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      if (isTimeBlocked(dateStr, timeStr)) return false;
      if (isSlotConflicting(slotMinutes)) return false;
      if (slotMinutes + serviceDuration > closeMinutes) return false;
      return true;
    });
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentForm.service_id || !appointmentForm.time) {
      toast.error('Completa todos los campos');
      return;
    }

    let clientId = existingClient?.id;

    if (isNewClient && !existingClient) {
      if (!appointmentForm.name || !appointmentForm.phone || !appointmentForm.cedula) {
        toast.error('Completa los datos del cliente');
        return;
      }

      const result = await addClient({
        name: appointmentForm.name,
        phone: appointmentForm.phone,
        cedula: appointmentForm.cedula,
        email: null,
        health_alerts: null,
        preferences: null,
        favorite_colors: null,
        nail_shape: null,
        notes: null,
      });

      if (result.success && result.data) {
        clientId = result.data.id;
      } else {
        toast.error('Error al crear cliente');
        return;
      }
    }

    if (!clientId) {
      toast.error('Busca un cliente por cédula');
      return;
    }

    const selectedService = services.find(s => s.id === appointmentForm.service_id);

    const result = await addAppointment({
      client_id: clientId,
      service_id: appointmentForm.service_id,
      date: format(appointmentForm.date, 'yyyy-MM-dd'),
      time: appointmentForm.time,
      status: 'confirmed',
      payment_status: 'pending',
      payment_amount: selectedService?.price || 0,
      notes: 'Cita creada por administrador',
    });

    if (result.success) {
      toast.success('Cita creada');
      setAppointmentDialogOpen(false);
      setAppointmentForm({ cedula: '', name: '', phone: '', service_id: '', date: new Date(), time: '' });
      setExistingClient(null);
      setIsNewClient(false);
    } else {
      toast.error('Error al crear cita');
    }
  };

  const openHoursDialog = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = getScheduleForDate(dateStr);
    setCustomHoursForDay(existing || []);
    setHoursDialogOpen(true);
  };

  const getAllPossibleSlots = () => {
    const [openH, openM] = settings.opening_time.split(':').map(Number);
    const [closeH, closeM] = settings.closing_time.split(':').map(Number);
    const slots: string[] = [];
    for (let h = openH; h <= closeH; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === openH && m < openM) continue;
        if (h === closeH && m > closeM) continue;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const toggleDayHour = (hour: string) => {
    setCustomHoursForDay(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort()
    );
  };

  const handleSaveCustomHours = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = await setScheduleForDate(dateStr, customHoursForDay);
    if (result.success) {
      toast.success(customHoursForDay.length > 0 ? 'Horarios personalizados guardados' : 'Horarios personalizados eliminados');
      setHoursDialogOpen(false);
    } else {
      toast.error('Error al guardar');
    }
  };

  // Payment management - enhanced with confirmation
  const openPaymentDialog = (appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;
    setSelectedAppointmentForPayment(appointmentId);
    setPaymentForm({
      status: apt.payment_status,
      amount: apt.payment_amount.toString(),
      confirmed: false,
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentUpdate = async () => {
    if (!selectedAppointmentForPayment) return;
    if (!paymentForm.confirmed) {
      toast.error('Debes confirmar el pago antes de actualizar');
      return;
    }
    const apt = appointments.find(a => a.id === selectedAppointmentForPayment);
    if (!apt) return;

    const newAmount = parseFloat(paymentForm.amount) || 0;
    const oldAmount = apt.payment_amount;

    const result = await updateAppointment(selectedAppointmentForPayment, {
      payment_status: paymentForm.status as any,
      payment_amount: newAmount,
    });

    if (result.success) {
      // Register transaction for the difference
      if (newAmount > oldAmount && (paymentForm.status === 'partial' || paymentForm.status === 'full')) {
        const diff = newAmount - oldAmount;
        await addTransaction({
          type: 'income',
          amount: diff,
          description: `Pago ${paymentForm.status === 'full' ? 'completo' : 'parcial (abono)'} de ${apt.client?.name || 'cliente'} - ${apt.service?.name || 'servicio'}`,
          date: format(new Date(), 'yyyy-MM-dd'),
          appointment_id: apt.id,
        });
      }
      toast.success('Pago actualizado y registrado');
      setPaymentDialogOpen(false);
    } else {
      toast.error('Error al actualizar pago');
    }
  };

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

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-red-100 text-red-800 border-red-200',
    partial: 'bg-amber-100 text-amber-800 border-amber-200',
    full: 'bg-green-100 text-green-800 border-green-200',
  };

  const paymentStatusLabels: Record<string, string> = {
    pending: 'Sin pagar',
    partial: 'Abono parcial',
    full: 'Pagado completo',
  };

  const selectedAptForPayment = selectedAppointmentForPayment 
    ? appointments.find(a => a.id === selectedAppointmentForPayment) 
    : null;

  const renderAppointmentCard = (apt: typeof appointments[0], showDate = false) => (
    <div key={apt.id} className="p-3 sm:p-4 rounded-lg border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{formatTime12h(apt.time)}</span>
          {showDate && (
            <span className="text-sm text-muted-foreground">
              {format(parseISO(apt.date), "d MMM", { locale: es })}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
          <Badge className={paymentStatusColors[apt.payment_status]}>
            <DollarSign className="w-3 h-3 mr-1" />
            {paymentStatusLabels[apt.payment_status]}
          </Badge>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <button 
            className="font-medium text-primary hover:underline text-left"
            onClick={() => apt.client && setSelectedClientForDetail(apt.client)}
          >
            {apt.client?.name || 'Cliente'}
          </button>
          {apt.client?.phone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={(e) => { e.stopPropagation(); openWhatsApp(apt.client!.phone); }}
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{apt.service?.name} • {apt.service?.duration} min</p>
        <p className="text-sm text-muted-foreground">{apt.client?.phone}</p>
        <p className="text-sm text-muted-foreground font-medium">
          <CreditCard className="w-3 h-3 inline mr-1" />
          {apt.client?.cedula}
        </p>
        
        {/* Payment info with clear abono display */}
        <div className="mt-2 p-2 rounded-md bg-muted/50">
          {apt.payment_status === 'pending' && (
            <p className="text-sm text-red-600 font-medium">⏳ Sin pago registrado</p>
          )}
          {apt.payment_status === 'partial' && (
            <p className="text-sm text-amber-700 font-medium">
              💰 Cliente abonó: <span className="text-lg">${apt.payment_amount.toFixed(2)}</span>
              {apt.service?.price && (
                <span className="text-muted-foreground ml-1">(Total: ${apt.service.price})</span>
              )}
            </p>
          )}
          {apt.payment_status === 'full' && (
            <p className="text-sm text-green-700 font-medium">
              ✅ Pagado completo: <span className="text-lg">${apt.payment_amount.toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Notes with service details */}
        {apt.notes && apt.notes.includes('|') && (
          <p className="text-xs text-muted-foreground mt-1 italic">{apt.notes}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={apt.status}
          onValueChange={(v) => handleStatusChange(apt.id, v)}
        >
          <SelectTrigger className="flex-1 min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openPaymentDialog(apt.id)}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Pago
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-destructive"
          onClick={() => handleDeleteAppointment(apt.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Gestiona tus citas y horarios</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="accent-gradient border-0 flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agendar Nueva Cita</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Buscar cliente por cédula</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="V-12345678"
                          value={appointmentForm.cedula}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, cedula: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={handleCedulaSearch}>
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {existingClient && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Cliente encontrado:</span> {existingClient.name}
                      </p>
                      <p className="text-xs text-green-600">Tel: {existingClient.phone}</p>
                    </div>
                  )}

                  {isNewClient && !existingClient && appointmentForm.cedula && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
                      <p className="text-sm text-amber-800 font-medium">Cliente nuevo - Ingresa sus datos:</p>
                      <div className="space-y-2">
                        <Input placeholder="Nombre completo" value={appointmentForm.name} onChange={(e) => setAppointmentForm({ ...appointmentForm, name: e.target.value })} />
                        <Input placeholder="Teléfono" value={appointmentForm.phone} onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Servicio</Label>
                    <Select value={appointmentForm.service_id} onValueChange={(v) => setAppointmentForm({ ...appointmentForm, service_id: v, time: '' })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                      <SelectContent>
                        {activeServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name} - ${s.price} ({s.duration} min)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Calendar mode="single" selected={appointmentForm.date} onSelect={(date) => date && setAppointmentForm({ ...appointmentForm, date, time: '' })} disabled={(date) => isBefore(date, startOfToday())} locale={es} className="rounded-lg border pointer-events-auto" />
                  </div>

                  <div className="space-y-2">
                    <Label>Hora</Label>
                    {appointmentForm.service_id ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {getAvailableTimeSlots().map((time) => (
                          <Button key={time} type="button" variant={appointmentForm.time === time ? 'default' : 'outline'} size="sm" onClick={() => setAppointmentForm({ ...appointmentForm, time })}>
                            {formatTime12h(time)}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecciona un servicio primero</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full accent-gradient border-0">Agendar Cita</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bloquear Horario</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBlockSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Calendar mode="single" selected={blockForm.date} onSelect={(date) => date && setBlockForm({ ...blockForm, date })} locale={es} className="rounded-lg border pointer-events-auto" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora inicio</Label>
                      <Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fin</Label>
                      <Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Razón (opcional)</Label>
                    <Input value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="Ej: Descanso, Capacitación..." />
                  </div>
                  <Button type="submit" className="w-full accent-gradient border-0">Bloquear</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, cédula o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="hidden sm:inline">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                <span className="sm:hidden">{format(currentMonth, 'MMM yyyy', { locale: es })}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[280px]">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2">{day}</div>
                ))}
                {Array(monthDays[0].getDay()).fill(null).map((_, i) => (<div key={`empty-${i}`} />))}
                {monthDays.map((day) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const dayBlocked = getBlockedForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`p-1 sm:p-2 min-h-[48px] sm:min-h-[80px] rounded-lg border transition-colors text-left ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}>
                      <div className="text-xs sm:text-sm font-medium mb-1">{format(day, 'd')}</div>
                      {dayAppointments.length > 0 && (<div className="text-[10px] sm:text-xs accent-gradient text-primary-foreground px-1 rounded mb-1 truncate">{dayAppointments.length} cita{dayAppointments.length > 1 ? 's' : ''}</div>)}
                      {dayBlocked.length > 0 && (<div className="text-[10px] sm:text-xs bg-destructive/10 text-destructive px-1 rounded truncate">Bloq.</div>)}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
              </CardTitle>
              {selectedDate && (
                <Button variant="outline" size="sm" onClick={openHoursDialog}>
                  <Clock className="w-4 h-4 mr-2" />
                  Horarios del día
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-3">
                  {selectedDateBlocked.map((block) => (
                    <div key={block.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-destructive font-medium text-sm"><Ban className="w-4 h-4" />Bloqueado</div>
                        <p className="text-sm text-destructive/80">{formatTime12h(block.start_time)} - {formatTime12h(block.end_time)}</p>
                        {block.reason && <p className="text-xs text-destructive/60">{block.reason}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBlock(block.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {selectedDateAppointments.map(apt => renderAppointmentCard(apt))}
                  {selectedDateAppointments.length === 0 && selectedDateBlocked.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">No hay citas ni bloqueos para este día</p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">Selecciona un día del calendario</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Appointments */}
        {filteredPending.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 text-base sm:text-lg">
                <AlertCircle className="w-5 h-5" />
                Pendientes ({filteredPending.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPending.map((apt) => (
                  <div key={apt.id} className="p-3 sm:p-4 rounded-lg border border-amber-200 bg-background">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <button className="font-semibold text-foreground hover:text-primary hover:underline" onClick={() => apt.client && setSelectedClientForDetail(apt.client)}>
                            {apt.client?.name || 'Cliente'}
                          </button>
                          {apt.client?.phone && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); openWhatsApp(apt.client!.phone); }} title="WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendiente</Badge>
                          <Badge className={paymentStatusColors[apt.payment_status]}>{paymentStatusLabels[apt.payment_status]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {apt.service?.name} • {format(parseISO(apt.date), "d MMM", { locale: es })} {formatTime12h(apt.time)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cédula: {apt.client?.cedula} • Monto indicado: ${apt.payment_amount.toFixed(2)}
                        </p>
                        {apt.notes && apt.notes.includes('|') && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{apt.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(apt.id, 'confirmed')}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aceptar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(apt.id, 'cancelled')}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openPaymentDialog(apt.id)}>
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Próximas Citas ({filteredUpcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUpcoming.length > 0 ? (
              <div className="space-y-3">
                {filteredUpcoming.map(apt => renderAppointmentCard(apt, true))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No se encontraron citas con esa búsqueda' : 'No hay citas próximas programadas'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Custom Hours Dialog */}
        <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Horarios para {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecciona las horas disponibles solo para este día.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {getAllPossibleSlots().map((slot) => (
                  <label key={slot} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${customHoursForDay.includes(slot) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted'}`}>
                    <Checkbox checked={customHoursForDay.includes(slot)} onCheckedChange={() => toggleDayHour(slot)} />
                    <span className="text-sm font-medium">{formatTime12h(slot)}</span>
                  </label>
                ))}
              </div>
              {customHoursForDay.length > 0 && (
                <p className="text-xs text-primary font-medium">{customHoursForDay.length} hora(s): {customHoursForDay.map(h => formatTime12h(h)).join(', ')}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveCustomHours} className="flex-1 accent-gradient border-0">Guardar</Button>
                {customHoursForDay.length > 0 && (<Button variant="outline" onClick={() => setCustomHoursForDay([])}>Limpiar</Button>)}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Payment Dialog with Confirmation */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Gestionar Pago</DialogTitle>
            </DialogHeader>
            {selectedAptForPayment && (
              <div className="space-y-4">
                {/* Client & service info */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium">{selectedAptForPayment.client?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAptForPayment.service?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Precio servicio: ${selectedAptForPayment.service?.price?.toFixed(2) || '0.00'}
                  </p>
                  {selectedAptForPayment.notes && selectedAptForPayment.notes.includes('|') && (
                    <p className="text-xs text-muted-foreground italic mt-1">{selectedAptForPayment.notes}</p>
                  )}
                </div>

                {/* Current payment status */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-sm font-medium text-amber-800">
                    Estado actual: {paymentStatusLabels[selectedAptForPayment.payment_status]}
                  </p>
                  <p className="text-sm text-amber-700">
                    Monto registrado: ${selectedAptForPayment.payment_amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>¿Qué tipo de pago recibiste?</Label>
                  <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v, confirmed: false })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Sin pagar</SelectItem>
                      <SelectItem value="partial">Abono parcial</SelectItem>
                      <SelectItem value="full">Pago completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monto recibido ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value, confirmed: false })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa el monto total que ha pagado el cliente hasta ahora
                  </p>
                </div>

                {/* Confirmation checkbox */}
                <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={paymentForm.confirmed}
                      onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, confirmed: checked === true })}
                      className="mt-0.5"
                    />
                    <div>
                      {paymentForm.status === 'full' ? (
                        <p className="text-sm font-medium">
                          ¿Confirmas que el cliente pagó completo <span className="text-primary">${paymentForm.amount || '0'}</span>?
                        </p>
                      ) : paymentForm.status === 'partial' ? (
                        <p className="text-sm font-medium">
                          ¿Confirmas que el cliente abonó <span className="text-primary">${paymentForm.amount || '0'}</span>?
                        </p>
                      ) : (
                        <p className="text-sm font-medium">
                          ¿Confirmas que quieres marcar como sin pago?
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Esta acción registrará el movimiento en finanzas
                      </p>
                    </div>
                  </label>
                </div>

                <Button 
                  onClick={handlePaymentUpdate} 
                  className="w-full accent-gradient border-0"
                  disabled={!paymentForm.confirmed}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Confirmar y Actualizar Pago
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Client Detail Dialog */}
        <ClientDetailDialog 
          client={selectedClientForDetail}
          open={!!selectedClientForDetail}
          onOpenChange={(open) => !open && setSelectedClientForDetail(null)}
          appointments={appointments}
        />
      </div>
    </AdminLayout>
  );
}
