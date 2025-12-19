// lib/database.ts o config/database.ts
// Versión migrada de PostgreSQL Pool a Supabase Client

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Faltan las variables de entorno de Supabase (URL o ANON_KEY)');
}

// ============================================
// CLIENTE PÚBLICO (Frontend - Respeta RLS)
// ============================================
const pool = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'monitoreo_ciudadano'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// ============================================
// CLIENTE ADMINISTRATIVO (Backend - Ignora RLS)
// ⚠️ SOLO usar en API routes del servidor
// ============================================
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'monitoreo_ciudadano'
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// ============================================
// EVENTOS DE CONEXIÓN (Compatibilidad con código original)
// ============================================
console.log('📡 Cliente Supabase inicializado');
console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Schema:', 'monitoreo_ciudadano');

// ============================================
// FUNCIÓN PARA TESTEAR LA CONEXIÓN
// ============================================
export const testConnection = async (): Promise<boolean> => {
  try {
    // Intentar hacer una query simple para verificar conexión
    const { data, error } = await pool
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexión a Supabase exitosa:', {
      timestamp: new Date().toISOString(),
      database: 'monitoreo_ciudadano',
      status: 'connected',
      url: supabaseUrl
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error instanceof Error ? error.message : error);
    return false;
  }
};

// ============================================
// FUNCIÓN PARA EJECUTAR QUERIES SQL DIRECTAS
// ============================================
/**
 * Ejecuta queries SQL usando Supabase RPC
 * Nota: Para queries complejas, considera crear funciones RPC en Supabase
 * 
 * @deprecated Usa las funciones específicas (getData, insertData, etc.) en su lugar
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  console.warn('⚠️ Usando query SQL directo. Considera usar el API builder de Supabase.');
  console.warn('💡 Para queries complejas, crea funciones RPC en Supabase.');
  
  try {
    // Supabase no soporta SQL arbitrario directamente
    // Debes migrar cada query a usar el API builder o funciones RPC
    throw new Error(
      'Query SQL directo no soportado. ' +
      'Migra a usar: getData(), insertData(), updateData(), deleteData() ' +
      'o crea una función RPC en Supabase para queries complejos.'
    );
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Error en query:', { 
      text: text.substring(0, 100), 
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
};

// ============================================
// FUNCIÓN PARA TRANSACCIONES
// ============================================
/**
 * Ejecuta operaciones en transacción
 * Nota: En Supabase, cada operación es atómica por defecto.
 * Para transacciones complejas, usa Database Functions (stored procedures)
 */
export const transaction = async (callback: (client: SupabaseClient) => Promise<any>) => {
  try {
    console.log('🔄 Iniciando transacción...');
    
    // En Supabase, las operaciones individuales son atómicas
    // Para transacciones multi-tabla, considera crear una función RPC
    const result = await callback(pool);
    
    console.log('✅ Transacción completada');
    return result;
  } catch (error) {
    console.error('❌ Error en transacción:', error);
    throw error;
  }
};

// ============================================
// FUNCIÓN PARA VERIFICAR SI UNA TABLA EXISTE
// ============================================
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { error } = await pool
      .from(tableName)
      .select('*')
      .limit(0);
    
    // Si no hay error, la tabla existe
    return !error;
  } catch (error) {
    console.error(`❌ Error verificando tabla ${tableName}:`, error instanceof Error ? error.message : error);
    return false;
  }
};

// ============================================
// FUNCIÓN PARA VERIFICAR ESTRUCTURA DE BD
// ============================================
export const checkDatabaseStructure = async (): Promise<boolean> => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    const tables = ['usuarios', 'reportes', 'categorias_problemas', 'zonas_geograficas'];
    const tablesStatus: Record<string, boolean> = {};
    
    for (const table of tables) {
      tablesStatus[table] = await tableExists(table);
    }
    
    console.log('📋 Estado de las tablas:', tablesStatus);
    
    const allTablesExist = Object.values(tablesStatus).every(exists => exists);
    
    if (!allTablesExist) {
      console.log('⚠️ Algunas tablas no existen en Supabase.');
      console.log('💡 Ejecuta el script de migración en Supabase SQL Editor:');
      console.log('   SCRIPT_MIGRACION_SUPABASE_FINAL.sql');
    }
    
    return allTablesExist;
  } catch (error) {
    console.error('❌ Error verificando estructura de BD:', error instanceof Error ? error.message : error);
    return false;
  }
};

