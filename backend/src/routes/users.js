const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ================================
// OBTENER PERFIL DE USUARIO
// ================================

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.fecha_registro,
        u.activo,
        u.tipo_usuario,
        COUNT(r.id) as total_reportes,
        COUNT(CASE WHEN r.estado = 'RESUELTO' THEN 1 END) as reportes_resueltos
      FROM monitoreo_ciudadano.usuarios u
      LEFT JOIN monitoreo_ciudadano.reportes r ON u.id = r.usuario_id
      WHERE u.id = $1 AND u.activo = true
      GROUP BY u.id, u.nombre, u.email, u.telefono, u.fecha_registro, u.activo, u.tipo_usuario
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const row = result.rows[0];
    const usuario = {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      fecha_registro: row.fecha_registro,
      activo: row.activo,
      role: row.tipo_usuario?.toLowerCase() || 'user',
      configuracion_notificaciones: {
        push_reportes_cercanos: true,
        push_actualizaciones: true,
        push_emergencias: true,
        email_resumen_semanal: false
      },
      total_reportes: parseInt(row.total_reportes) || 0,
      reportes_validados: parseInt(row.reportes_resueltos) || 0
    };

    res.json({
      success: true,
      data: usuario
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// OBTENER REPORTES DEL USUARIO
// ================================

router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limite = 20, pagina = 1 } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const result = await query(`
      SELECT 
        r.id,
        r.titulo,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.fecha_creacion,
        r.fecha_actualizacion,
        ST_X(r.ubicacion) as longitude,
        ST_Y(r.ubicacion) as latitude,
        r.direccion,
        r.votos_positivos as likes,
        r.votos_negativos as dislikes,
        cp.nombre as categoria_nombre,
        cp.icono as categoria_icono,
        cp.color as categoria_color,
        (SELECT COUNT(*) FROM monitoreo_ciudadano.comentarios c WHERE c.reporte_id = r.id) as comentarios_count
      FROM monitoreo_ciudadano.reportes r
      LEFT JOIN monitoreo_ciudadano.categorias_problemas cp ON r.categoria_id = cp.id
      WHERE r.usuario_id = $1 AND r.activo = true
      ORDER BY r.fecha_creacion DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limite), offset]);

    const reportes = result.rows.map(row => ({
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado: row.estado,
      prioridad: row.prioridad,
      fecha_creacion: row.fecha_creacion,
      fecha_actualizacion: row.fecha_actualizacion,
      ubicacion: {
        latitude: row.latitude,
        longitude: row.longitude
      },
      direccion: row.direccion,
      likes: row.likes || 0,
      dislikes: row.dislikes || 0,
      validaciones: 0,
      comentarios_count: parseInt(row.comentarios_count) || 0,
      categoria: {
        nombre: row.categoria_nombre,
        icono: row.categoria_icono,
        color: row.categoria_color
      }
    }));

    // Contar total
    const countResult = await query(
      'SELECT COUNT(*) as total FROM monitoreo_ciudadano.reportes WHERE usuario_id = $1 AND activo = true',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: reportes,
      pagination: {
        page: parseInt(pagina),
        limit: parseInt(limite),
        total,
        totalPages: Math.ceil(total / parseInt(limite)),
        hasNext: offset + parseInt(limite) < total,
        hasPrev: parseInt(pagina) > 1
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reportes del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// ACTUALIZAR PERFIL
// ================================

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nombre, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    await query(`
      UPDATE monitoreo_ciudadano.usuarios 
      SET nombre = $1, telefono = $2, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [nombre, telefono || null, userId]);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
