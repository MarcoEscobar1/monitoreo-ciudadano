const { Pool } = require('pg');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'monitoreo_ciudadano',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Configuración para UTF-8
  client_encoding: 'UTF8'
};

// Pool de conexiones
const pool = new Pool(dbConfig);

// Eventos del pool
pool.on('connect', () => {
});

pool.on('error', (err) => {
  console.error('Error en el pool de PostgreSQL:', err);
});

// Función para testear la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), current_database(), current_user');
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

// Función para ejecutar consultas
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error en query:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

// Función para transacciones
const transaction = async (callback) => {
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

// Función para verificar si una tabla existe
const tableExists = async (tableName) => {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'monitoreo_ciudadano' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error verificando tabla ${tableName}:`, error.message);
    return false;
  }
};

// Función para verificar estructura de la base de datos
const checkDatabaseStructure = async () => {
  try {
    const tables = ['usuarios', 'reportes', 'categorias_problemas', 'zonas_geograficas'];
    const tablesStatus = {};
    
    for (const table of tables) {
      tablesStatus[table] = await tableExists(table);
    }
    
    const allTablesExist = Object.values(tablesStatus).every(exists => exists);
    return allTablesExist;
  } catch (error) {
    console.error('Error verificando estructura de BD:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  checkDatabaseStructure
};
