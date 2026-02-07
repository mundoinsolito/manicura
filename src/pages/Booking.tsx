import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { useServices } from '@/hooks/useServices';
import { useSettings } from '@/hooks/useSettings';
import { useAppointments } from '@/hooks/useAppointments';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { useCustomSchedules } from '@/hooks/useCustomSchedules';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, isBefore, startOfToday, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Phone, CreditCard, MessageCircle, Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'service' | 'datetime' | 'info' | 'confirm';

interface BookingData {
  serviceId: string;
  date: Date | undefined;
  time: string;
  name: string;
  phone: string;
  cedula: string;
  paymentType: 'partial' | 'full';
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { services } = useServices();
  const { settings } = useSettings();
  const { appointments, addAppointment } = useAppointments();
  const { isTimeBlocked, blockedTimes } = useBlockedTimes();
  const { getScheduleForDate } = useCustomSchedules();
  const { findClientByPhone, addClient } = useClients();

  const [step, setStep] = useState<Step>('service');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingData>({
    serviceId: searchParams.get('service') || '',
    date: undefined,
    time: '',
    name: '',
    phone: '',
    cedula: '',
    paymentType: 'partial',
  });

  const activeServices = services.filter(s => s.is_active);
  const selectedService = services.find(s => s.id === booking.serviceId);

  // Generate time slots
  const getTimeSlots = () => {
    if (!booking.date) return [];

    const [openHour, openMin] = settings.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = settings.closing_time.split(':').map(Number);

    const dateStr = format(booking.date, 'yyyy-MM-dd');
    const now = new Date();

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const bookedRanges = appointments
      .filter(a => a.date === dateStr && a.status !== 'cancelled')
      .map(a => {
        const startMinutes = timeToMinutes(a.time);
        const duration = a.service?.duration || 60;
        return { start: startMinutes, end: startMinutes + duration };
      });

    const serviceDuration = selectedService?.duration || 30;

    const isSlotConflicting = (slotMinutes: number) => {
      const slotEnd = slotMinutes + serviceDuration;
      return bookedRanges.some(range => slotMinutes < range.end && slotEnd > range.start);
    };

    // Determine base slots: custom day > manual global > interval
    let baseSlots: string[];
    const customHours = getScheduleForDate(dateStr);

    if (customHours) {
      baseSlots = customHours;
    } else if (settings.schedule_mode === 'manual' && settings.manual_hours.length > 0) {
      baseSlots = settings.manual_hours;
    } else {
      const slots: string[] = [];
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

    const closeMinutes = closeHour * 60 + closeMin;

    return baseSlots.filter(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const slotMinutes = h * 60 + m;

      // Past time check for today
      if (isToday(booking.date)) {
        const slotTime = new Date(booking.date);
        slotTime.setHours(h, m, 0, 0);
        if (isBefore(slotTime, now)) return false;
      }

      if (isTimeBlocked(dateStr, timeStr)) return false;
      if (isSlotConflicting(slotMinutes)) return false;
      if (slotMinutes + serviceDuration > closeMinutes) return false;

      return true;
    });
  };

  const timeSlots = getTimeSlots();

