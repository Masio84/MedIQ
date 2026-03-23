import { createClient } from './supabase/server';
import { checkUsage, getLimit } from './permissions';

export async function incrementUsage(clinic_id: string, resource: 'consultations_count' | 'patients_count', amount = 1) {
  const period = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  const supabase = await createClient();

  try {
     // 1. Leer valor actual para evitar sobreescribir otras columnas
     const { data: current } = await supabase
       .from('usage_counters')
       .select('*')
       .eq('clinic_id', clinic_id)
       .eq('period', period)
       .single();

     const payload: any = {
         clinic_id,
         period,
         [resource]: (current?.[resource] || 0) + amount,
         updated_at: new Date().toISOString()
     };

     const { error } = await supabase
       .from('usage_counters')
       .upsert(payload, { onConflict: 'clinic_id, period' });

     if (error) throw error;

     // Ejecutar revisión de límites en background (silencioso)
     checkAndNotifyLimits(clinic_id).catch(err => console.error('Error checkAndNotifyLimits:', err));

     return { success: true };
  } catch (err) {
     console.error('Error incrementUsage:', err);
     return { success: false };
  }
}

export async function syncStaticCounts(clinic_id: string) {
  const period = new Date().toISOString().substring(0, 7);
  const supabase = await createClient();

  try {
     const [ doctors, assistants, patients ] = await Promise.all([
         supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('clinic_id', clinic_id).eq('role', 'doctor').eq('is_active', true),
         supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('clinic_id', clinic_id).eq('role', 'assistant').eq('is_active', true),
         supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinic_id)
     ]);

     const { data: current } = await supabase
       .from('usage_counters')
       .select('*')
       .eq('clinic_id', clinic_id)
       .eq('period', period)
       .single();

     const payload = {
         clinic_id,
         period,
         doctors_count: doctors.count || 0,
         assistants_count: assistants.count || 0,
         patients_count: patients.count || 0,
         consultations_count: current?.consultations_count || 0, // preservar mensual
         storage_mb_used: current?.storage_mb_used || 0,
         updated_at: new Date().toISOString()
     };

     await supabase.from('usage_counters').upsert(payload, { onConflict: 'clinic_id, period' });
  } catch (err) {
     console.error('Error syncStaticCounts:', err);
  }
}

export async function checkAndNotifyLimits(clinic_id: string) {
  const supabase = await createClient();

  // Mapeo: Limit Key -> Columna en usage_counters
  const limitKeys = ['max_patients', 'max_consultations_mo', 'max_doctors', 'max_assistants'];

  for (const key of limitKeys) {
      try {
          const usage = await checkUsage(clinic_id, key);
          let type: 'usage_critical' | 'usage_warning' | null = null;

          if (usage.percentage >= 90) type = 'usage_critical';
          else if (usage.percentage >= 80) type = 'usage_warning';

          if (type) {
              // Verificar si ya se notificó en las últimas 24 horas
              const { count } = await supabase
                 .from('notifications')
                 .select('*', { count: 'exact', head: true })
                 .eq('clinic_id', clinic_id)
                 .eq('type', type)
                 .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

              if ((count || 0) === 0) {
                  const resourceName = key.replace('max_', '').replace('_mo', '').toUpperCase();
                  await supabase.from('notifications').insert([{
                      clinic_id,
                      type,
                      message: `Tu uso de ${resourceName} está al ${Math.floor(usage.percentage)}% del límite (${usage.current}/${usage.limit}).`,
                      to_user_id: null,
                      from_user_id: null
                  }]);
              }
          }
      } catch (e) {
          console.error(`Error de límite en ${key}:`, e);
      }
  }
}
