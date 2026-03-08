INSERT INTO public.user_roles (user_id, role)
VALUES ('27720507-d52b-4adb-b4d0-3171b31b999e', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;