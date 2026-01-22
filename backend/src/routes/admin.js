const express = require('express');
const { query } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authMiddleware);
router.use(adminMiddleware);

// ================================
// GESTIÓN DE REPORTES
// ================================

// Obtener todos los reportes pendientes de validación
router.get('/reports/pending', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id, r.titulo, r.descripcion, r.estado, r.prioridad,
        r.validado, r.fecha_creacion, r.imagen_principal,
        ST_X(r.ubicacion) as longitud,
        ST_Y(r.ubicacion) as latitud,
        r.direccion,
        u.nombre, u.apellidos, u.email as usuario_email,
        c.nombre as categoria_nombre
      FROM monitoreo_ciudadano.reportes r
      JOIN monitoreo_ciudadano.usuarios u ON r.usuario_id = u.id
      JOIN monitoreo_ciudadano.categorias_problemas c ON r.categoria_id = c.id
      WHERE (r.validado = FALSE OR r.validado IS NULL) AND r.estado = 'PENDIENTE'
      ORDER BY r.fecha_creacion DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error obteniendo reportes pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de reportes
router.get('/reports/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE (validado = FALSE OR validado IS NULL) AND estado = 'PENDIENTE') as pendientes_validacion,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'EN_REVISION') as en_revision,
        COUNT(*) FILTER (WHERE estado = 'EN_PROCESO') as en_proceso,
        COUNT(*) FILTER (WHERE estado = 'RESUELTO') as resueltos,
        COUNT(*) FILTER (WHERE estado = 'RECHAZADO') as rechazados,
        COUNT(*) FILTER (WHERE fecha_creacion >= NOW() - INTERVAL '24 hours') as ultimas_24h,
        COUNT(*) FILTER (WHERE fecha_creacion >= NOW() - INTERVAL '7 days') as ultima_semana
      FROM monitoreo_ciudadano.reportes
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Validar un reporte (aprobar)
router.post('/reports/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;
    const adminId = req.user.userId;

    const result = await query(`
      UPDATE monitoreo_ciudadano.reportes
      SET 
        validado = TRUE,
        validado_por = $1,
        fecha_validacion = NOW(),
        comentarios_validacion = $2,
        estado = 'EN_REVISION',
        visible_publicamente = TRUE
      WHERE id = $3
      RETURNING id, titulo, usuario_id
    `, [adminId, comentarios || 'Reporte validado', id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Reporte validado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error validando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Rechazar un reporte
router.post('/reports/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const adminId = req.user.userId;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es requerido'
      });
    }

    const result = await query(`
      UPDATE monitoreo_ciudadano.reportes
      SET 
        estado = 'RECHAZADO',
        validado = FALSE,
        validado_por = $1,
        fecha_validacion = NOW(),
        comentarios_validacion = $2,
        visible_publicamente = FALSE
      WHERE id = $3
      RETURNING id, titulo, usuario_id
    `, [adminId, motivo, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Reporte rechazado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error rechazando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cambiar estado de un reporte
router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentarios } = req.body;

    const validStates = ['PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const result = await query(`
      UPDATE monitoreo_ciudadano.reportes
      SET 
        estado = $1,
        comentarios_validacion = COALESCE($2, comentarios_validacion),
        fecha_actualizacion = NOW(),
        fecha_resolucion = CASE WHEN $1 = 'RESUELTO' THEN NOW() ELSE fecha_resolucion END
      WHERE id = $3
      RETURNING id, titulo, estado
    `, [estado, comentarios, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// GESTIÓN DE USUARIOS
// ================================

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo = null } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        id, nombre, apellidos, email, telefono, tipo_usuario,
        activo, email_verificado, fecha_registro, fecha_ultimo_acceso,
        (SELECT COUNT(*) FROM monitoreo_ciudadano.reportes WHERE usuario_id = u.id) as total_reportes
      FROM monitoreo_ciudadano.usuarios u
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      params.push(tipo);
      queryText += ` AND tipo_usuario = $${params.length}`;
    }

    queryText += ` ORDER BY fecha_registro DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) FROM monitoreo_ciudadano.usuarios
      WHERE tipo_usuario = COALESCE($1, tipo_usuario)
    `, [tipo]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cambiar estado de un usuario
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const result = await query(`
      UPDATE monitoreo_ciudadano.usuarios
      SET activo = $1
      WHERE id = $2
      RETURNING id, nombre, apellidos, email, activo
    `, [activo, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// GESTIÓN DE CATEGORÍAS
// ================================

// Obtener todas las categorías
router.get('/categories', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM monitoreo_ciudadano.reportes WHERE categoria_id = c.id) as total_reportes,
        (SELECT COUNT(*) FROM monitoreo_ciudadano.reportes WHERE categoria_id = c.id AND validado = TRUE) as reportes_validados
      FROM monitoreo_ciudadano.categorias_problemas c
      ORDER BY nombre
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva categoría
router.post('/categories', async (req, res) => {
  try {
    const { nombre, descripcion, tipo_problema, prioridad_base } = req.body;

    if (!nombre || !tipo_problema) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo de problema son requeridos'
      });
    }

    const result = await query(`
      INSERT INTO monitoreo_ciudadano.categorias_problemas 
      (nombre, descripcion, tipo_problema, prioridad_base)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nombre, descripcion, tipo_problema, prioridad_base || 'MEDIA']);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar categoría
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, prioridad_base, activo } = req.body;

    const result = await query(`
      UPDATE monitoreo_ciudadano.categorias_problemas
      SET 
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        prioridad_base = COALESCE($3, prioridad_base),
        activo = COALESCE($4, activo)
      WHERE id = $5
      RETURNING *
    `, [nombre, descripcion, prioridad_base, activo, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría actualizada',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reportes por categoría
router.get('/reports/by-category', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, c.nombre,
        COUNT(r.id) as total_reportes,
        COUNT(r.id) FILTER (WHERE r.validado = TRUE) as reportes_validados,
        COUNT(r.id) FILTER (WHERE r.estado = 'RESUELTO') as reportes_resueltos,
        COUNT(r.id) FILTER (WHERE r.fecha_creacion >= NOW() - INTERVAL '30 days') as reportes_ultimo_mes
      FROM monitoreo_ciudadano.categorias_problemas c
      LEFT JOIN monitoreo_ciudadano.reportes r ON c.id = r.categoria_id
      WHERE c.activo = TRUE
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre, COUNT(r.id) DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo reportes por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// GESTIÓN DE USUARIOS PENDIENTES
// ================================

// Obtener usuarios pendientes de validación
router.get('/users/pending', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, nombre, apellidos, email, telefono,
        fecha_registro, metodo_auth
      FROM monitoreo_ciudadano.usuarios
      WHERE cuenta_validada = FALSE 
        AND tipo_usuario = 'CIUDADANO'
        AND activo = TRUE
      ORDER BY fecha_registro DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Validar una cuenta de usuario (aprobar)
router.post('/users/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;
    const adminId = req.user.userId;

    const result = await query(`
      UPDATE monitoreo_ciudadano.usuarios
      SET 
        cuenta_validada = TRUE,
        validada_por = $1,
        fecha_validacion = NOW(),
        comentarios_validacion = $2
      WHERE id = $3 AND tipo_usuario = 'CIUDADANO'
      RETURNING id, nombre, apellidos, email
    `, [adminId, comentarios || 'Cuenta validada', id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cuenta validada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error validando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Rechazar una cuenta de usuario
router.post('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const adminId = req.user.userId;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es requerido'
      });
    }

    // Marcar como inactiva y agregar comentarios
    const result = await query(`
      UPDATE monitoreo_ciudadano.usuarios
      SET 
        activo = FALSE,
        cuenta_validada = FALSE,
        validada_por = $1,
        fecha_validacion = NOW(),
        comentarios_validacion = $2
      WHERE id = $3 AND tipo_usuario = 'CIUDADANO'
      RETURNING id, nombre, apellidos, email
    `, [adminId, `RECHAZADA: ${motivo}`, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cuenta rechazada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error rechazando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
