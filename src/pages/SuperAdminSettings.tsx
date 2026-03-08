import { useState, useRef } from 'react';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, Image, Type, Sparkles } from 'lucide-react';

export default function SuperAdminSettings() {
  const { settings, loading, update, uploadImage } = usePlatformSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const heroFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  if (loading || !settings) return (
    <SuperAdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    </SuperAdminLayout>
  );

  const val = (key: string) => form[key] ?? (settings as any)[key] ?? '';

  const handleSave = async () => {
    setSaving(true);
    const { error } = await update(form) || {};
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } else {
      toast({ title: 'Guardado', description: 'Configuración actualizada' });
      setForm({});
    }
  };

  const handleUpload = async (file: File, field: 'hero_image_url' | 'brand_logo_url') => {
    const path = `${field}-${Date.now()}.${file.name.split('.').pop()}`;
    const { url, error } = await uploadImage(file, path);
    if (url) {
      setForm(f => ({ ...f, [field]: url }));
      await update({ [field]: url });
      toast({ title: 'Imagen subida' });
    } else {
      toast({ title: 'Error', description: error?.message || 'Error al subir', variant: 'destructive' });
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Configuración de Plataforma</h1>
          <p className="text-muted-foreground text-sm">Edita la landing page, branding y textos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de la plataforma</Label>
                <Input value={val('brand_name')} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-3 mt-1">
                  {(form.brand_logo_url || settings.brand_logo_url) && (
                    <img src={form.brand_logo_url || settings.brand_logo_url!} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => logoFileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Subir logo
                  </Button>
                  <input ref={logoFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'brand_logo_url')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="w-4 h-4" /> Portada (Hero)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Imagen de portada</Label>
                <div className="mt-1">
                  {(form.hero_image_url || settings.hero_image_url) && (
                    <img src={form.hero_image_url || settings.hero_image_url!}
                      className="w-full h-32 object-cover rounded-lg mb-2" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => heroFileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Subir portada
                  </Button>
                  <input ref={heroFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'hero_image_url')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Textos */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="w-4 h-4" /> Textos de la Landing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título principal</Label>
                <Input value={val('hero_title')} onChange={e => setForm(f => ({ ...f, hero_title: e.target.value }))} />
              </div>
              <div>
                <Label>Texto del botón CTA</Label>
                <Input value={val('cta_text')} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Subtítulo</Label>
                <Textarea value={val('hero_subtitle')} rows={2}
                  onChange={e => setForm(f => ({ ...f, hero_subtitle: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Texto del footer</Label>
                <Input value={val('footer_text')} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || Object.keys(form).length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
