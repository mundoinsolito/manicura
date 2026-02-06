import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { ClientDetailDialog } from '@/components/ClientDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, AlertTriangle, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '@/lib/supabase';

export default function AdminClients() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const { appointments } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    cedula: '',
    email: '',
    health_alerts: '',
    preferences: '',
    favorite_colors: '',
    nail_shape: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      cedula: '',
      email: '',
      health_alerts: '',
      preferences: '',
      favorite_colors: '',
      nail_shape: '',
      notes: '',
    });
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      phone: client.phone,
      cedula: client.cedula,
      email: client.email || '',
      health_alerts: client.health_alerts || '',
      preferences: client.preferences || '',
      favorite_colors: client.favorite_colors || '',
      nail_shape: client.nail_shape || '',
      notes: client.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clientData = {
      name: form.name,
      phone: form.phone,
      cedula: form.cedula,
      email: form.email || null,
      health_alerts: form.health_alerts || null,
      preferences: form.preferences || null,
      favorite_colors: form.favorite_colors || null,
      nail_shape: form.nail_shape || null,
      notes: form.notes || null,
    };

    if (editingClient) {
      const result = await updateClient(editingClient.id, clientData);
      if (result.success) {
        toast.success('Cliente actualizado');
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al actualizar');
      }
    } else {
      const result = await addClient(clientData);
      if (result.success) {
        toast.success('Cliente agregado');
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al agregar');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    
    const result = await deleteClient(id);
    if (result.success) {
      toast.success('Cliente eliminado');
    } else {
      toast.error('Error al eliminar');
    }
  };

  const getClientAppointmentCount = (clientId: string) => {
    return appointments.filter(a => a.client_id === clientId).length;
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cedula.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu base de clientas</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="accent-gradient border-0">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <Input
                      id="cedula"
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Alertas de Salud
                  </h4>
                  <Textarea
                    value={form.health_alerts}
                    onChange={(e) => setForm({ ...form, health_alerts: e.target.value })}
                    placeholder="Alergias, uñas débiles, condiciones a considerar..."
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    Preferencias
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Colores favoritos</Label>
                      <Input
                        value={form.favorite_colors}
                        onChange={(e) => setForm({ ...form, favorite_colors: e.target.value })}
                        placeholder="Rosa, rojo, nude..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forma de uña preferida</Label>
                      <Input
                        value={form.nail_shape}
                        onChange={(e) => setForm({ ...form, nail_shape: e.target.value })}
                        placeholder="Almendra, cuadrada, coffin..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Otras preferencias</Label>
                      <Textarea
                        value={form.preferences}
                        onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                        placeholder="Le gusta diseños minimalistas, prefiere brillo..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas adicionales</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Cualquier información adicional..."
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full accent-gradient border-0">
                  {editingClient ? 'Guardar Cambios' : 'Agregar Cliente'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client Detail Dialog */}
        <ClientDetailDialog
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
          appointments={appointments}
        />

        {/* Clients Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Citas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-primary-foreground text-sm font-semibold">
                            {client.name.charAt(0)}
                          </div>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.cedula}</TableCell>
                      <TableCell>
                        {client.health_alerts && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Alerta
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getClientAppointmentCount(client.id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredClients.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
