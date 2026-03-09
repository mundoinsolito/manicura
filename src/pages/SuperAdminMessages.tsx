import { useState, useEffect, useRef } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';

interface Conversation {
  tenant_id: string;
  business_name: string;
  slug: string;
  unread: number;
  last_message: string;
  last_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function SuperAdminMessages() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConvos = async () => {
    const { data: msgs } = await (supabase as any).from('support_messages').select('*, tenant:tenants(business_name, slug)').order('created_at', { ascending: false });
    if (!msgs) { setLoading(false); return; }

    const map = new Map<string, Conversation>();
    for (const m of msgs as any[]) {
      if (!map.has(m.tenant_id)) {
        map.set(m.tenant_id, {
          tenant_id: m.tenant_id,
          business_name: m.tenant?.business_name || 'Sin nombre',
          slug: m.tenant?.slug || '',
          unread: 0,
          last_message: m.message,
          last_at: m.created_at,
        });
      }
      if (!m.is_read && m.sender_type === 'tenant') {
        map.get(m.tenant_id)!.unread++;
      }
    }
    setConvos(Array.from(map.values()).sort((a, b) => b.last_at.localeCompare(a.last_at)));
    setLoading(false);
  };

  const fetchMessages = async (tenantId: string) => {
    const { data } = await (supabase as any).from('support_messages')
      .select('*').eq('tenant_id', tenantId).order('created_at');
    setMessages((data || []) as Message[]);
    // Mark tenant messages as read
    await (supabase as any).from('support_messages')
      .update({ is_read: true })
      .eq('tenant_id', tenantId).eq('sender_type', 'tenant').eq('is_read', false);
    fetchConvos();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { fetchConvos(); }, []);
  useEffect(() => { if (selected) fetchMessages(selected); }, [selected]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    const { error } = await (supabase as any).from('support_messages').insert({
      tenant_id: selected,
      sender_type: 'admin',
      message: newMsg.trim(),
    });
    if (error) { toast.error('Error al enviar'); return; }
    setNewMsg('');
    fetchMessages(selected);
  };

  const selectedConvo = convos.find(c => c.tenant_id === selected);

  return (
    <SuperAdminLayout>
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Mensajes</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: '60vh' }}>
          {/* Conversations list */}
          <Card className={`md:col-span-1 ${selected ? 'hidden md:block' : ''}`}>
            <CardContent className="p-0">
              {loading ? <p className="text-muted-foreground text-sm p-4">Cargando...</p> :
                convos.length === 0 ? <p className="text-muted-foreground text-sm p-4 text-center">Sin mensajes</p> :
                  <ScrollArea className="h-[60vh]">
                    {convos.map(c => (
                      <button key={c.tenant_id}
                        className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${selected === c.tenant_id ? 'bg-muted' : ''}`}
                        onClick={() => setSelected(c.tenant_id)}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">{c.business_name}</span>
                          {c.unread > 0 && <Badge className="bg-destructive text-destructive-foreground text-xs ml-1">{c.unread}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(c.last_at), 'dd/MM HH:mm')}</p>
                      </button>
                    ))}
                  </ScrollArea>
              }
            </CardContent>
          </Card>

          {/* Chat panel */}
          <Card className={`md:col-span-2 flex flex-col ${!selected ? 'hidden md:flex' : ''}`}>
            {!selected ? (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Selecciona una conversación</p>
                </div>
              </CardContent>
            ) : (
              <>
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelected(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold text-sm">{selectedConvo?.business_name}</span>
                  <span className="text-xs text-muted-foreground">/{selectedConvo?.slug}</span>
                </div>
                <ScrollArea className="flex-1 p-3" style={{ minHeight: '40vh', maxHeight: '50vh' }}>
                  <div className="space-y-2">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p>{m.message}</p>
                          <p className={`text-xs mt-1 ${m.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(parseISO(m.created_at), 'dd/MM HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..."
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <Button onClick={sendMessage} disabled={!newMsg.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
