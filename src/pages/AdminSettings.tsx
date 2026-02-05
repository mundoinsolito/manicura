import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useSettings } from '@/hooks/useSettings';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Store, Clock, DollarSign, Palette, Phone, Save, Loader2, Sparkles, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureTag {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function AdminSettings() {
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    business_name: settings.business_name,
    cover_image_url: settings.cover_image_url || '',
    whatsapp_number: settings.whatsapp_number,
    reservation_amount: settings.reservation_amount.toString(),
    opening_time: settings.opening_time,
    closing_time: settings.closing_time,
    primary_color: settings.primary_color,
    accent_color: settings.accent_color,
  });

  const [featureTags, setFeatureTags] = useState<FeatureTag[]>([
    { id: '1', title: 'Calidad Premium', description: 'Productos de primera calidad para el mejor resultado', enabled: true },
    { id: '2', title: 'Atención Personalizada', description: 'Cada clienta es única, cada servicio es especial', enabled: true },
    { id: '3', title: 'Reserva Fácil', description: 'Agenda tu cita en segundos desde tu celular', enabled: true },
  ]);

  // Load saved feature tags from localStorage
  useEffect(() => {
    const savedTags = localStorage.getItem('featureTags');
    if (savedTags) {
      try {
        setFeatureTags(JSON.parse(savedTags));
      } catch (e) {
        console.error('Error parsing feature tags:', e);
      }
    }
  }, []);

  // Update form when settings load
  useEffect(() => {
    if (!loading) {
      setForm({
        business_name: settings.business_name,
        cover_image_url: settings.cover_image_url || '',
        whatsapp_number: settings.whatsapp_number,
        reservation_amount: settings.reservation_amount.toString(),
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        primary_color: settings.primary_color,
        accent_color: settings.accent_color,
      });
    }
  }, [loading, settings]);

  const updateFeatureTag = (id: string, updates: Partial<FeatureTag>) => {
    setFeatureTags(tags => tags.map(tag => 
      tag.id === id ? { ...tag, ...updates } : tag
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Save feature tags to localStorage
    localStorage.setItem('featureTags', JSON.stringify(featureTags));
    
    const result = await updateSettings({
      business_name: form.business_name,
      cover_image_url: form.cover_image_url || null,
      whatsapp_number: form.whatsapp_number,
      reservation_amount: parseFloat(form.reservation_amount),
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
    });

    if (result.success) {
      toast.success('Configuración guardada');
    } else {
      toast.error('Error al guardar');
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Personaliza tu negocio</p>
          </div>
          
          <Button 
            className="accent-gradient border-0"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Información del Negocio
            </CardTitle>
            <CardDescription>
              Estos datos se mostrarán en tu página pública
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nombre del negocio</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="Mi Salón de Uñas"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen de portada</Label>
              <ImageUpload
                currentImage={form.cover_image_url}
                onImageUploaded={(url) => setForm({ ...form, cover_image_url: url })}
                onImageRemoved={() => setForm({ ...form, cover_image_url: '' })}
                aspectRatio="21/9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contacto
            </CardTitle>
            <CardDescription>
              Número de WhatsApp para recibir reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número de WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                placeholder="+58 412 000 0000"
              />
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +58 para Venezuela)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Horario de Atención
            </CardTitle>
            <CardDescription>
              Define tu horario de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de apertura</Label>
                <Input
                  type="time"
                  value={form.opening_time}
                  onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de cierre</Label>
                <Input
                  type="time"
                  value={form.closing_time}
                  onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pagos y Reservas
            </CardTitle>
            <CardDescription>
              Configura el monto de reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reservation">Monto de reserva ($)</Label>
              <Input
                id="reservation"
                type="number"
                min="0"
                step="0.01"
                value={form.reservation_amount}
                onChange={(e) => setForm({ ...form, reservation_amount: e.target.value })}
                placeholder="10.00"
              />
              <p className="text-xs text-muted-foreground">
                Este es el monto mínimo que las clientas deben pagar para confirmar su cita
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Características Destacadas
            </CardTitle>
            <CardDescription>
              Edita o desactiva las características que aparecen en la página principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureTags.map((tag) => (
              <div key={tag.id} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                <Switch
                  checked={tag.enabled}
                  onCheckedChange={(checked) => updateFeatureTag(tag.id, { enabled: checked })}
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={tag.title}
                    onChange={(e) => updateFeatureTag(tag.id, { title: e.target.value })}
                    placeholder="Título"
                    className="font-semibold"
                  />
                  <Textarea
                    value={tag.description}
                    onChange={(e) => updateFeatureTag(tag.id, { description: e.target.value })}
                    placeholder="Descripción"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Colores
            </CardTitle>
            <CardDescription>
              Personaliza los colores de tu marca (próximamente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color primario</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    placeholder="#d4768f"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color de acento</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    placeholder="#d4a574"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Los colores se aplicarán en una futura actualización
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
