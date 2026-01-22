const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const os = require('os');
require('dotenv').config();

const { pool, testConnection } = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const reportRoutes = require('./src/routes/reports');
const categoryRoutes = require('./src/routes/categories');
const zoneRoutes = require('./src/routes/zones');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARES DE SEGURIDAD
// ================================

// Helmet para headers de seguridad
app.use(helmet());

// Rate limiting - configuración más permisiva para desarrollo
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Límite de 100 requests por minuto por IP
  message: { success: false, message: 'Demasiadas peticiones, por favor intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configurado para desarrollo - permitir todos los orígenes para APK
app.use(cors({
  origin: '*', // Permitir todos los orígenes para desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para logs de requests
app.use((req, res, next) => {
  next();
});

// ================================
// RUTAS
// ================================

// Ruta de salud del servidor
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'Conectada' : 'Desconectada',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error del servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
});

// ================================
// MANEJO DE ERRORES
// ================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ================================
// INICIAR SERVIDOR
// ================================

const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Obtener IP local
    const getLocalIP = () => {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return 'localhost';
    };

    const localIP = getLocalIP();

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor iniciado en http://${localIP}:${PORT}`);
      console.log(`Base de datos: ${dbConnected ? 'Conectada' : 'Desconectada'}`);
    });

  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejar cierre del servidor
process.on('SIGTERM', () => {
  pool.end(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  pool.end(() => {
    process.exit(0);
  });
});

// Iniciar servidor
startServer();

module.exports = app;