  // Check if date is blocked (all day)
  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const fullDayBlock = blockedTimes.find(bt => 
      bt.date === dateStr && 
      bt.start_time === settings.opening_time && 
      bt.end_time === settings.closing_time
    );
    return !!fullDayBlock;
  };

  const handleServiceSelect = (serviceId: string) => {
    setBooking({ ...booking, serviceId });
    setStep('datetime');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setBooking({ ...booking, date, time: '' });
  };

  const handleTimeSelect = (time: string) => {
    setBooking({ ...booking, time });
    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking.name || !booking.phone || !booking.cedula) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setStep('confirm');
  };

  const getWhatsAppMessage = () => {
    if (!selectedService || !booking.date) return '';
    
    const paymentAmount = booking.paymentType === 'full' 
      ? selectedService.price 
      : settings.reservation_amount;

    const message = `Hola, soy ${booking.name}, mi cédula es ${booking.cedula}. Quiero confirmar mi cita para el día ${format(booking.date, 'dd/MM/yyyy', { locale: es })} a las ${booking.time}. Servicio: ${selectedService.name}. Monto a pagar: $${paymentAmount}. Adjunto mi comprobante de pago.`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = async () => {
    if (!selectedService || !booking.date) return;
    
    setSubmitting(true);
    
    try {
      // First, find or create client
      let clientId = '';
      const existingClient = await findClientByPhone(booking.phone);
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Add new client
        const clientResult = await addClient({
          name: booking.name,
          phone: booking.phone,
          cedula: booking.cedula,
          email: null,
          health_alerts: null,
          preferences: null,
          favorite_colors: null,
          nail_shape: null,
          notes: null,
        });
        
        if (clientResult.success && clientResult.data) {
          clientId = clientResult.data.id;
        } else {
          throw new Error('Error al crear cliente');
        }
      }
      
      // Create the appointment with pending status
      const paymentAmount = booking.paymentType === 'full' 
        ? selectedService.price 
        : settings.reservation_amount;
      
      const appointmentResult = await addAppointment({
        client_id: clientId,
        service_id: booking.serviceId,
        date: format(booking.date, 'yyyy-MM-dd'),
        time: booking.time,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: paymentAmount,
        notes: `Cédula: ${booking.cedula}`,
      });
      
      if (!appointmentResult.success) {
        throw new Error('Error al crear la cita');
      }
      
    // Open WhatsApp
    const phoneNumber = settings.whatsapp_number.replace(/\D/g, '');
    const message = getWhatsAppMessage();
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      
      toast.success('¡Cita registrada! Envía tu comprobante para confirmar.');
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Error al registrar la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['service', 'datetime', 'info', 'confirm'] as const;
  const currentStepIndex = steps.indexOf(step);

  return (
    <PublicLayout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Progress */}
          <div className="flex items-center justify-center mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    i <= currentStepIndex 
                      ? 'accent-gradient text-primary-foreground shadow-soft' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < currentStepIndex ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    i < currentStepIndex ? 'accent-gradient' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Service Selection */}
          {step === 'service' && (
            <div className="animate-fade-in">
              <h1 className="font-display text-3xl font-bold text-center mb-8">
                Selecciona tu servicio
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeServices.map((service) => (
                  <Card 
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-elevated ${
                      booking.serviceId === service.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {service.image_url ? (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg hero-gradient flex items-center justify-center text-2xl">
                          💅
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.duration} min</p>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        ${service.price}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {activeServices.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay servicios disponibles en este momento</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 'datetime' && (
            <div className="animate-fade-in">
              <Button 
                variant="ghost" 
                onClick={() => setStep('service')} 
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>

              <h1 className="font-display text-3xl font-bold text-center mb-8">
                Elige fecha y hora
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      Fecha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={booking.date}
                      onSelect={handleDateSelect}
                      disabled={(date) => 
                        isBefore(date, startOfToday()) || 
                        isDateBlocked(date) ||
                        date > addDays(new Date(), 60)
                      }
                      locale={es}
                      className="rounded-lg pointer-events-auto"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Hora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {booking.date ? (
                      timeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              variant={booking.time === time ? 'default' : 'outline'}
                              className={booking.time === time ? 'accent-gradient border-0' : ''}
                              onClick={() => handleTimeSelect(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No hay horarios disponibles para este día
                        </p>
                      )
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Selecciona una fecha primero
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Client Info */}
          {step === 'info' && (
            <div className="animate-fade-in">
              <Button 
                variant="ghost" 
                onClick={() => setStep('datetime')} 
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>

              <h1 className="font-display text-3xl font-bold text-center mb-8">
                Tus datos
              </h1>

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="name"
                          placeholder="Tu nombre"
                          value={booking.name}
                          onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="phone"
                          placeholder="+58 412 000 0000"
                          value={booking.phone}
                          onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cedula">Cédula</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="cedula"
                          placeholder="V-12345678"
                          value={booking.cedula}
                          onChange={(e) => setBooking({ ...booking, cedula: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de pago</Label>
                      <Select 
                        value={booking.paymentType} 
                        onValueChange={(v) => setBooking({ ...booking, paymentType: v as 'partial' | 'full' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="partial">
                            Reserva (${settings.reservation_amount})
                          </SelectItem>
                          <SelectItem value="full">
                            Pago completo (${selectedService?.price || 0})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full accent-gradient border-0">
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && selectedService && booking.date && (
            <div className="animate-fade-in">
              <Button 
                variant="ghost" 
                onClick={() => setStep('info')} 
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>

              <h1 className="font-display text-3xl font-bold text-center mb-8">
                Confirmar reserva
              </h1>

              <Card className="max-w-md mx-auto mb-6">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-semibold">
                      {format(booking.date, "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Hora</span>
                    <span className="font-semibold">{booking.time}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="font-semibold">{booking.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Monto a pagar</span>
                    <span className="font-semibold text-primary text-xl">
                      ${booking.paymentType === 'full' ? selectedService.price : settings.reservation_amount}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="max-w-md mx-auto bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">
                        Envía tu comprobante por WhatsApp
                      </h3>
                      <p className="text-amber-800 text-sm mb-4">
                        Tu cita quedará confirmada una vez que envíes tu comprobante de pago y recibas nuestra confirmación.
                      </p>
                      <Button 
                        onClick={handleWhatsAppClick}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-2" />
                        )}
                        {submitting ? 'Procesando...' : 'Completar y enviar por WhatsApp'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
