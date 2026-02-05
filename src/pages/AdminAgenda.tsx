import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAppointments } from '@/hooks/useAppointments';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isFuture, parseISO as parseDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Ban, Check, X, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAgenda() {
  const { appointments, updateAppointment, deleteAppointment } = useAppointments();
  const { blockedTimes, addBlockedTime, deleteBlockedTime } = useBlockedTimes();
  const { settings } = useSettings();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: new Date(),
    start_time: settings.opening_time,
    end_time: settings.closing_time,
    reason: '',
  });

  // Get pending appointments
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => 
    a.status !== 'cancelled' && 
    (isFuture(parseISO(a.date)) || isToday(parseISO(a.date)))
  ).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

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

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Gestiona tus citas y horarios</p>
          </div>
          
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Ban className="w-4 h-4 mr-2" />
                Bloquear Horario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloquear Horario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBlockSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Calendar
                    mode="single"
                    selected={blockForm.date}
                    onSelect={(date) => date && setBlockForm({ ...blockForm, date })}
                    locale={es}
                    className="rounded-lg border pointer-events-auto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora inicio</Label>
                    <Input
                      type="time"
                      value={blockForm.start_time}
                      onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora fin</Label>
                    <Input
                      type="time"
                      value={blockForm.end_time}
                      onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Razón (opcional)</Label>
                  <Input
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                    placeholder="Ej: Descanso, Capacitación..."
                  />
                </div>

                <Button type="submit" className="w-full accent-gradient border-0">
                  Bloquear
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {Array(monthDays[0].getDay()).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {monthDays.map((day) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const dayBlocked = getBlockedForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 min-h-[80px] rounded-lg border transition-colors text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="text-xs accent-gradient text-primary-foreground px-1 rounded mb-1">
                          {dayAppointments.length} cita{dayAppointments.length > 1 ? 's' : ''}
                        </div>
                      )}
                      {dayBlocked.length > 0 && (
                        <div className="text-xs bg-red-100 text-red-700 px-1 rounded">
                          Bloqueado
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day Detail */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate 
                  ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                  : 'Selecciona un día'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {/* Blocked times */}
                  {selectedDateBlocked.map((block) => (
                    <div 
                      key={block.id}
                      className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-red-700 font-medium">
                          <Ban className="w-4 h-4" />
                          Bloqueado
                        </div>
                        <p className="text-sm text-red-600">
                          {block.start_time} - {block.end_time}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-red-500">{block.reason}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Appointments */}
                  {selectedDateAppointments.map((apt) => (
                    <div 
                      key={apt.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{apt.time}</span>
                        </div>
                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <p className="font-medium">{apt.client?.name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground">{apt.service?.name}</p>
                        <p className="text-sm text-muted-foreground">{apt.client?.phone}</p>
                      </div>

                      <div className="flex gap-2">
                        <Select
                          value={apt.status}
                          onValueChange={(v) => handleStatusChange(apt.id, v)}
                        >
                          <SelectTrigger className="flex-1">
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
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteAppointment(apt.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedDateAppointments.length === 0 && selectedDateBlocked.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay citas ni bloqueos para este día
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Selecciona un día del calendario
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Appointments Section */}
        {pendingAppointments.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                Reservas Pendientes de Aprobación ({pendingAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAppointments.map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-4 rounded-lg border border-amber-200 bg-white flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{apt.client?.name || 'Cliente'}</span>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendiente</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.service?.name} • {format(parseISO(apt.date), "d 'de' MMMM", { locale: es })} a las {apt.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tel: {apt.client?.phone} • Monto: ${apt.payment_amount}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(apt.id, 'confirmed')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aceptar
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(apt.id, 'cancelled')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Upcoming Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximas Citas ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-4 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{apt.client?.name || 'Cliente'}</span>
                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.service?.name} • {apt.service?.duration} min
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {format(parseISO(apt.date), "EEEE d 'de' MMMM", { locale: es })} a las {apt.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tel: {apt.client?.phone}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={apt.status}
                        onValueChange={(v) => handleStatusChange(apt.id, v)}
                      >
                        <SelectTrigger className="w-36">
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
                        variant="ghost" 
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteAppointment(apt.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay citas próximas programadas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
