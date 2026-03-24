# 📊 Análisis Estructural Completo - MedIQ

Este documento detalla la arquitectura, estructura de repositorio, esquema de base de datos y flujos de lógica para el desarrollo y mantenimiento del sistema **MedIQ**. Está optimizado para que cualquier Asistente de IA pueda leerlo y continuar implementando funcionalidades sin pérdida de contexto.

---

## 🛠️ 1. Stack Tecnológico

*   **Framework Frontend:** [Next.js](https://nextjs.org/) (Versión 16+) utilizando **App Router**.
*   **Librería de Interfaz:** [React](https://react.dev/) (Versión 19+).
*   **Estilos y CSS:** [Tailwind CSS](https://tailwindcss.com/) v4.0.0.
*   **Animaciones:** [Framer Motion](https://www.framer.com/motion/) para transiciones y micro-animaciones fluidas.
*   **Gestión de Iconos:** [Lucide React](https://lucide.dev/).
*   **Visualización de Datos / Analíticas:** [Recharts](https://recharts.org/) para reportes de tendencias y tableros.
*   **Base de Datos y Backend-as-a-Service:** [Supabase](https://supabase.com/) (PostgreSQL v17) con soporte integrado para **Autenticación**, **Realtime** (Chat), y **RLS** (Row Level Security).

---

## 📂 2. Estructura del Repositorio (`src/`)

La aplicación organiza sus recursos en el estándar de Next.js (`src/`):

### 🗺️ `src/app/` (Rutas)
*   **`login/`**: Vista de inicio de sesión.
*   **`auth/`**: Endpoints asíncronos y flujos de autenticación / callback de Supabase.
*   **`dashboard/`**: Punto de acceso principal para usuarios operativos.
    *   *Dinámico*: Despliega vistas basadas en el rol del usuario (`doctor`, `assistant`, `admin`).
    *   Sub-rutas de gestión: `consultations/`, `agenda/`, `patients/`, `billing/`.
*   **`superadmin/`**: Panel de gobernanza global para el administrador del SaaS (gestión de clínicas, planes de cobro de MedIQ).
*   **`book/`**: Módulo de agendado de citas (reserva de horarios públicos/internos).
*   **`api/ai/`**: Endpoints que consumen LLMs para dar soporte médico asistido.
    *   `/diagnose`: Examina síntomas y genera ideas diagnósticas.
    *   `/treat`: Sugerencias de tratamiento y medicamentos para recetas.
    *   `/suggest-followup`: Calcula fechas recomendadas de cita subsecuente.
    *   `/summarize-patient`: Genera resúmenes ejecutivos del historial clínico.

### 🧩 `src/components/` (Componentes Compartidos)
*   **`dashboards/`**: `DoctorDashboard.tsx`, `AssistantDashboard.tsx`, `AdminDashboard.tsx`.
*   **Paneles y Formularios**: `ConsultationForm.tsx`, `PatientForm.tsx`, `BillingPanel.tsx`.
*   **Navegación / Shells**: `DashboardShell.tsx`, `SidebarChat.tsx` (Chat en tiempo real mediante Realtime de Supabase).

### ⚙️ `src/context/`, `hooks/` y `lib/`
*   **`context/`**: Manejo de Estados globales (Autenticación, Contextos de Clínica).
*   **`hooks/`**: Custom hooks para consultas repetitivas a Supabase.
*   **`lib/`**: Configuraciones de cliente Supabase (con soporte para SSR), helpers de formateo y utilidades de backend.

---

## 🗄️ 3. Modelo de Datos (Bases de Datos - Supabase)

El sistema es **Multi-Tenant (Multi-inquilino)**. Los datos se aíslan a nivel de Base de Datos utilizando la columna `clinic_id` ligada a la tabla `public.clinics`.

### 🏥 Clínicas y Usuarios
1.  **`public.clinics`**: Registro de suscripciones o sedes.
    *   `id`, `name`, `address`, `phone`, `email`.
2.  **`public.profiles`**: Extensión de `auth.users` de Supabase.
    *   `role`: `admin`, `doctor`, `assistant`.
    *   `clinic_id`: Identifica a qué sede pertenece (aislamiento).
    *   `medical_license`, `consult_schedule`, `plan_assigned`.
    *   `is_superadmin`: Booleano para accesos globales.

### 📁 Operación Clínica
1.  **`public.patients`**: Fichero de pacientes por clínica.
    *   `doctor_id` (Dueño/Asignado), `clinic_id`, `name`, `allergies`, `medical_history`.
2.  **`public.consultations`**: Registros de consultas médicas.
    *   `patient_id`, `doctor_id`, `symptoms`, `diagnosis`, `treatment`.
    *   `status`: `pending`, `in_progress`, `completed`.
    *   Métricas: `weight`, `blood_pressure`, `temperature`.
3.  **`public.billing`**: Sistema de pagos y registros fiscales.
    *   `consultation_id`, `patient_id`, `normal_fee`, `paid`, `extra_charge`.
    *   Facturación (Parcial): `rfc_receptor`, `cfdi_uuid`, `cfdi_status`.

### 📅 Agenda y Mensajería
1.  **`public.appointments`**: Citas programadas.
    *   `doctor_id`, `patient_id`, `date`, `start_time`, `end_time`, `status`.
2.  **`public.blocked_slots`** y **`doctor_schedule`**: Manejo de calendarios y disponibilidad de médicos.
3.  **`public.chat_messages`**: Mensajería directa entre Doctor ↔ Asistente (In-app). Usado mediante flujos de subscripción de Supabase.
4.  **`public.notifications`**: Alertas entre el staff y pacientes (ej. recordatorios de cita).

### 💳 Planes y Consumos (SaaS)
1.  **`public.plans`**: Parametrización de planes (*Esencial*, *Consultorio*, *Enterprise*).
2.  **`public.feature_flags`**: Control de accesos granulares por plan (por ejemplo, habilitar IA).
3.  **`public.usage_counters`**: Monitoreo de cuotas (Citas creadas, doctores dados de alta, espacio MB usado) para límites de cobro.

---

## 🧠 4. Reglas de Negocio Centrales

1.  **Diferencia de Roles**:
    *   **Asistente**: Administra agenda (`appointments`), levanta pacientes (`patients`), gestiona cobros (`billing`) y visualiza dashboards de operación.
    *   **Doctor**: Atiende consultas (`consultations`), genera recetas (`treatments`) y monitorea diagnósticos sugeridos por IA.
2.  **Lógica de Costos (Dashboards vs Database)**:
    *   *Nota Crítica*: En algunas implementaciones del Frontend (`AdminDashboard.tsx`), las tarjetas de planes y precios ($599 / $1299) están fijas por código. Las tablas de `plans` en Supabase pueden contener referencias antiguas (`Beta`, `Básico`, `Premium`). Se recomienda homologar para que los cálculos dinámicos no fallen.

---

## 🚀 5. Checklist para continuar desarrollando

*   [ ] **Sincronización de Planes**: Actualizar los registros de la tabla `plans` y `feature_flags` para que coincidan con los planes comerciales $599 y $1299.
*   [ ] **Facturación Completa (API Timbrado)**: La tabla `billing` ya contiene campos CFDI (`xml_cfdi`, `rfc_receptor`), pero requiere engancharse con un Proveedor Autorizado de Certificación (PAC) en `api/billing/`.
*   [ ] **Analíticas Globales**: Crear la ruta de "Tendencias" o analíticas para directores de clínicas múltiples utilizando el endpoint generalizado de Supabase con `clinic_id`.
*   [ ] **Superadmin Errors**: Revisar errores causados por importaciones de módulos (como `"Cannot access before initialization"`) que suelen impactar las vistas compartidas de Next.js si se cruzan dependencias circulares entre componentes de `/dashboard` y `/superadmin`.
