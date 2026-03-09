import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, CreditCard, Clock, Ban, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

interface Tenant {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  created_at: string;
  trial_ends_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, trial: 0, active: 0, suspended: 0 });
  const [recent, setRecent] = useState<Tenant[]>([]);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [expiringTrials, setExpiringTrials] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Fetch tenants
    (supabase as any).from('tenants').select('*').order('created_at', { ascending: false }).then(({ data }: any) => {
      if (!data) return;
      setStats({
        total: data.length,
        trial: data.filter((t: any) => t.status === 'trial').length,
        active: data.filter((t: any) => t.status === 'active').length,
        suspended: data.filter((t: any) => t.status === 'suspended').length,
      });
      setRecent(data.slice(0, 5));
      // Expiring trials (within 7 days)
      const now = new Date();
      const soon = addDays(now, 7);
      setExpiringTrials(data.filter((t: any) => t.status === 'trial' && t.trial_ends_at && isBefore(parseISO(t.trial_ends_at), soon)).length);
      // Chart
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) days[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0;
      data.forEach((t: any) => { const d = t.created_at?.slice(0, 10); if (d && days[d] !== undefined) days[d]++; });
      setChartData(Object.entries(days).map(([day, count]) => ({ day: format(parseISO(day), 'dd MMM', { locale: es }), count })));
    });
    // Fetch unread messages
    (supabase as any).from('support_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_type', 'tenant').eq('is_read', false)
      .then(({ count }: any) => setUnreadMessages(count || 0));
  }, []);

  const statusColor: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
  };

  const cards = [
    { title: 'Total', value: stats.total, icon: Users, color: 'text-primary' },
    { title: 'Trial', value: stats.trial, icon: Clock, color: 'text-amber-500' },
    { title: 'Activos', value: stats.active, icon: CreditCard, color: 'text-green-500' },
    { title: 'Suspendidos', value: stats.suspended, icon: Ban, color: 'text-destructive' },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <Card key={c.title}>
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.title}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expiringTrials > 0 && (
            <Link to="/superadmin/licencias">
              <Card className="border-amber-300 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 px-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-sm">Trials por vencer</p>
                    <p className="text-xs text-muted-foreground">{expiringTrials} trial(s) expiran en los próximos 7 días</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link to="/superadmin/mensajes">
              <Card className="border-primary/30 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 px-4 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Mensajes sin leer</p>
                    <p className="text-xs text-muted-foreground">{unreadMessages} mensaje(s) pendientes de respuesta</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Registros últimos 14 días
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent tenants */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Últimos registros</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Sin registros aún</p>
              ) : (
                <div className="space-y-2">
                  {recent.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.business_name}</p>
                        <p className="text-xs text-muted-foreground">/{t.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-xs ${statusColor[t.status] || ''}`}>
                          {t.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t.created_at ? format(parseISO(t.created_at), 'dd/MM') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
