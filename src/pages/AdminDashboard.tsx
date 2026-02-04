import { AdminLayout } from '@/components/AdminLayout';
import { useServices } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Scissors, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { services } = useServices();
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const { totalIncome, totalExpenses, netProfit } = useTransactions();

  const todayAppointments = appointments.filter(a => 
    isToday(parseISO(a.date)) && a.status !== 'cancelled'
  );

  const tomorrowAppointments = appointments.filter(a => 
    isTomorrow(parseISO(a.date)) && a.status !== 'cancelled'
  );

  const pendingAppointments = appointments.filter(a => 
    a.status === 'pending'
  );

  const stats = [
    {
      title: 'Citas Hoy',
      value: todayAppointments.length,
      icon: Calendar,
      color: 'text-primary',
    },
    {
      title: 'Total Clientas',
      value: clients.length,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Servicios Activos',
      value: services.filter(s => s.is_active).length,
      icon: Scissors,
      color: 'text-green-500',
    },
    {
      title: 'Ganancia Neta',
      value: `$${netProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: netProfit >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenida de vuelta</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Citas de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-primary-foreground font-semibold">
                          {apt.client?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{apt.client?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.service?.name || 'Servicio'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay citas para hoy
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Confirmations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pendientes de Confirmación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {pendingAppointments.slice(0, 5).map((apt) => (
                    <div 
                      key={apt.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
                    >
                      <div>
                        <p className="font-medium">{apt.client?.name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(apt.date), 'dd/MM', { locale: es })} - {apt.time}
                        </p>
                      </div>
                      <div className="text-sm text-amber-600 font-medium">
                        {apt.service?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay citas pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Ingresos Totales</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Gastos Totales</span>
                <DollarSign className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Citas Mañana</span>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{tomorrowAppointments.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
