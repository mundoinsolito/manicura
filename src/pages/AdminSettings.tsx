import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useSettings, defaultSectionColors } from '@/hooks/useSettings';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Clock, DollarSign, Palette, Phone, Save, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { FeatureTag, SectionColors } from '@/lib/supabase';
import { formatTime12h } from '@/lib/utils';

const defaultFeatureTags: FeatureTag[] = [
  { id: '1', title: 'Calidad Premium', description: 'Productos de primera calidad para el mejor resultado', enabled: true },
  { id: '2', title: 'Atención Personalizada', description: 'Cada clienta es única, cada servicio es especial', enabled: true },
  { id: '3', title: 'Reserva Fácil', description: 'Agenda tu cita en segundos desde tu celular', enabled: true },
];

function generateAllSlots(openTime: string, closeTime: string): string[] {
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const slots: string[] = [];
  for (let h = openH; h <= closeH; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === openH && m < openM) continue;
      if (h === closeH && m > closeM) continue;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

const colorLabels: Record<keyof SectionColors, string> = {
  background: 'Fondo general',
  foreground: 'Texto principal',
  card_bg: 'Fondo de tarjetas',
  card_text: 'Texto de tarjetas',
  heading_color: 'Títulos',
  body_text: 'Texto de párrafos',
  button_bg: 'Fondo de botones',
  button_text: 'Texto de botones',
  accent_bg: 'Fondo de acento',
  accent_text: 'Texto de acento',
};

export default function AdminSettings() {
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    business_name: settings.business_name,
    logo_url: settings.logo_url || '',
    cover_image_url: settings.cover_image_url || '',
    whatsapp_number: settings.whatsapp_number,
    reservation_amount: settings.reservation_amount.toString(),
    opening_time: settings.opening_time,
    closing_time: settings.closing_time,
    time_slot_interval: (settings.time_slot_interval || 30).toString(),
    schedule_mode: settings.schedule_mode || 'interval',
    manual_hours: settings.manual_hours || [],
    primary_color: settings.primary_color,
    accent_color: settings.accent_color,
  });

  const [sectionColors, setSectionColors] = useState<SectionColors>(
    settings.section_colors || defaultSectionColors
  );

  const [featureTags, setFeatureTags] = useState<FeatureTag[]>(
    settings.feature_tags || defaultFeatureTags
  );

  useEffect(() => {
    if (!loading) {
      setForm({
        business_name: settings.business_name,
        logo_url: settings.logo_url || '',
        cover_image_url: settings.cover_image_url || '',
        whatsapp_number: settings.whatsapp_number,
        reservation_amount: settings.reservation_amount.toString(),
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        time_slot_interval: (settings.time_slot_interval || 30).toString(),
        schedule_mode: settings.schedule_mode || 'interval',
        manual_hours: settings.manual_hours || [],
        primary_color: settings.primary_color,
        accent_color: settings.accent_color,
      });
      setFeatureTags(settings.feature_tags || defaultFeatureTags);
      setSectionColors(settings.section_colors || defaultSectionColors);
    }
  }, [loading, settings]);

  const allSlots = generateAllSlots(form.opening_time, form.closing_time);

  const toggleManualHour = (hour: string) => {
    setForm(f => ({
      ...f,
      manual_hours: f.manual_hours.includes(hour)
        ? f.manual_hours.filter(h => h !== hour)
        : [...f.manual_hours, hour].sort(),
    }));
  };

  const updateFeatureTag = (id: string, updates: Partial<FeatureTag>) => {
    setFeatureTags(tags => tags.map(tag => 
      tag.id === id ? { ...tag, ...updates } : tag
    ));
  };

  const updateSectionColor = (key: keyof SectionColors, value: string) => {
    setSectionColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const result = await updateSettings({
      business_name: form.business_name,
      logo_url: form.logo_url || null,
      cover_image_url: form.cover_image_url || null,
      whatsapp_number: form.whatsapp_number,
      reservation_amount: parseFloat(form.reservation_amount),
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      time_slot_interval: parseInt(form.time_slot_interval),
      schedule_mode: form.schedule_mode as 'interval' | 'manual',
      manual_hours: form.manual_hours,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      section_colors: sectionColors,
      feature_tags: featureTags,
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Personaliza tu negocio</p>
          </div>
          
          <Button 
            className="accent-gradient border-0 w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
            <CardDescription>Estos datos se mostrarán en tu página pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nombre del negocio</Label>
              <Input id="business_name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Mi Salón de Uñas" />
            </div>
            <div className="space-y-2">
              <Label>Logo del negocio</Label>
              <ImageUpload currentImage={form.logo_url} onImageUploaded={(url) => setForm({ ...form, logo_url: url })} onImageRemoved={() => setForm({ ...form, logo_url: '' })} aspectRatio="1/1" />
              <p className="text-xs text-muted-foreground">Imagen cuadrada recomendada (ej: 200x200px)</p>
            </div>
            <div className="space-y-2">
              <Label>Imagen de portada (fondo del inicio)</Label>
              <ImageUpload currentImage={form.cover_image_url} onImageUploaded={(url) => setForm({ ...form, cover_image_url: url })} onImageRemoved={() => setForm({ ...form, cover_image_url: '' })} aspectRatio="21/9" />
              <p className="text-xs text-muted-foreground">Esta imagen aparecerá de fondo en la sección principal</p>
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
            <CardDescription>Número de WhatsApp para recibir reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número de WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+58 412 000 0000" />
              <p className="text-xs text-muted-foreground">Incluye el código de país (ej: +58 para Venezuela)</p>
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
            <CardDescription>Define tu horario de trabajo y cómo se generan los horarios disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de apertura</Label>
                <Input type="time" value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora de cierre</Label>
                <Input type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} />
              </div>
            </div>

            {/* Schedule Mode */}
            <div className="space-y-3 p-4 rounded-lg border border-border">
              <Label className="font-semibold">Modo de horarios</Label>
              <Select value={form.schedule_mode} onValueChange={(v) => setForm({ ...form, schedule_mode: v as 'interval' | 'manual' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">Automático por intervalo</SelectItem>
                  <SelectItem value="manual">Selección manual de horas</SelectItem>
                </SelectContent>
              </Select>

              {form.schedule_mode === 'interval' ? (
                <div className="space-y-2">
                  <Label>Intervalo de horarios</Label>
                  <Select value={form.time_slot_interval} onValueChange={(v) => setForm({ ...form, time_slot_interval: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar intervalo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Cada 15 minutos</SelectItem>
                      <SelectItem value="30">Cada 30 minutos</SelectItem>
                      <SelectItem value="45">Cada 45 minutos</SelectItem>
                      <SelectItem value="60">Cada 1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Define cada cuánto tiempo se mostrarán las opciones de horario</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Selecciona las horas que quieres mostrar</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Solo estas horas aparecerán disponibles para reservar (a menos que un día tenga horario personalizado)
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {allSlots.map((slot) => (
                      <label 
                        key={slot} 
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          form.manual_hours.includes(slot) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Checkbox checked={form.manual_hours.includes(slot)} onCheckedChange={() => toggleManualHour(slot)} />
                        <span className="text-sm font-medium">{formatTime12h(slot)}</span>
                      </label>
                    ))}
                  </div>
                  {form.manual_hours.length > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {form.manual_hours.length} hora(s) seleccionada(s): {form.manual_hours.map(h => formatTime12h(h)).join(', ')}
                    </p>
                  )}
                </div>
              )}
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
            <CardDescription>Configura el monto de reserva</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reservation">Monto de reserva ($)</Label>
              <Input id="reservation" type="number" min="0" step="0.01" value={form.reservation_amount} onChange={(e) => setForm({ ...form, reservation_amount: e.target.value })} placeholder="10.00" />
              <p className="text-xs text-muted-foreground">Este es el monto mínimo que las clientas deben pagar para confirmar su cita</p>
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
            <CardDescription>Edita o desactiva las características que aparecen en la página principal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureTags.map((tag) => (
              <div key={tag.id} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                <Switch checked={tag.enabled} onCheckedChange={(checked) => updateFeatureTag(tag.id, { enabled: checked })} />
                <div className="flex-1 space-y-2">
                  <Input value={tag.title} onChange={(e) => updateFeatureTag(tag.id, { title: e.target.value })} placeholder="Título" className="font-semibold" />
                  <Textarea value={tag.description} onChange={(e) => updateFeatureTag(tag.id, { description: e.target.value })} placeholder="Descripción" rows={2} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Colors by Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Colores por Sección
            </CardTitle>
            <CardDescription>
              Personaliza los colores de cada parte de tu página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(colorLabels) as Array<keyof SectionColors>).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm">{colorLabels[key]}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={sectionColors[key]}
                      onChange={(e) => updateSectionColor(key, e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={sectionColors[key]}
                      onChange={(e) => updateSectionColor(key, e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
              <div className="p-4 rounded-lg" style={{ backgroundColor: sectionColors.background }}>
                <h3 className="font-display text-lg font-bold mb-1" style={{ color: sectionColors.heading_color }}>
                  Título de ejemplo
                </h3>
                <p className="text-sm mb-3" style={{ color: sectionColors.body_text }}>
                  Este es un texto de párrafo de ejemplo para ver cómo se ven los colores.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: sectionColors.button_bg, color: sectionColors.button_text }}>
                    Botón
                  </span>
                  <span className="px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: sectionColors.accent_bg, color: sectionColors.accent_text }}>
                    Acento
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSectionColors(defaultSectionColors)}
            >
              Restaurar colores por defecto
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}