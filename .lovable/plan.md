

## Plan: Convertir a SaaS Multi-Tenant para Manicuristas

### Modelo de Negocio
- URL por tenant: `tudominio.com/:slug` (ej: `/maria`, `/ana`)
- Prueba gratis de X dias + pago mensual
- Licencias gestionadas manualmente por super-admin
- Deploy en Cloudflare Pages

---

### 1. Nuevas tablas en Supabase

```text
tenants
├── id (uuid, PK)
├── owner_id (uuid → auth.users)
├── slug (text, UNIQUE) ← URL publica
├── business_name (text)
├── status (enum: trial, active, suspended, banned)
├── trial_ends_at (timestamptz)
├── created_at (timestamptz)
└── logo_url, cover_image_url, etc.

subscription_plans
├── id (uuid, PK)
├── name (text) ← "Basico", "Pro"
├── price (numeric)
├── trial_days (integer)
├── max_clients (integer)
├── max_appointments_month (integer)
├── features (jsonb)
└── is_active (boolean)

tenant_subscriptions
├── id (uuid, PK)
├── tenant_id (uuid → tenants)
├── plan_id (uuid → subscription_plans)
├── status (enum: trial, active, expired, cancelled)
├── starts_at, expires_at (timestamptz)
├── approved_by (uuid → auth.users, nullable)
└── payment_notes (text)
```

Ademas, **todas las tablas existentes** (services, clients, appointments, transactions, settings, blocked_times, custom_schedules, promotions, push_subscriptions, notification_logs) necesitan una columna `tenant_id (uuid → tenants)` para aislar los datos por cuenta.

---

### 2. Roles de usuario

Ampliar el enum `app_role` existente:

```text
app_role: 'super_admin' | 'admin' | 'user'
```

- **super_admin**: Gestiona toda la plataforma (licencias, planes, baneos)
- **admin**: Manicurista dueña de su tenant (ya existe este rol)
- **user**: Reservado para futuro (clientes registrados)

---

### 3. Estructura de rutas

```text
/                          → Landing page SaaS (registro, precios, features)
/registro                  → Registro de manicurista (crea cuenta + tenant)
/login                     → Login general
/dashboard/*               → Panel de la manicurista (tenant admin)

/:slug                     → Pagina publica del tenant
/:slug/servicios           → Servicios del tenant
/:slug/reservar            → Reservar cita en ese tenant

/superadmin/*              → Panel super-admin
  /superadmin/tenants      → Lista de cuentas
  /superadmin/plans        → Gestionar planes/precios
  /superadmin/licenses     → Aprobar/suspender licencias
```

---

### 4. Paginas nuevas a crear

**Landing SaaS** (`/`):
- Hero con propuesta de valor para manicuristas
- Seccion de precios/planes
- Testimonios / features
- CTA de registro

**Registro** (`/registro`):
- Formulario: nombre, email, password, nombre del negocio, slug deseado
- Al registrarse: crea usuario en Supabase Auth, crea tenant, asigna rol admin, inicia trial

**Super-Admin Panel** (`/superadmin/*`):
- Dashboard con metricas (tenants activos, trials, ingresos)
- Lista de tenants con acciones: aprobar, suspender, banear, extender trial
- Gestion de planes de suscripcion (crear, editar precios, activar/desactivar)
- Historial de licencias/pagos

**Pagina publica del tenant** (`/:slug`):
- Misma funcionalidad actual (servicios, reservas, promociones) pero filtrando por `tenant_id`

---

### 5. Cambios en la arquitectura existente

**Context de Tenant**: Crear un `TenantProvider` que:
- En rutas `/:slug/*` → resuelve el tenant por slug
- En rutas `/dashboard/*` → usa el tenant del usuario autenticado
- Inyecta `tenant_id` en todas las queries

**Hooks existentes**: Todos los hooks (useServices, useClients, useAppointments, etc.) deben filtrar por `tenant_id` del contexto.

**Auth**: Actualizar `useAuth` para manejar los 3 roles y redirigir segun rol.

**RLS**: Actualizar todas las politicas para filtrar por `tenant_id`. Los tenants solo ven sus propios datos.

**Settings**: La tabla settings actual se vuelve per-tenant (ya tendria `tenant_id`), cada manicurista personaliza su pagina.

---

### 6. Funcionalidades adicionales que necesita un SaaS

| Funcionalidad | Descripcion |
|---|---|
| **Onboarding wizard** | Guia paso a paso al registrarse (subir logo, crear primer servicio, configurar horarios) |
| **Limite por plan** | Verificar limites de clientes/citas segun el plan contratado |
| **Email transaccional** | Bienvenida, confirmacion de cuenta, aviso de expiracion de trial |
| **Pagina de precios publica** | Mostrar planes con comparativa de features |
| **Metricas para super-admin** | Ingresos MRR, churn rate, tenants por plan, crecimiento |
| **Soporte/tickets** | Canal para que manicuristas reporten problemas |
| **Terminos y condiciones** | Paginas legales requeridas |
| **Dominio propio** (futuro) | Que cada manicurista pueda usar su propio dominio |
| **Backup/export de datos** | Que cada manicurista pueda descargar sus datos |

---

### 7. Orden de implementacion sugerido

1. **Fase 1 - Base multi-tenant**: Migrar schema (agregar tenant_id a todas las tablas), crear tablas nuevas (tenants, plans, subscriptions), actualizar RLS
2. **Fase 2 - Registro y auth**: Landing SaaS, registro de manicuristas, TenantProvider, login con redireccion por rol
3. **Fase 3 - Super-admin**: Panel de gestion de tenants, planes y licencias
4. **Fase 4 - Adaptar funcionalidad existente**: Hacer que todas las paginas/hooks funcionen con tenant_id
5. **Fase 5 - Onboarding y limites**: Wizard de configuracion inicial, verificacion de limites por plan

---

### Consideraciones para Cloudflare Pages
- React SPA funciona perfecto en Cloudflare Pages
- Necesitaras un `_redirects` file para SPA routing (`/* /index.html 200`)
- Las rutas `/:slug` necesitan cuidado para no colisionar con rutas fijas (`/login`, `/registro`, etc.) — se resolvera poniendo las rutas fijas primero en React Router

Este es un cambio arquitectonico grande. Recomiendo hacerlo por fases, empezando por la Fase 1 (schema) y Fase 2 (registro + landing). Quieres que empiece?