// ============================================
// FUNCIONES HELPER PARA OPERACIONES COMUNES
// ============================================

/**
 * Obtener datos de una tabla con filtros y ordenamiento
 */
export const getData = async <T = any>(
  table: string,
  options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
): Promise<{ data: T[] | null; error: any; count?: number }> => {
  try {
    let query = pool.from(table).select(options?.select || '*', { count: 'exact' });
    
    // Aplicar filtros
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    // Aplicar ordenamiento
    if (options?.order) {
      query = query.order(options.order.column, { 
        ascending: options.order.ascending ?? true 
      });
    }
    
    // Aplicar paginación
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error(`❌ Error obteniendo datos de ${table}:`, error);
      return { data: null, error };
    }
    
    return { data: data as T[], error: null, count: count || 0 };
  } catch (error) {
    console.error(`❌ Error en getData para ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Insertar datos en una tabla
 */
export const insertData = async <T = any>(
  table: string, 
  data: Partial<T> | Partial<T>[],
  returnData: boolean = true
): Promise<{ data: T[] | null; error: any }> => {
  try {
    const query = pool.from(table).insert(data);
    
    const { data: result, error } = returnData 
      ? await query.select()
      : await query;
    
    if (error) {
      console.error(`❌ Error insertando en ${table}:`, error);
      return { data: null, error };
    }
    
    console.log(`✅ Datos insertados en ${table}:`, Array.isArray(result) ? result.length : 1, 'registros');
    return { data: result as T[], error: null };
  } catch (error) {
    console.error(`❌ Error en insertData para ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Actualizar datos en una tabla
 */
export const updateData = async <T = any>(
  table: string,
  filter: Record<string, any>,
  updates: Partial<T>,
  returnData: boolean = true
): Promise<{ data: T[] | null; error: any }> => {
  try {
    let query = pool.from(table).update(updates);
    
    // Aplicar filtros
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = returnData 
      ? await query.select()
      : await query;
    
    if (error) {
      console.error(`❌ Error actualizando ${table}:`, error);
      return { data: null, error };
    }
    
    console.log(`✅ Datos actualizados en ${table}:`, Array.isArray(data) ? data.length : 0, 'registros');
    return { data: data as T[], error: null };
  } catch (error) {
    console.error(`❌ Error en updateData para ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Eliminar datos de una tabla
 */
export const deleteData = async (
  table: string, 
  filter: Record<string, any>
): Promise<{ error: any }> => {
  try {
    let query = pool.from(table).delete();
    
    // Aplicar filtros
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query;
    
    if (error) {
      console.error(`❌ Error eliminando de ${table}:`, error);
      return { error };
    }
    
    console.log(`✅ Datos eliminados de ${table}`);
    return { error: null };
  } catch (error) {
    console.error(`❌ Error en deleteData para ${table}:`, error);
    return { error };
  }
};

/**
 * Contar registros en una tabla
 */
export const countData = async (
  table: string,
  filter?: Record<string, any>
): Promise<{ count: number | null; error: any }> => {
  try {
    let query = pool.from(table).select('*', { count: 'exact', head: true });
    
    // Aplicar filtros
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error(`❌ Error contando registros de ${table}:`, error);
      return { count: null, error };
    }
    
    return { count, error: null };
  } catch (error) {
    console.error(`❌ Error en countData para ${table}:`, error);
    return { count: null, error };
  }
};

/**
 * Buscar registros con búsqueda de texto completo
 */
export const searchData = async <T = any>(
  table: string,
  column: string,
  searchTerm: string,
  options?: {
    select?: string;
    limit?: number;
  }
): Promise<{ data: T[] | null; error: any }> => {
  try {
    let query = pool
      .from(table)
      .select(options?.select || '*')
      .ilike(column, `%${searchTerm}%`);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ Error buscando en ${table}:`, error);
      return { data: null, error };
    }
    
    return { data: data as T[], error: null };
  } catch (error) {
    console.error(`❌ Error en searchData para ${table}:`, error);
    return { data: null, error };
  }
};

// ============================================
// VERIFICAR CONEXIÓN AL INICIAR
// ============================================
testConnection().then(connected => {
  if (connected) {
    console.log('✅ Aplicación conectada a Supabase');
  } else {
    console.error('❌ No se pudo conectar a Supabase');
    console.log('💡 Verifica las variables de entorno:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
});

// Exportar el cliente principal (compatibilidad con código anterior)
export default pool;
