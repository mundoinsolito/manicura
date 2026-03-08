import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, CreditCard, Clock, Ban } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, trial: 0, active: 0, suspended: 0 });

  useEffect(() => {
    (supabase.from('tenants') as any).select('status').then(({ data }: any) => {
      if (data) {
        setStats({
          total: data.length,
          trial: data.filter((t: any) => t.status === 'trial').length,
          active: data.filter((t: any) => t.status === 'active').length,
          suspended: data.filter((t: any) => t.status === 'suspended').length,
        });
      }
    });
  }, []);

  const cards = [
    { title: 'Total Tenants', value: stats.total, icon: Users, color: 'text-primary' },
    { title: 'En Trial', value: stats.trial, icon: Clock, color: 'text-amber-500' },
    { title: 'Activos', value: stats.active, icon: CreditCard, color: 'text-green-500' },
    { title: 'Suspendidos', value: stats.suspended, icon: Ban, color: 'text-destructive' },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de la plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{c.title}</p>
                    <p className="text-2xl font-bold mt-1">{c.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
