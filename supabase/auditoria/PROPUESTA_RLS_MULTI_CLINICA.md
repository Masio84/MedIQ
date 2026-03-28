# Propuesta RLS multi-clínica (AssistMed AI)

## Diagnóstico
En `[supabase/schema_update_multi_clinic.sql](../schema_update_multi_clinic.sql)` existen patrones que son **peligrosos** para aislamiento multi-tenant:
- Policies `FOR ALL` sin `WITH CHECK`.
- Condiciones del tipo `clinic_id = patients.clinic_id` dentro de la misma tabla, que se vuelve una **tautología** y no asegura pertenencia a clínica.

## Principios de diseño
- **Admin**: acceso total por clínica o global (dependiendo modelo SaaS).
- **Doctor**: acceso a datos donde `row.clinic_id = my_profile.clinic_id` y `row.doctor_id = auth.uid()` (si el ownership es por doctor).
- **Assistant**: acceso por `row.clinic_id = my_profile.clinic_id` y `row.doctor_id = my_profile.doctor_id` (si el asistente está asignado a un doctor).
- Separar políticas por operación: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Para `INSERT/UPDATE`: siempre `WITH CHECK` (evita writes fuera de scope).

## Esqueleto de policies recomendadas (ejemplo conceptual)
> Nota: estas policies deben ajustarse al esquema real (confirmar con `INTROSPECCION_ESQUEMA_Y_RLS.sql`).

### `patients`
- **SELECT**:
  - admin: true
  - doctor: `patients.clinic_id = p.clinic_id AND patients.doctor_id = auth.uid()`
  - assistant: `patients.clinic_id = p.clinic_id AND patients.doctor_id = p.doctor_id`
- **INSERT**:
  - doctor: `WITH CHECK (clinic_id = p.clinic_id AND doctor_id = auth.uid())`
  - assistant: `WITH CHECK (clinic_id = p.clinic_id AND doctor_id = p.doctor_id)`
- **UPDATE/DELETE**:
  - doctor: `USING (...) WITH CHECK (...)` igual al ownership
  - assistant: normalmente **sin UPDATE/DELETE** salvo campos administrativos (mejor vía RPC/endpoint)

### `consultations`
- SELECT: doctor ve las suyas por clinic/doctor; assistant solo si necesita facturación (preferir vista/endpoint con columnas mínimas).
- INSERT: doctor inserta con `doctor_id=auth.uid()` y `clinic_id=p.clinic_id`.
- UPDATE: solo doctor/ admin; `WITH CHECK` para mantener clinic/doctor invariantes.

### `billing`
- SELECT: assistant necesita ver “pendientes” pero idealmente sin PHI; considerar **vista** `billing_list` con columnas limitadas.
- UPDATE: permitir a assistant marcar `paid=true` pero **sin** cambiar clinic/consultation/patient. Esto requiere:
  - RPC `mark_billing_paid(billing_id)` con security definer + validación, o
  - endpoint server que haga allowlist y use sesión + RLS.

## Recomendación práctica (más segura)
Para evitar “RLS no es column-level”, preferir:
- **Vistas** para asistentes (sin `medical_history/allergies`).
- **RPCs** para operaciones de estado (pagar, cancelar cita, check-in) con validación fuerte.

