
## Plan: Super Admin Completo — Licencias, Comunicación, Pagos y Más

### Estado actual
El Super Admin tiene solo 4 páginas básicas: Dashboard (stats), Tenants (lista simple con activar/suspender/banear), Planes (CRUD) y Plataforma (branding). No hay detalle de contacto de manicuristas, gestión de licencias/cobros, métodos de pago, ni canal de comunicación.

---

### Nuevas tablas de BD

**`payment_methods`** — Métodos de pago que ofrece el super admin:
```
id, name (Pago Móvil), type (pago_movil/zelle/binance/efectivo),
details jsonb { phone, bank, cedula, email, address },
is_active, sort_order, created_at
```
RLS: lectura pública, escritura solo super_admin.

**`support_messages`** — Canal de mensajes entre manicuristas y super admin:
```
id, tenant_id, sender_type (tenant/admin), message, is_read, created_at
```
RLS: tenant lee/escribe las suyas, super_admin ve todo.

**Columnas nuevas en `platform_settings`**: `whatsapp_support`, `support_email`, `faq_items jsonb DEFAULT '[]'`

**Columnas nuevas en `tenants`**: `notes text` (notas internas del super admin sobre el tenant)

---

### Páginas nuevas y refactorizadas

#### 1. `SuperAdminTenants.tsx` — Rediseño completo
- Tabs por estado: Todos / Trial / Activos / Suspendidos / Baneados
- Búsqueda por nombre, slug o email
- Tabla compacta con: logo, nombre, slug, email (del auth), estado, fecha trial
- **Drawer de detalle** al hacer click en un tenant con:
  - Datos de contacto (email copiable, link WhatsApp si tiene teléfono)
  - Suscripción actual + fecha expiración
  - Conteo de clientes, servicios, citas
  - Notas internas del super admin (editables)
  - Acciones: cambiar estado, extender trial, asignar plan

#### 2. `SuperAdminLicenses.tsx` — Página nueva `/superadmin/licencias`
- Lista de suscripciones con filtro: trial expirando pronto / activas / vencidas
- Por cada licencia: tenant, plan asignado, fecha inicio/fin, notas de pago
- Acciones:
  - Asignar/cambiar plan
  - Marcar como pagado (agrega nota: "Pagó por Pago Móvil el 08/03/26")
  - Extender fecha de expiración (datepicker)
  - Activar / suspender directamente

#### 3. `SuperAdminPaymentMethods.tsx` — Página nueva `/superadmin/pagos`
- CRUD de métodos de pago venezolanos:
  - **Pago Móvil**: Banco, Teléfono, Cédula/RIF
  - **Zelle**: Email / nombre
  - **Binance Pay**: ID de Binance
  - **Efectivo USD**: Instrucciones
  - **Transferencia**: Banco, cuenta, beneficiario
- Cada método: activar/desactivar, reordenar, editar
- Estos métodos se muestran en la landing SaaS y en el dashboard de cada manicurista (en una sección "¿Cómo pagar?")

#### 4. `SuperAdminMessages.tsx` — Página nueva `/superadmin/mensajes`
- Lista de conversaciones por tenant (con badge de no leídos)
- Panel de chat simple: ver mensajes del tenant, responder como admin
- Marcar como leído
- Badge en el sidebar con cantidad de mensajes no leídos

#### 5. `SuperAdminSettings.tsx` — Mejorado
Agregar a la página actual:
- Campo WhatsApp de soporte (número que verán las manicuristas)
- Email de soporte
- Editor de FAQ: agregar/editar/eliminar preguntas frecuentes (que se muestran en la landing)

#### 6. `SuperAdminDashboard.tsx` — Mejorado
- Agregar card: "Trials expirando en 7 días" (con link a licencias)
- Agregar card: "Mensajes sin leer"
- Mantener chart de registros y últimos tenants

---

### Cambios en páginas existentes

#### `SuperAdminLayout.tsx`
Nuevos ítems en el nav (con iconos):
```
Dashboard / Tenants / Licencias / Métodos de Pago / Mensajes / Planes / Plataforma
```
+ Badge rojo de mensajes no leídos en "Mensajes"

#### `AdminLayout.tsx` (panel de la manicurista)
Agregar al footer del sidebar:
- Botón **"Contactar Soporte"** que abre WhatsApp con el número del super admin (tomado de `platform_settings`)
- Sección **"¿Cómo pagar?"** como botón que abre un modal con los métodos de pago activos

#### `SaasLanding.tsx`
- Nueva sección **FAQ** con acordeón (datos de `platform_settings.faq_items`)
- Nueva sección **Métodos de pago** (tarjetas con logo + datos de `payment_methods`)

#### `App.tsx`
- Nuevas rutas: `/superadmin/licencias`, `/superadmin/pagos`, `/superadmin/mensajes`

---

### Resumen de archivos

| Archivo | Acción |
|---|---|
| `supabase/migrations/...` | Crear `payment_methods`, `support_messages`, columnas nuevas |
| `SuperAdminLayout.tsx` | Añadir nav items + badge mensajes |
| `SuperAdminTenants.tsx` | Rediseño completo con drawer de detalle |
| `SuperAdminLicenses.tsx` | Nuevo — gestión de licencias/cobros |
| `SuperAdminPaymentMethods.tsx` | Nuevo — CRUD métodos de pago |
| `SuperAdminMessages.tsx` | Nuevo — sistema de mensajes |
| `SuperAdminSettings.tsx` | Añadir WhatsApp, email, FAQ editor |
| `SuperAdminDashboard.tsx` | Añadir cards trials/mensajes |
| `AdminLayout.tsx` | Añadir "Contactar Soporte" + "¿Cómo pagar?" |
| `SaasLanding.tsx` | Añadir sección FAQ + métodos de pago |
| `App.tsx` | 3 rutas nuevas |

### ¿Qué más le falta a la plataforma para ser completa?
- **Reportes exportables** (CSV de clientes y citas por tenant)
- **Notificaciones por email** cuando un trial expira (Edge Function con resend/sendgrid)
- **Página de estado** del servicio
- **Términos y condiciones / Privacidad** (requerido legalmente)
- **Analytics de uso** por tenant (cuánto usa la app)
- **Dominio propio** para manicuristas (nivel avanzado)
