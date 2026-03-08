

## Plan: Corregir espaciado y mejoras generales de la app

### 1. Corregir el espacio en blanco entre Hero y Servicios

**Problema:** La sección "Features" (líneas 89-113 de Index.tsx) tiene `py-16` de padding incluso cuando no hay feature tags habilitados. La sección renderiza un contenedor vacío con padding.

**Solución:** Envolver toda la sección Features en la condición `enabledFeatureTags.length > 0`, eliminando la sección completa (incluyendo su `py-16`) cuando no hay tags activos.

---

### 2. Vulnerabilidad critica de seguridad en autenticacion

**Problema:** `useAuth.tsx` tiene credenciales hardcodeadas en el codigo fuente (`manicurasocopo@gmail.com` / `manicura266`) y usa `sessionStorage` para verificar si es admin. Cualquier persona puede ver las credenciales en el codigo o manipular `sessionStorage` para acceder al panel admin.

**Solución:** Migrar a Supabase Auth con email/password. Crear una tabla `user_roles` con RLS y una funcion `has_role()` security definer. Las rutas admin verificarian la sesion real de Supabase.

---

### 3. Sin proteccion en rutas admin

**Problema:** Todas las rutas `/admin/*` son accesibles directamente sin verificacion. No hay un componente `ProtectedRoute` que redirija a `/admin` si no hay sesion.

**Solución:** Crear un componente `ProtectedRoute` que verifique la autenticacion antes de renderizar las paginas admin.

---

### 4. RLS (Row Level Security) probablemente abierto

**Problema:** Las tablas de Supabase (clients, appointments, transactions, settings) probablemente tienen politicas RLS muy permisivas o deshabilitadas, lo que significa que cualquier usuario anonimo podria leer/modificar datos directamente.

**Solución:** Configurar politicas RLS que solo permitan lectura publica de `services`, `promotions` y `settings`, y requieran autenticacion admin para todo lo demas.

---

### 5. Horarios en Footer muestran formato 24h crudo

**Problema:** El Footer muestra `settings.opening_time` y `settings.closing_time` directamente (ej: "09:00 - 18:00") sin formatear con `formatTime12h`.

**Solución:** Usar `formatTime12h()` en el Footer para mostrar horarios legibles.

---

### 6. Doble cliente Supabase

**Problema:** Existen dos archivos de cliente Supabase: `src/lib/supabase.ts` y `src/integrations/supabase/client.ts`. Esto puede causar inconsistencias.

**Solución:** Consolidar en un solo cliente y redirigir las importaciones.

---

### 7. El enlace admin visible en Header para todos

**Problema:** El icono de configuracion (engranaje) en el Header es visible para todos los visitantes, exponiendo la ruta `/admin`.

**Solución:** Ocultar el icono de admin del Header publico, o solo mostrarlo cuando hay sesion admin activa.

---

### Resumen de prioridades

| Prioridad | Mejora |
|-----------|--------|
| Inmediata | Eliminar espacio vacio cuando no hay feature tags |
| Critica | Migrar auth a Supabase Auth (credenciales expuestas) |
| Alta | Proteger rutas admin con ProtectedRoute |
| Alta | Configurar RLS en tablas sensibles |
| Media | Ocultar enlace admin del header publico |
| Baja | Consolidar cliente Supabase duplicado |
| Baja | Formatear horarios en Footer |

