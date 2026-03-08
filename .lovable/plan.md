

## Plan: Redisenar Landing SaaS + Super Admin con portada editable

### Problemas actuales
- La landing tiene demasiado espacio vacio (hero de 90vh, secciones con py-20)
- No hay forma de editar la portada/contenido de la landing desde el super admin
- El super admin solo tiene dashboard basico, tenants y planes
- Falta: editar textos de la landing, subir imagen de portada, configuracion de la plataforma, estadisticas mas ricas

### Cambios a implementar

**1. Tabla `platform_settings` para contenido editable**
- Nueva tabla en Supabase con campos: `hero_title`, `hero_subtitle`, `hero_image_url`, `brand_name`, `brand_logo_url`, `cta_text`, `cta_section_title`, `cta_section_text`, `footer_text`
- Solo super_admin puede editar, lectura publica
- El super admin podra cambiar toda la portada, textos y branding desde su panel

**2. Redisenar SaasLanding.tsx - mas compacta**
- Hero reducido a ~70vh con imagen de portada editable (desde platform_settings)
- Secciones con py-12 en lugar de py-20
- Features en grid mas compacto (cards mas pequenas)
- Pasos "Como funciona" en linea horizontal compacta
- Pricing cards sin tanto padding
- Eliminar CTA section redundante (ya hay CTAs en hero y pricing)
- Footer mas limpio y compacto

**3. Nueva pagina SuperAdmin: Configuracion de Plataforma**
- Ruta `/superadmin/settings`
- Formulario para editar todos los textos de la landing
- Upload de imagen de portada hero (via Supabase Storage bucket `platform`)
- Upload de logo de la plataforma
- Preview en tiempo real de los cambios
- Editar nombre de la plataforma (NailsPro → lo que quiera)

**4. Mejorar SuperAdminLayout**
- Agregar link a "Configuracion" en el sidebar
- Icono Settings

**5. Mejorar SuperAdminDashboard**
- Cards de stats mas compactas
- Agregar lista de ultimos tenants registrados
- Agregar grafico simple de registros por semana (recharts ya instalado)

**6. Bucket de Storage**
- Crear bucket `platform` publico para imagenes de la landing
- RLS: super_admin puede subir, publico puede leer

### Archivos a crear/modificar
- **Crear**: `supabase/migrations/...platform_settings.sql` (tabla + bucket + seed)
- **Crear**: `src/pages/SuperAdminSettings.tsx` (config de plataforma)
- **Crear**: `src/hooks/usePlatformSettings.ts` (fetch/update platform_settings)
- **Modificar**: `src/pages/SaasLanding.tsx` (redisenar compacta, datos dinamicos)
- **Modificar**: `src/components/SuperAdminLayout.tsx` (agregar Settings al nav)
- **Modificar**: `src/pages/SuperAdminDashboard.tsx` (mas info, menos espacios)
- **Modificar**: `src/App.tsx` (agregar ruta /superadmin/settings)

### Funcionalidades adicionales que le faltan a la plataforma
- **Logs de actividad**: Registro de acciones del super admin
- **Notificaciones por email**: Aviso cuando un tenant se registra o su trial expira
- **Pagina de terminos y privacidad**: Requerido legalmente
- **FAQ publica**: Seccion de preguntas frecuentes en la landing
- **Soporte/contacto**: Formulario o enlace de WhatsApp para soporte

