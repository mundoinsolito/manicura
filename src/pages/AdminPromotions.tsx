import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePromotions } from '@/hooks/usePromotions';
import { useServices } from '@/hooks/useServices';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Promotion } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPromotions() {
  const { promotions, loading, addPromotion, updatePromotion, deletePromotion } = usePromotions();
  const { services } = useServices();
  const activeServices = services.filter(s => s.is_active);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    service_id: '',
    discount_percent: '',
    discount_amount: '',
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      image_url: '',
      service_id: '',
      discount_percent: '',
      discount_amount: '',
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      is_active: true,
    });
    setEditingPromotion(null);
  };

  const openEditDialog = (promo: Promotion) => {
    setEditingPromotion(promo);
    setForm({
      title: promo.title,
      description: promo.description,
      image_url: promo.image_url || '',
      service_id: promo.service_id || '',
      discount_percent: promo.discount_percent?.toString() || '',
      discount_amount: promo.discount_amount?.toString() || '',
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
      is_active: promo.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedService = activeServices.find(s => s.id === form.service_id);
    const promoData = {
      title: form.title,
      description: form.description,
      image_url: form.image_url || null,
      service_id: form.service_id || null,
      original_price: selectedService ? selectedService.price : null,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      discount_amount: form.discount_amount ? parseFloat(form.discount_amount) : null,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      is_active: form.is_active,
    };

    if (editingPromotion) {
      const result = await updatePromotion(editingPromotion.id, promoData);
      if (result.success) {
        toast.success('Promoción actualizada');
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al actualizar');
      }
    } else {
      const result = await addPromotion(promoData);
      if (result.success) {
        toast.success('Promoción agregada');
        setDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al agregar');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    
    const result = await deletePromotion(id);
    if (result.success) {
      toast.success('Promoción eliminada');
    } else {
      toast.error('Error al eliminar');
    }
  };

  const isExpired = (promo: Promotion) => {
    return new Date(promo.valid_until) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Promociones</h1>
            <p className="text-muted-foreground">Gestiona tus ofertas especiales</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="accent-gradient border-0">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  <ImageUpload
                    currentImage={form.image_url}
                    onImageUploaded={(url) => setForm({ ...form, image_url: url })}
                    onImageRemoved={() => setForm({ ...form, image_url: '' })}
                    aspectRatio="16/9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: 2x1 en Manicura"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe la promoción..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Servicio vinculado</Label>
                  <Select
                    value={form.service_id}
                    onValueChange={(value) => setForm({ ...form, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Descuento (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_percent}
                      onChange={(e) => setForm({ ...form, discount_percent: e.target.value, discount_amount: '' })}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descuento ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.discount_amount}
                      onChange={(e) => setForm({ ...form, discount_amount: e.target.value, discount_percent: '' })}
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Válido desde</Label>
                    <Input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido hasta</Label>
                    <Input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Promoción activa</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>

                <Button type="submit" className="w-full accent-gradient border-0">
                  {editingPromotion ? 'Guardar Cambios' : 'Crear Promoción'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((promo) => (
              <Card 
                key={promo.id} 
                className={`overflow-hidden ${!promo.is_active || isExpired(promo) ? 'opacity-60' : ''}`}
              >
                {promo.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={promo.image_url} 
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{promo.title}</h3>
                        {!promo.is_active && (
                          <Badge variant="outline">Inactiva</Badge>
                        )}
                        {isExpired(promo) && (
                          <Badge variant="destructive">Expirada</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {promo.description}
                      </p>
                      {promo.original_price != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Precio original: <span className="line-through">${promo.original_price}</span>
                          {promo.discount_percent && (
                            <span className="text-primary font-semibold ml-2">
                              → ${(promo.original_price * (1 - promo.discount_percent / 100)).toFixed(2)}
                            </span>
                          )}
                          {promo.discount_amount && !promo.discount_percent && (
                            <span className="text-primary font-semibold ml-2">
                              → ${(promo.original_price - promo.discount_amount).toFixed(2)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(promo)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(promo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(parseISO(promo.valid_from), 'dd/MM', { locale: es })} - 
                        {format(parseISO(promo.valid_until), 'dd/MM', { locale: es })}
                      </span>
                    </div>
                    
                    {promo.discount_percent && (
                      <Badge className="accent-gradient border-0">
                        <Percent className="w-3 h-3 mr-1" />
                        {promo.discount_percent}% OFF
                      </Badge>
                    )}
                    
                    {promo.discount_amount && !promo.discount_percent && (
                      <Badge className="accent-gradient border-0">
                        <DollarSign className="w-3 h-3 mr-1" />
                        -{promo.discount_amount}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && promotions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No tienes promociones aún
              </p>
              <Button 
                className="accent-gradient border-0"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear tu primera promoción
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
