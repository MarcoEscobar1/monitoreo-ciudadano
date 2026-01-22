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
    const { limite = 50, pagina = 1 } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Obtener reportes del usuario con información de validación
    const result = await query(`
      SELECT 
        r.id,
        r.titulo,
        r.validado,
        r.validado_por,
        r.comentarios_validacion,
        r.estado,
        r.fecha_creacion,
        r.fecha_actualizacion,
        c.nombre as categoria_nombre
      FROM monitoreo_ciudadano.reportes r
      LEFT JOIN monitoreo_ciudadano.categorias_problemas c ON r.categoria_id = c.id
      WHERE r.usuario_id = $1
      ORDER BY r.fecha_actualizacion DESC, r.fecha_creacion DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limite), offset]);

    // Transformar reportes en notificaciones
    const notificaciones = result.rows.map((reporte, index) => {
      let tipo, titulo, mensaje, iconEmoji;
      
      // Determinar el tipo de notificación según el estado del reporte
      // LÓGICA CORREGIDA:
      // - validado === true → Aceptado
      // - validado === false Y tiene validado_por (fue procesado por admin) → Rechazado
      // - validado === false/NULL sin validado_por → Pendiente (aún no revisado)
      
      if (reporte.validado === true) {
        tipo = 'accepted';
        titulo = 'Reporte aceptado';
        mensaje = `Tu reporte "${reporte.titulo}" ha sido aceptado y ya aparece en el mapa`;
        iconEmoji = '✅';
      } else if (reporte.validado === false && reporte.validado_por) {
        // Fue explícitamente rechazado por un admin
        tipo = 'rejected';
        titulo = 'Reporte rechazado';
        mensaje = `Tu reporte "${reporte.titulo}" fue rechazado por el administrador`;
        if (reporte.comentarios_validacion) {
          mensaje += `. Motivo: ${reporte.comentarios_validacion}`;
        }
        iconEmoji = '❌';
      } else {
        // Pendiente de revisión (validado = false/NULL sin admin que lo haya revisado)
        tipo = 'pending';
        titulo = 'Reporte en revisión';
        mensaje = `Tu reporte "${reporte.titulo}" está siendo revisado por el administrador`;
        iconEmoji = '⏳';
      }

      return {
        id: `notif-${reporte.id}`,
        reporte_id: reporte.id,
        titulo,
        mensaje,
        tipo,
        timestamp: reporte.fecha_actualizacion || reporte.fecha_creacion,
        read: false, // Por defecto no leído, se controlará desde el frontend
        iconEmoji,
        reportTitle: reporte.titulo
      };
    });

    // Contar total de reportes
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM monitoreo_ciudadano.reportes
      WHERE usuario_id = $1
    `, [userId]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / parseInt(limite));

    res.json({
      success: true,
      data: notificaciones,
      pagination: {
        page: parseInt(pagina),
        limit: parseInt(limite),
        total,
        totalPages,
        hasNext: parseInt(pagina) < totalPages,
        hasPrev: parseInt(pagina) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
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
    console.error('Error marcando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
