# 📊 Análisis de Estructura y Características - MedIQ

Este documento detalla el estado de implementación de las funcionalidades del sistema **MedIQ** contrastado con los planes comerciales de la plataforma (*Esencial*, *Consultorio*, *Enterprise*).

---

## 🏗️ 1. Resumen de Arquitectura

*   **Frontend:** Next.js 14+ (App Router) alojado en `src/app`.
*   **Diseño de Componentes:** React components en `src/components`.
*   **Base de Datos / Backend:** Supabase (PostgreSQL).
*   **Multi-tenant (Multi-inquilino):** Soportado nativamente a nivel DB mediante la columna `clinic_id` presente en todas las tablas operativas (`profiles`, `patients`, `consultations`, `billing`, `appointments`, etc.), ligada a una tabla `public.clinics`.

---

## 🩺 2. Características por Plan Comercial

###  PLAN ESENCIAL ($599/mes)
*Enfocado en el médico independiente administrando su consultorio.*

| Característica | Estado | Referencia Técnica |
| :--- | :---: | :--- |
| **Dashboard de Doctor** | ✅ Implementado | `components/dashboards/DoctorDashboard.tsx` |
| **Registro de Pacientes** | ✅ Implementado | `components/PatientForm.tsx` / Tabla `patients` |
| **Historial de Consultas** | ✅ Implementado | `app/dashboard/consultations` / `consultations` |
| **Signos Vitales por Consulta** | ✅ Implementado | Columnas `weight`, `blood_pressure` en `consultations` |
| **Agenda Médica Mensual** | ✅ Implementado | `app/dashboard/agenda` y tabla `appointments` |
| **Facturación Básica** | ✅ Implementado | `components/BillingPanel.tsx` y tabla `billing` |
| **Sugerencia Diagnóstico IA** | ✅ Implementado | `api/ai/diagnose` + `ConsultationForm.tsx` |
| **Sugerencia Receta IA** | ✅ Implementado | `api/ai/treat` + `ConsultationForm.tsx` |

---

### 🤝 PLAN CONSULTORIO ($1,299/mes)
*Todo lo del plan Esencial, optimizado para flujos con asistentes.*

| Característica | Estado | Referencia Técnica |
| :--- | :---: | :--- |
| **Dashboard de Asistente** | ✅ Implementado | `components/dashboards/AssistantDashboard.tsx` |
| **Chat Doctor ↔ Asistente** | ✅ Implementado | `components/SidebarChat.tsx` (Realtime Supabase) |
| **Notificaciones Push / Alerta**| ✅ Implementado | Tabla `public.notifications` activa en DB |
| **Sugerencia Cita Seguimiento** | ✅ Implementado | `api/ai/suggest-followup` |
| **Agendado Automático (IA)** | ⚠️ Parcial | Procesa la sugerencia en backend; el guardado en UI es manual. |
| **Gestión Cobros por Asistente** | ✅ Implementado | Flujo disponible mediante roles (`assistant`, `doctor`). |
| **Módulo de Facturación Completo**| ⚠️ Parcial | Hay registro de cobro (`billing.paid`), pero sin timbrado fiscal. |

---

### 🏢 PLAN ENTERPRISE (Convenio)
*Soporte a nivel de corporación o clínicas con múltiples sedes.*

| Característica | Estado | Referencia Técnica |
| :--- | :---: | :--- |
| **Múltiples consultorios** | ✅ Soporte DB | Columna `clinic_id` generalizada para aislar datos por sede. |
| **Usuarios Doctores / Staff** | ✅ Implementado | Tabla `profiles` con columna `role` ('admin', 'doctor', 'assistant'). |
| **Panel Administrativo Central**| ✅ Implementado | Vista de métricas globales en `components/dashboards/AdminDashboard.tsx`. |
| **Analítica de Tendencias (IA)** | ❌ No Encontrado | No existen endpoints para análisis promediado de tendencias clínicas. |

---

## 🧠 3. Endpoints de Inteligencia Artificial (IA)
Ubicación: `src/app/api/ai/`

El sistema cuenta con rutas de API listas que conectan con providers de LLM para:
1.  `/diagnose`: Examina síntomas levantados por el doctor para dar ideas de diagnóstico.
2.  `/treat`: Sugiere tratamientos/medicamentos para la receta.
3.  `/suggest-followup`: Genera la fecha idónea o condiciones para una cita subsecuente.
4.  `/summarize-patient`: Genera resúmenes rápidos del historial.

---

## ⚠️ 4. Notas de Sincronización (Regla de negocio)

*   **Precios Visuales:** Las tarjetas de "Mejora tu plan" que se despliegan en el producto están **hardcodeadas en el frontend** (`AdminDashboard.tsx`) respetando las tarifas nuevas ($599 y $1299).
*   **Base de datos:** En la tabla física `plans`, la parametrización usa el esquema anterior (`Beta`, `Basico`, `Premium`). Se aconseja sincronizar los datos de filas en Supabase para evitar discrepancias al calcular la habilitación dinámica de módulos.
