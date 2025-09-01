import { Pool, PoolConfig } from 'pg';

// Configuración de la base de datos
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'appmovil',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // Tiempo de espera para conectar
};

// Pool de conexiones
const pool = new Pool(dbConfig);

// Manejar eventos del pool
pool.on('connect', () => {
  console.log('✅ Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en el pool de PostgreSQL:', err);
});

// Función para testear la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    return false;
  }
};

// Función para ejecutar consultas
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutada:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Error en query:', { text, error });
    throw error;
  }
};

// Función para transacciones
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
