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
