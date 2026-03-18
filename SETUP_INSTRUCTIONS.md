# Instrucciones de Configuración - MedIQ (BETA)

Este proyecto es el MVP para la plataforma SaaS médica **MedIQ** construida con **Next.js 14 (App Router)** y **Supabase**.

---

## 🚀 Requisitos Previos
1. Node.js >= 18.x
2. Una cuenta en [Supabase](https://supabase.com/)

---

## 🛠️ Paso 1: Configurar Proyecto Supabase
1. Ingresa a Supabase y crea un nuevo proyecto llamado `MedIQ`.
2. Dirígete a la pestaña de **SQL Editor** en el panel izquierdo.
3. Copia y pega el contenido del archivo `supabase/schema.sql` ubicado en este proyecto y haz clic en **Run** (Ejecutar).
   - *Este script creará las tablas, índices, roles, políticas de seguridad (RLS) y disparadores (triggers).*

---

## 🔑 Paso 2: Configurar Variables de Entorno
1. Crea un archivo `.env.local` en la raíz de este proyecto.
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-id-de-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-anon-key-de-supabase"
```

> 💡 Puedes encontrar estas credenciales en el panel de tu proyecto Supabase: **Project Settings > API**.

---

## 📦 Paso 3: Instalar Dependencias
Ejecuta el siguiente comando en la terminal para descargar los paquetes:

```bash
npm install
```

---

## 💻 Paso 4: Iniciar el Servidor de Desarrollo
Para correr la plataforma localmente y visualizar las interfaces de Doctor y Asistente:

```bash
npm run dev
```

El aplicativo estará listo en: [http://localhost:3000](http://localhost:3000)

---

## 🔒 Roles y Acceso (BETA)
Para registrar usuarios puedes dirigirte a `/login` y usar el botón de **Registrarse**.
- El trigger de base de datos asignará el rol seleccionado (`doctor` o `assistant`) a tu usuario en la tabla `profiles`.
- Las políticas de **Row Level Security (RLS)** protegerán la data de forma automática: los asistentes no podrán ver cuadros clínicos, solo la facturación.
