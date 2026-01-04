INSERT INTO public.user_roles (user_id, role)
VALUES ('5fe2b683-3dc2-425d-9dac-25533dfe5ae0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;