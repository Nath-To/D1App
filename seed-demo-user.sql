-- Ejecutar después de d1shop_database.sql
-- Usuario demo para probar la app (sin login)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('demo@d1shop.com', 'demo_hash_cambiar_en_produccion', 'Usuario Demo', 'usuario')
ON CONFLICT (email) DO NOTHING;

-- Si no hay usuarios, el primero tendrá user_id = 1 (usado por la app como demo)
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));
