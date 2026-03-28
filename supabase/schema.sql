-- Create profiles table linked to Auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  role TEXT CHECK (role IN ('doctor', 'assistant')) DEFAULT 'assistant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birthdate DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  allergies TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  weight NUMERIC,
  blood_pressure TEXT,
  temperature NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Billing table
CREATE TABLE IF NOT EXISTS public.billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  normal_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  extra_charge NUMERIC DEFAULT 0 CHECK (extra_charge >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

-- CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_billing_consultation_id ON public.billing(consultation_id);
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON public.billing(patient_id);

-- Create Function to check if user is a Doctor
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Function to check if user is an Assistant
CREATE OR REPLACE FUNCTION public.is_assistant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'assistant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- profiles: Anyone authenticated can read, only owner can update name (role changes reserved)
CREATE POLICY "authenticated_profiles_read" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- patients: 
-- Doctors can do everything
-- Assistants can see patients for billing processing
CREATE POLICY "doctors_all_patients" ON public.patients
  TO authenticated
  USING (is_doctor() OR is_assistant()); -- Assistants need list of patients to register billing

-- consultations:
-- Doctors can do everything
-- Assistants: NO SELECT (keeps medical data safe)
CREATE POLICY "doctors_all_consultations" ON public.consultations
  TO authenticated
  USING (is_doctor());

-- billing:
-- Doctors can do everything
-- Assistants can SELECT and UPDATE if needed (e.g. discount/extra_charge update)
CREATE POLICY "doctors_all_billing" ON public.billing
  FOR ALL TO authenticated
  USING (is_doctor());

CREATE POLICY "assistants_read_billing" ON public.billing
  FOR SELECT TO authenticated
  USING (is_assistant());

-- Trigger to create profile when auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- CORRECTIONS (9, 10, 11)
-- ==========================================

-- Habilitar extensión necesaria para gin_trgm_ops (si no está activa)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices para búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON public.patients USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_last_name_trgm ON public.patients USING gin(last_name gin_trgm_ops);

-- Índices para filtros por clínica y doctor
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_doctor_id ON public.profiles(doctor_id);

-- Status column in consultations
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Unificar schemas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ==========================================
-- AGENDA & APPOINTMENTS MODULE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'attended', 'cancelled', 'no_show', 'waiting_list')),
  appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'procedure', 'emergency')),
  booked_by TEXT DEFAULT 'doctor' CHECK (booked_by IN ('doctor', 'assistant', 'patient')),
  public_token UUID DEFAULT gen_random_uuid(),
  reminder_sent BOOLEAN DEFAULT false,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_public_token ON public.appointments(public_token);

CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  is_full_day BOOLEAN DEFAULT false,
  recurring TEXT DEFAULT 'none' CHECK (recurring IN ('none', 'weekly', 'monthly')),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blocked_slots_doctor_date ON public.blocked_slots(doctor_id, date);

CREATE TABLE IF NOT EXISTS public.doctor_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monday_start TIME, monday_end TIME, monday_active BOOLEAN DEFAULT true,
  tuesday_start TIME, tuesday_end TIME, tuesday_active BOOLEAN DEFAULT true,
  wednesday_start TIME, wednesday_end TIME, wednesday_active BOOLEAN DEFAULT true,
  thursday_start TIME, thursday_end TIME, thursday_active BOOLEAN DEFAULT true,
  friday_start TIME, friday_end TIME, friday_active BOOLEAN DEFAULT true,
  saturday_start TIME, saturday_end TIME, saturday_active BOOLEAN DEFAULT false,
  sunday_start TIME, sunday_end TIME, sunday_active BOOLEAN DEFAULT false,
  default_duration_minutes INTEGER DEFAULT 30,
  slot_interval_minutes INTEGER DEFAULT 30,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.doctor_schedule ENABLE ROW LEVEL SECURITY;

-- Agenda RLS Policies
CREATE POLICY "appointments_clinic_access" ON public.appointments
  FOR ALL TO authenticated
  USING (
    doctor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND doctor_id = appointments.doctor_id)
  );

CREATE POLICY "blocked_slots_doctor" ON public.blocked_slots
  FOR ALL TO authenticated USING (doctor_id = auth.uid());

CREATE POLICY "doctor_schedule_access" ON public.doctor_schedule
  FOR ALL TO authenticated USING (doctor_id = auth.uid());
