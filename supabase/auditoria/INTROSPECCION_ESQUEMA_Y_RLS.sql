-- AssistMed AI - Introspección de esquema/RLS/policies/índices
-- Ejecutar en Supabase SQL Editor (staging/producción).
-- Objetivo: establecer "source of truth" del DB real vs scripts del repo.

-- 1) Tablas objetivo y columnas
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles','clinics','patients','consultations','appointments','billing','subscriptions','plans')
order by table_name, ordinal_position;

-- 2) RLS enabled por tabla
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('profiles','clinics','patients','consultations','appointments','billing','subscriptions','plans')
order by c.relname;

-- 3) Policies activas (texto completo)
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','clinics','patients','consultations','appointments','billing','subscriptions','plans')
order by tablename, policyname;

-- 4) Foreign keys
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.update_rule,
  rc.delete_rule,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
  and rc.constraint_schema = tc.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = rc.unique_constraint_name
  and ccu.constraint_schema = rc.unique_constraint_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name in ('profiles','clinics','patients','consultations','appointments','billing','subscriptions','plans')
order by tc.table_name, tc.constraint_name;

-- 5) Índices (incluye composite)
select
  t.relname as table_name,
  i.relname as index_name,
  pg_get_indexdef(ix.indexrelid) as index_def
from pg_index ix
join pg_class t on t.oid = ix.indrelid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('profiles','clinics','patients','consultations','appointments','billing','subscriptions','plans')
order by t.relname, i.relname;

-- 6) Señales de mismatch UI↔DB: ¿existen columnas clave?
select
  table_name,
  max((column_name = 'paid')::int) as has_paid,
  max((column_name = 'status')::int) as has_status,
  max((column_name = 'type')::int) as has_type,
  max((column_name = 'time')::int) as has_time,
  max((column_name = 'clinic_id')::int) as has_clinic_id,
  max((column_name = 'doctor_id')::int) as has_doctor_id
from information_schema.columns
where table_schema = 'public'
  and table_name in ('billing','appointments','patients','consultations','profiles')
group by table_name
order by table_name;

