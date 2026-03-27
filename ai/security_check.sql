-- 1. RLS activo
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = false;

-- 2. Políticas con OR (PELIGRO)
SELECT tablename, policyname
FROM pg_policies
WHERE qual LIKE '%OR%';

-- 3. Duplicidad de políticas
SELECT tablename, COUNT(*)
FROM pg_policies
GROUP BY tablename
HAVING COUNT(*) > 4;

-- 4. doctor_id NULL (CRÍTICO)
SELECT 'patients', COUNT(*) FROM patients WHERE doctor_id IS NULL
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations WHERE doctor_id IS NULL
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments WHERE doctor_id IS NULL;

-- 5. Auditoría modificable (PELIGRO)
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'audit_log'
AND privilege_type IN ('UPDATE', 'DELETE');
