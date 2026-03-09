
## Plan: Sistema de Métodos de Pago y Comunicación Super Admin

### Estado Actual
Revisando el código, veo que:
- ✅ Las tablas `payment_methods` y `support_messages` ya existen en la BD
- ✅ `platform_settings` ya tiene `whatsapp_support` y `support_email` configurados
- ✅ `SuperAdminSettings.tsx` permite editar branding básico
- ❌ **NO existe** página para gestionar métodos de pago (`SuperAdminPaymentMethods.tsx`)
- ❌ **NO existe** la ruta `/superadmin/pagos` en `App.tsx` 
- ❌ **NO existe** navegación a métodos de pago en `SuperAdminLayout.tsx`
- ❌ La landing `SaasLanding.tsx` **NO muestra** métodos de pago ni FAQ
- ❌ `AdminLayout.tsx` **NO tiene** botón de contactar soporte ni "Cómo pagar"

### Implementación

#### 1. **Crear `SuperAdminPaymentMethods.tsx`**
Página completa para gestión de métodos de pago venezolanos:
- **Lista de métodos** con tabla: nombre, tipo, detalles, activo/inactivo, acciones
- **Crear/Editar modal** con campos dinámicos según tipo:
  - **Pago Móvil**: banco, teléfono, cédula
  - **Zelle**: email, nombre
  - **Binance Pay**: ID Binance  
  - **Transferencia**: banco, cuenta, beneficiario
  - **Efectivo USD**: instrucciones libres
- **Activar/desactivar** métodos
- **Reordenar** con botones subir/bajar (sort_order)

#### 2. **Actualizar `SuperAdminLayout.tsx`**
- Agregar item "Métodos de Pago" con icono CreditCard
- Reordenar navegación: Dashboard / Tenants / Licencias / **Métodos de Pago** / Planes / Plataforma

#### 3. **Agregar ruta en `App.tsx`**
- Nueva ruta: `/superadmin/pagos` → `SuperAdminPaymentMethods`

#### 4. **Mejorar `SuperAdminSettings.tsx`**
- Agregar campos WhatsApp soporte y email soporte (ya existen en BD)
- Agregar editor de FAQ items como array de objetos `{question, answer}`

#### 5. **Actualizar `SaasLanding.tsx`**
- **Nueva sección "Métodos de Pago"** después de precios:
  - Query a `payment_methods` donde `is_active = true`
  - Cards mostrando: tipo, nombre, detalles (sin datos sensibles)
  - Solo mostrar si hay métodos activos
- **Nueva sección "FAQ"** antes del footer:
  - Acordeón con `platform_settings.faq_items`
  - Solo mostrar si hay FAQs configurados

#### 6. **Mejorar `AdminLayout.tsx`**
En el footer del sidebar agregar:
- **Botón "Contactar Soporte"**: abre WhatsApp con el número de `platform_settings.whatsapp_support`
- **Botón "¿Cómo Pagar?"**: abre modal mostrando métodos de pago activos

### Archivos Nuevos
- `src/pages/SuperAdminPaymentMethods.tsx`
- `src/hooks/usePaymentMethods.ts` (hook para CRUD)
- `src/components/PaymentMethodModal.tsx` (modal crear/editar)
- `src/components/PaymentMethodsModal.tsx` (modal para AdminLayout)

### Archivos Modificados
- `src/App.tsx` (nueva ruta)
- `src/components/SuperAdminLayout.tsx` (nav item)  
- `src/pages/SuperAdminSettings.tsx` (WhatsApp + email + FAQ editor)
- `src/pages/SaasLanding.tsx` (sección pagos + FAQ)
- `src/components/AdminLayout.tsx` (botones soporte + pagos)

### Flujo de Usuario
1. **Super Admin** va a `/superadmin/pagos` → gestiona métodos (Pago Móvil, Zelle, etc.)
2. **Super Admin** en Settings → configura WhatsApp soporte y FAQ
3. **Visitantes** en landing → ven métodos de pago disponibles y FAQ
4. **Manicuristas** en dashboard → botón "Contactar Soporte" (WhatsApp) + "¿Cómo Pagar?" (modal)

### Resultado Final
- Super admin gestiona métodos de pago centralizados
- Landing muestra formas de pago transparentes  
- FAQ reduce consultas repetitivas
- Manicuristas tienen contacto directo con soporte
- Experiencia completa de comunicación y pagos
