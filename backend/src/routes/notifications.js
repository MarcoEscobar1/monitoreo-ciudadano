const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ================================
// OBTENER NOTIFICACIONES DEL USUARIO
// ================================

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limite = 20, pagina = 1 } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Por ahora retornamos notificaciones simuladas hasta implementar la tabla
    const notificaciones = [
      {
        id: 1,
        titulo: 'Bienvenido a Monitoreo Ciudadano',
        mensaje: 'Tu cuenta ha sido creada exitosamente. Comienza a reportar problemas en tu comunidad.',
        tipo: 'sistema',
        leida: false,
        fecha_creacion: new Date()
      }
    ];

    res.json({
      success: true,
      data: notificaciones,
      pagination: {
        page: parseInt(pagina),
        limit: parseInt(limite),
        total: notificaciones.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// MARCAR NOTIFICACIÓN COMO LEÍDA
// ================================

router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    // Por ahora simulamos respuesta exitosa
    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('❌ Error marcando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
