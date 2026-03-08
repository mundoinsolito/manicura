

## Plan: Asignar rol super_admin a leonardyjhn@gmail.com

### Problema
El usuario `leonardyjhn@gmail.com` (ID: `27720507-d52b-4adb-b4d0-3171b31b999e`) existe en Supabase Auth pero no tiene ninguna fila en la tabla `user_roles`. Por eso `has_role()` retorna `false` para ambos roles y el login lo rechaza con "Credenciales incorrectas o sin permisos".

### Solucion
Ejecutar una migracion SQL que inserte el rol `super_admin` en `user_roles`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('27720507-d52b-4adb-b4d0-3171b31b999e', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Esto es todo lo que se necesita. No hay cambios de codigo, solo un INSERT en la base de datos.

