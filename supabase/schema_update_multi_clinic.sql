-- =======================================================================================
-- ⚠️ INSTRUCCIONES: Ejecuta este script dividiéndolo en DOS PASOS en tu Editor SQL de Supabase.
-- La Base de datos necesita registrar primero las columnas antes de aplicar políticas sobre ellas.
-- =======================================================================================

-- 📌 [ PASO 1 ] - EJECUTAR ESTO PRIMERO
-- ==========================================

-- 1. Crear tabla de Clínicas
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de Planes
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  setup_fee NUMERIC NOT NULL DEFAULT 3000,
  max_doctors INTEGER NOT NULL DEFAULT 1,
  max_assistants INTEGER NOT NULL DEFAULT 0,
  max_patients INTEGER NOT NULL DEFAULT 100,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserción de planes estándar
INSERT INTO public.plans (name, monthly_price, setup_fee, max_doctors, max_assistants, max_patients, features)
VALUES 
('Beta', 1600, 3000, 1, 1, 150, '["Registro de Pacientes", "Seguimiento de Consultas", "Reportes Básicos"]'::jsonb),
('Basico', 2500, 3000, 3, 2, 500, '["Expedientes completos", "Historial Clínico", "Reportes Avanzados", "Soporte de Asistentes"]'::jsonb),
('Premium', 3999, 3000, 10, 5, 5000, '["Todo lo del Plan Básico", "Asistencia de IA en Consulta", "Recetas Inteligentes", "Recordatorios WhatsApp"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 3. Crear tabla de Suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'past_due', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Actualizar tabla profiles existentes (Agregar columnas)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_assigned TEXT DEFAULT 'Beta';

-- 5. Crear tabla de Citas si no existía
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  title TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Actualizar otras tablas (Agregar clinic_id)
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.consultations 
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

ALTER TABLE public.billing 
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- 7. Crear Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultations_clinic_id ON public.consultations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_clinic_id ON public.billing(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);




-- 📌 [ PASO 2 ] - EJECUTAR ESTO DESPUÉS (Limpia y Corre polízas)
-- ==========================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Funciones Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🏥 Clínicas Policies
DROP POLICY IF EXISTS "admin_all_clinics" ON public.clinics;
DROP POLICY IF EXISTS "user_read_clinic" ON public.clinics;

CREATE POLICY "admin_all_clinics" ON public.clinics FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "user_read_clinic" ON public.clinics FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.clinic_id = clinics.id OR p.role = 'admin')));

-- 💳 Subscriptions Policies
DROP POLICY IF EXISTS "admin_all_subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "user_read_subscription" ON public.subscriptions;

CREATE POLICY "admin_all_subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "user_read_subscription" ON public.subscriptions FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.clinic_id = subscriptions.clinic_id OR p.role = 'admin')));

-- 👤 Profiles Policies
DROP POLICY IF EXISTS "authenticated_profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "user_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    (auth.uid() = id) OR
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.clinic_id = profiles.clinic_id AND p.role = 'doctor')) OR
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'assistant' AND p.doctor_id = profiles.id))
  );

-- 🧑 Patient Policies
DROP POLICY IF EXISTS "doctors_all_patients" ON public.patients;
DROP POLICY IF EXISTS "patients_policy" ON public.patients;

CREATE POLICY "patients_policy" ON public.patients
  FOR ALL TO authenticated
  USING (
    is_admin() OR
    (is_doctor() AND clinic_id = patients.clinic_id) OR
    (is_assistant() AND clinic_id = patients.clinic_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.doctor_id = patients.doctor_id))
  );

-- 📝 Consultations Policies
DROP POLICY IF EXISTS "doctors_all_consultations" ON public.consultations;
DROP POLICY IF EXISTS "consultations_policy" ON public.consultations;

CREATE POLICY "consultations_policy" ON public.consultations
  FOR ALL TO authenticated
  USING (
    is_admin() OR
    (is_doctor() AND clinic_id = consultations.clinic_id)
  );

-- 📅 Appointments Policies
DROP POLICY IF EXISTS "appointments_policy" ON public.appointments;

CREATE POLICY "appointments_policy" ON public.appointments
  FOR ALL TO authenticated
  USING (
    is_admin() OR
    (is_doctor() AND clinic_id = appointments.clinic_id) OR
    (is_assistant() AND clinic_id = appointments.clinic_id)
  );

-- 💵 Billing Policies
DROP POLICY IF EXISTS "doctors_all_billing" ON public.billing;
DROP POLICY IF EXISTS "assistants_read_billing" ON public.billing;
DROP POLICY IF EXISTS "billing_policy" ON public.billing;

CREATE POLICY "billing_policy" ON public.billing
  FOR ALL TO authenticated
  USING (
    is_admin() OR
    (is_doctor() AND clinic_id = billing.clinic_id) OR
    (is_assistant() AND clinic_id = billing.clinic_id)
  );

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, clinic_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant'),
    NULLIF(NEW.raw_user_meta_data->>'clinic_id', '')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
