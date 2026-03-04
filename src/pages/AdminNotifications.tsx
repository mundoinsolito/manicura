import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Send, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PushSub {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  sent_count: number;
  created_at: string;
}

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [subscribers, setSubscribers] = useState<PushSub[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [tableExists, setTableExists] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscribers();
    loadLogs();
  }, []);

  const loadSubscribers = async () => {
    const { data, error } = await supabase.from('push_subscriptions').select('*');
    if (error) {
      if (error.code === '42P01') setTableExists(false);
      return;
    }
    setSubscribers(data || []);
  };

  const loadLogs = async () => {
    const { data } = await supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setLogs(data);
  };

  const sendNotifications = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Error', description: 'Escribe un título y mensaje', variant: 'destructive' });
      return;
    }

    if (subscribers.length === 0) {
      toast({ title: 'Sin suscriptores', description: 'No hay clientas suscritas a notificaciones', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // Call edge function to send push notifications
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: title.trim(),
          body: body.trim(),
          subscriptions: subscribers.map(s => ({
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          })),
        },
      });

      if (error) throw error;

      // Log the notification
      const actualSent = data?.sent || 0;
      await supabase.from('notification_logs').insert({
        title: title.trim(),
        body: body.trim(),
        sent_count: actualSent,
      });

      if (actualSent > 0) {
        toast({
          title: '¡Enviado!',
          description: `Notificación enviada a ${actualSent} clientas`,
        });
      } else {
        toast({
          title: 'Sin entregas',
          description: `Las suscripciones pueden estar expiradas. Se limpiaron ${data?.expired_cleaned || 0} suscripciones inválidas. Pide a las clientas que reactiven las notificaciones.`,
          variant: 'destructive',
        });
        // Reload subscribers to reflect cleaned ones
        loadSubscribers();
      }

      setTitle('');
      setBody('');
      loadLogs();
    } catch (err: any) {
      console.error('Error sending notifications:', err);
      toast({
        title: 'Error al enviar',
        description: 'Verifica que la función edge esté desplegada. ' + (err.message || ''),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (!tableExists) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Notificaciones Push</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div className="space-y-3">
                  <p className="font-semibold">Configuración requerida</p>
                  <p className="text-sm text-muted-foreground">
                    Necesitas crear las tablas en tu base de datos. Ejecuta este SQL en tu panel de Supabase:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap text-foreground">
{`CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for simplicity (or add policies as needed)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON notification_logs FOR ALL USING (true) WITH CHECK (true);`}
                  </pre>
                  <Button onClick={() => { setTableExists(true); loadSubscribers(); loadLogs(); }}>
                    Ya lo hice, recargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Notificaciones Push</h1>
          <p className="text-muted-foreground">Envía notificaciones a tus clientas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Suscritas</p>
                  <p className="text-2xl font-bold mt-1">{subscribers.length}</p>
                </div>
                <div className="p-3 rounded-full bg-muted text-primary">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Enviadas</p>
                  <p className="text-2xl font-bold mt-1">{logs.length}</p>
                </div>
                <div className="p-3 rounded-full bg-muted text-accent">
                  <Send className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Nueva Notificación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input
                placeholder="Ej: ¡Promoción especial!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje</label>
              <Textarea
                placeholder="Ej: 20% de descuento en todos los servicios este fin de semana"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>
            <Button onClick={sendNotifications} disabled={sending || !title || !body} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Enviando...' : `Enviar a ${subscribers.length} clientas`}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Envíos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.title}</p>
                      <p className="text-xs text-muted-foreground">{log.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString('es')} · {log.sent_count} enviadas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
