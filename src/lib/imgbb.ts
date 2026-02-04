const IMGBB_API_KEY = 'b6df97eeef096c2160f3ba93478435df';

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error al subir la imagen');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Error al subir la imagen');
  }

  return data.data.url;
}

export async function uploadBase64ToImgBB(base64: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  
  const formData = new FormData();
  formData.append('image', base64Data);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error al subir la imagen');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error?.message || 'Error al subir la imagen');
  }

  return data.data.url;
}
