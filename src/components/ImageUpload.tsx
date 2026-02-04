import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadToImgBB } from '@/lib/imgbb';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  aspectRatio?: string;
}

export function ImageUpload({ 
  currentImage, 
  onImageUploaded, 
  onImageRemoved,
  aspectRatio = '4/3' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadToImgBB(file);
      onImageUploaded(url);
      setPreview(url);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onImageRemoved?.();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group" style={{ aspectRatio }}>
          <img 
            src={preview} 
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          
          <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cambiar'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
          style={{ aspectRatio }}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8" />
              <span className="text-sm">Subir imagen</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
