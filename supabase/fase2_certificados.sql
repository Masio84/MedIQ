-- Fase 2: Certificados Médicos (Plantillas, Firma e historial)

-- 1. Tabla de plantillas de certificados
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Plantilla Estándar',
  page_config JSONB NOT NULL DEFAULT '{}'::jsonb,      -- PageConfig (size, margins, orientation)
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,            -- TemplateStyles (fonts, colors)
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,          -- BrandingConfig (logo, firma, sello)
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,            -- TemplateBlock[] 
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_own_cert_templates" ON public.certificate_templates
  FOR ALL TO authenticated
  USING (doctor_id = auth.uid());

-- 2. Columna para firma digital en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seal_config JSONB DEFAULT '{}'::jsonb;

-- 3. Campos adicionales en medical_certificates para la plantilla usada
ALTER TABLE public.medical_certificates ADD COLUMN IF NOT EXISTS template_snapshot JSONB DEFAULT '{}'::jsonb;

-- 4. Creación de la tabla de verificación de documentos (Validez Digital)
CREATE TABLE IF NOT EXISTS public.document_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,  -- 'certificate', 'prescription'
  document_id UUID NOT NULL,
  hash_sha256 TEXT NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  patient_id UUID REFERENCES public.patients(id),
  content_snapshot JSONB NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  UNIQUE(hash_sha256)
);

ALTER TABLE public.document_verification ENABLE ROW LEVEL SECURITY;

-- Permite lectura pública para verificar documentos
CREATE POLICY "public_verification_read" ON public.document_verification
  FOR SELECT TO anon, authenticated
  USING (true);

-- Sólo doctores pueden insertar en la tabla a través del backend
CREATE POLICY "doctors_can_insert_verification" ON public.document_verification
  FOR INSERT TO authenticated
  WITH CHECK (doctor_id = auth.uid());

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_cert_templates_doctor ON public.certificate_templates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doc_verification_hash ON public.document_verification(hash_sha256);
