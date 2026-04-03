import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
      await requireSuperAdmin(user.id);
    } catch (e: any) {
      return NextResponse.json({ error: 'Prohibido: Solo SuperAdmin' }, { status: 403 });
    }

    const { action, tableName, policyName, definition } = await req.json();

    let sql = '';

    switch (action) {
      case 'ENABLE_RLS':
        sql = `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`;
        break;
      case 'DISABLE_RLS':
        sql = `ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;`;
        break;
      case 'DROP_POLICY':
        sql = `DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`;
        break;
      case 'CREATE_POLICY':
        const { command, roles, using, withCheck } = definition;
        const rolesList = roles.length > 0 ? roles.join(', ') : 'public';
        
        // Primero eliminamos si existe para simular un "REPLACE"
        const dropSql = `DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`;
        const createSql = `
          CREATE POLICY "${policyName}" ON "${tableName}"
          FOR ${command}
          TO ${rolesList}
          USING (${using || 'true'})
          ${withCheck ? `WITH CHECK (${withCheck})` : ''};
        `;
        sql = `${dropSql} ${createSql}`;
        break;
      default:
        return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
    }

    // Ejecutar SQL usando la función RPC existente en el backend
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: sql });

    if (error) {
       console.error('SQL Execution Error:', error);
       return NextResponse.json({ 
         error: 'Error de Postgres', 
         details: error.message,
         sql: sql 
       }, { status: 500 });
    }

    // Registrar en la bitácora de auditoría
    try {
      const summary = action === 'ENABLE_RLS' ? `RLS habilitado`
                  : action === 'DISABLE_RLS' ? `RLS deshabilitado`
                  : action === 'DROP_POLICY' ? `Política "${policyName}" eliminada`
                  : `Política "${policyName}" creada/actualizada (${definition?.command || ''})`;

      await supabaseAdmin.from('logs').insert({
        user_id: user.id,
        action_type: 'SECURITY_RLS',
        table_name: tableName || 'database',
        new_data: { 
          summary, 
          action, 
          policy_name: policyName,
          sql: sql.substring(0, 500) // Guardamos un extracto por si acaso
        }
      });
    } catch (logError) {
      console.error('Error al registrar auditoría RLS:', logError);
      // No bloqueamos la respuesta principal si falla el log, pero lo reportamos en consola
    }

    return NextResponse.json({ success: true, message: `Operación ${action} completada`, sql });

  } catch (error: any) {
    console.error('RLS Execute Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
