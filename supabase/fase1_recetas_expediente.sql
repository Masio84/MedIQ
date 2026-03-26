-- FASE 1: Tabla de Recetas (Prescriptions) y Versionado de Consultas (Consultation History)

-- ==========================================
-- 1. TABLA DE RECETAS (PRESCRIPTIONS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Habilitar seguridad
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para prescriptions
CREATE POLICY "doctors_all_prescriptions" ON public.prescriptions
  TO authenticated
  USING (is_doctor());

-- Asistentes pueden requerir ver las recetas para imprimir o dar seguimiento
CREATE POLICY "assistants_read_prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (is_assistant());

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON public.prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_folio ON public.prescriptions(folio);

-- ==========================================
-- 2. TABLA DE HISTORIAL DE CONSULTAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.consultation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  field_modified TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Habilitar seguridad
ALTER TABLE public.consultation_history ENABLE ROW LEVEL SECURITY;

-- Políticas para consultation_history (Sólo médicos manejan expediente clínico)
CREATE POLICY "doctors_all_history" ON public.consultation_history
  TO authenticated
  USING (is_doctor());

-- Índices
CREATE INDEX IF NOT EXISTS idx_consultation_history_consultation_id ON public.consultation_history(consultation_id);

-- ==========================================
-- 3. TRIGGER DE AUDITORÍA (VERSIONADO)
-- ==========================================
-- Función Trigger para auditar cambios en consultas de forma inmutable
CREATE OR REPLACE FUNCTION public.audit_consultation_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.diagnosis IS DISTINCT FROM NEW.diagnosis THEN
    INSERT INTO public.consultation_history (consultation_id, field_modified, previous_value, new_value, modified_by)
    VALUES (NEW.id, 'diagnosis', OLD.diagnosis, NEW.diagnosis, auth.uid());
  END IF;

  IF OLD.symptoms IS DISTINCT FROM NEW.symptoms THEN
    INSERT INTO public.consultation_history (consultation_id, field_modified, previous_value, new_value, modified_by)
    VALUES (NEW.id, 'symptoms', OLD.symptoms, NEW.symptoms, auth.uid());
  END IF;

  IF OLD.treatment IS DISTINCT FROM NEW.treatment THEN
    INSERT INTO public.consultation_history (consultation_id, field_modified, previous_value, new_value, modified_by)
    VALUES (NEW.id, 'treatment', OLD.treatment, NEW.treatment, auth.uid());
  END IF;

  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    INSERT INTO public.consultation_history (consultation_id, field_modified, previous_value, new_value, modified_by)
    VALUES (NEW.id, 'notes', OLD.notes, NEW.notes, auth.uid());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador en la tabla consultations
DROP TRIGGER IF EXISTS trigger_audit_consultations ON public.consultations;
CREATE TRIGGER trigger_audit_consultations
  AFTER UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE PROCEDURE public.audit_consultation_changes();
