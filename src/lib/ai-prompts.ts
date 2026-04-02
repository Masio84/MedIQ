import { createClient } from '@/lib/supabase/server';
import { AIPromptFeature } from '@/types/ai';

/**
 * Obtiene el prompt más relevante para un doctor y una funcionalidad específica.
 * Prioridad: 
 * 1. Prompt privado asignado directamente al doctor.
 * 2. Prompt público más reciente.
 * 3. Fallback (el prompt hardcoded en la ruta).
 */
export async function getDynamicPrompt(
  feature: AIPromptFeature,
  doctorId: string,
  fallbackPrompt: string
): Promise<string> {
  const supabase = await createClient();

  try {
    // 1. Buscar si hay algún prompt privado asignado a este doctor para esta feature
    const { data: privateAssignment } = await supabase
      .from('ai_prompt_assignments')
      .select('prompt_id, ai_prompts(*)')
      .eq('doctor_id', doctorId)
      .eq('ai_prompts.feature_key', feature)
      .eq('ai_prompts.is_active', true)
      .eq('ai_prompts.is_public', false)
      .single();

    if (privateAssignment?.ai_prompts) {
      return (privateAssignment.ai_prompts as any).prompt_text;
    }

    // 2. Buscar el prompt público más reciente para esta feature
    const { data: publicPrompt } = await supabase
      .from('ai_prompts')
      .select('prompt_text')
      .eq('feature_key', feature)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (publicPrompt) {
      return publicPrompt.prompt_text;
    }

  } catch (error) {
    console.error(`Error fetching dynamic prompt for ${feature}:`, error);
  }

  // 3. Retornar el fallback si no hay nada en la DB
  return fallbackPrompt;
}
