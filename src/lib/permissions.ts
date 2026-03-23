import { createClient } from './supabase/server';

export interface ClinicPlan {
  slug: string;
  name: string;
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
}

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number | null;
  percentage: number;
}

export class FeatureNotAvailableError extends Error {
  status = 403;
  constructor(feature: string) {
    super('FEATURE_NOT_AVAILABLE:' + feature);
    this.name = 'FeatureNotAvailableError';
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super('UNAUTHORIZED:SUPERADMIN_REQUIRED');
    this.name = 'UnauthorizedError';
  }
}

// Caché de memoria simple por clínica (5 minutos)
const cache = new Map<string, { data: ClinicPlan; expires: number }>();

/**
 * Consulta el plan activo de la clínica consolidando clinic_subscriptions y feature_flags.
 * Soporta sobreescritura de limites personalizados para Enterprise.
 */
export async function getClinicPlan(clinic_id: string): Promise<ClinicPlan> {
  const now = Date.now();
  const cached = cache.get(clinic_id);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  const supabase = await createClient();

  // 1. Consultar suscripción de la clínica
  const { data: sub } = await supabase
    .from('clinic_subscriptions')
    .select('*')
    .eq('clinic_id', clinic_id)
    .single();

  const slug = sub?.plan_slug || 'esencial';
  
  // Coerción defensiva de los custom_limits guardados en jsonb
  const custom_limits = (sub?.custom_limits && typeof sub.custom_limits === 'object') 
    ? (sub.custom_limits as Record<string, any>) 
    : {};

  // 2. Cargar feature_flags estándar para este plan
  const { data: flags } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('plan_slug', slug);

  const features: Record<string, boolean> = {};
  const limits: Record<string, number | null> = {};

  if (flags) {
    flags.forEach(f => {
      features[f.feature_key] = f.enabled;
      limits[f.feature_key] = f.limit_value;
    });
  }

  // 3. Sobreescribir con custom_limits (Enterprise)
  if (custom_limits) {
    Object.keys(custom_limits).forEach(key => {
      const val = custom_limits[key];
      if (typeof val === 'number') {
        limits[key] = val;
        // Asume habilitada la bandera si se define un límite numeral
        if (features[key] === undefined || !features[key]) {
          features[key] = true; 
        }
      } else if (val === null) {
        limits[key] = null;
        features[key] = true;
      } else if (typeof val === 'boolean') {
        features[key] = val;
      }
    });
  }

  const plan: ClinicPlan = {
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    features,
    limits
  };

  cache.set(clinic_id, { data: plan, expires: now + 5 * 60 * 1000 });
  return plan;
}

/**
 * Retorna true/false según si un feature está habilitado en el plan
 */
export async function hasFeature(clinic_id: string, feature_key: string): Promise<boolean> {
  const plan = await getClinicPlan(clinic_id);
  return plan.features[feature_key] === true;
}

/**
 * Retorna el limit_value relacionado a una métrica, o null si es infinito
 */
export async function getLimit(clinic_id: string, limit_key: string): Promise<number | null> {
  const plan = await getClinicPlan(clinic_id);
  if (plan.limits[limit_key] !== undefined) {
    return plan.limits[limit_key];
  }
  return null;
}

/**
 * Compara el contador mensual actual de uso vs lo permitido en el plan
 */
export async function checkUsage(clinic_id: string, resource: string): Promise<UsageCheck> {
  const plan = await getClinicPlan(clinic_id);
  const limit = plan.limits[resource] !== undefined ? plan.limits[resource] : null;

  const period = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  const supabase = await createClient();

  const { data: usage } = await supabase
    .from('usage_counters')
    .select('*')
    .eq('clinic_id', clinic_id)
    .eq('period', period)
    .single();

  let current = 0;
  // Mapear recurso tipo "max_doctors" a columnas tipo "doctors_count"
  const mappedKey = resource === 'storage_mb' 
    ? 'storage_mb_used' 
    : `${resource.replace('max_', '').replace('_mo', '')}_count`;

  if (usage && usage[mappedKey] !== undefined) {
    current = Number(usage[mappedKey]);
  }

  let allowed = true;
  if (limit !== null) {
    allowed = current < limit;
  }

  const percentage = limit !== null && limit > 0 ? Math.min(100, (current / limit) * 100) : 0;

  return {
    allowed,
    current,
    limit,
    percentage
  };
}

/**
 * Lanza una excepción en caso de que el feature no esté habilitado.
 * Útil para proteger endpoints de APIs
 */
export async function requireFeature(clinic_id: string, feature_key: string): Promise<void> {
  const enabled = await hasFeature(clinic_id, feature_key);
  if (!enabled) {
    throw new FeatureNotAvailableError(feature_key);
  }
}

/**
 * Valida que el usuario sea superadministrador en su perfil
 */
export async function requireSuperAdmin(user_id: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user_id)
    .single();

  if (!data?.is_superadmin) {
    throw new UnauthorizedError();
  }
}

/**
 * Invalida el caché de memoria para una clínica específica (útil tras cambio de plan)
 */
export function invalidateClinicCache(clinic_id: string): void {
  cache.delete(clinic_id);
}
