const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ================================
// OBTENER TODOS LOS REPORTES
// ================================

router.get('/', async (req, res) => {
  try {
    const {
      categoria_id,
      estado,
      prioridad,
      zona_id,
      limite = 50,
      pagina = 1,
      lat,
      lng,
      radio = 5
    } = req.query;

    let whereConditions = ['r.activo = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Filtros opcionales
    if (categoria_id) {
      whereConditions.push(`r.categoria_id = $${paramIndex}`);
      queryParams.push(categoria_id);
      paramIndex++;
    }

    if (estado) {
      whereConditions.push(`r.estado = $${paramIndex}`);
      queryParams.push(estado.toUpperCase());
      paramIndex++;
    }

    if (prioridad) {
      whereConditions.push(`r.prioridad = $${paramIndex}`);
      queryParams.push(prioridad.toUpperCase());
      paramIndex++;
    }

    if (zona_id) {
      whereConditions.push(`r.zona_geografica_id = $${paramIndex}`);
      queryParams.push(zona_id);
      paramIndex++;
    }

    // Filtro por proximidad geográfica
    let distanceSelect = '';
    if (lat && lng) {
      distanceSelect = `, ST_Distance(
        ST_Transform(r.ubicacion, 3857),
        ST_Transform(ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326), 3857)
      ) / 1000 as distancia_km`;
      
      whereConditions.push(`ST_DWithin(
        ST_Transform(r.ubicacion, 3857),
        ST_Transform(ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326), 3857),
        $${paramIndex + 2} * 1000
      )`);
      
      queryParams.push(parseFloat(lng), parseFloat(lat), parseFloat(radio));
      paramIndex += 3;
    }

    // Paginación
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limite), offset);

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const queryText = `
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
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        cp.id as categoria_id,
        cp.nombre as categoria_nombre,
        cp.icono as categoria_icono,
        cp.color as categoria_color,
        zg.id as zona_id,
        zg.nombre as zona_nombre,
        (SELECT COUNT(*) FROM monitoreo_ciudadano.comentarios c WHERE c.reporte_id = r.id) as comentarios_count,
        COALESCE(
          (SELECT json_agg(img.url) 
           FROM monitoreo_ciudadano.imagenes_reporte img 
           WHERE img.reporte_id = r.id), 
          '[]'::json
        ) as imagenes
        ${distanceSelect}
      FROM monitoreo_ciudadano.reportes r
      LEFT JOIN monitoreo_ciudadano.usuarios u ON r.usuario_id = u.id
      LEFT JOIN monitoreo_ciudadano.categorias_problemas cp ON r.categoria_id = cp.id
      LEFT JOIN monitoreo_ciudadano.zonas_geograficas zg ON r.zona_geografica_id = zg.id
      ${whereClause}
      ORDER BY 
        ${lat && lng ? 'distancia_km ASC,' : ''}
        r.fecha_creacion DESC
      ${limitClause}
    `;

    const result = await query(queryText, queryParams);

    // Contar total de registros para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM monitoreo_ciudadano.reportes r
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Excluir LIMIT y OFFSET
    const total = parseInt(countResult.rows[0].total);

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
      usuario: {
        id: row.usuario_id,
        nombre: row.usuario_nombre
      },
      categoria: {
        id: row.categoria_id,
        nombre: row.categoria_nombre,
        icono: row.categoria_icono,
        color: row.categoria_color,
        activa: true,
        orden: 1
      },
      zona: {
        id: row.zona_id,
        nombre: row.zona_nombre,
        tipo: 'barrio',
        coordenadas: [],
        activa: true
      },
      imagenes: row.imagenes || [],
      ...(row.distancia_km && { distancia_km: parseFloat(row.distancia_km).toFixed(2) })
    }));

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
    console.error('❌ Error obteniendo reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// OBTENER REPORTE POR ID
// ================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        cp.id as categoria_id,
        cp.nombre as categoria_nombre,
        cp.icono as categoria_icono,
        cp.color as categoria_color,
        zg.id as zona_id,
        zg.nombre as zona_nombre,
        COALESCE(
          (SELECT json_agg(img.url) 
           FROM monitoreo_ciudadano.imagenes_reporte img 
           WHERE img.reporte_id = r.id), 
          '[]'::json
        ) as imagenes
      FROM monitoreo_ciudadano.reportes r
      LEFT JOIN monitoreo_ciudadano.usuarios u ON r.usuario_id = u.id
      LEFT JOIN monitoreo_ciudadano.categorias_problemas cp ON r.categoria_id = cp.id
      LEFT JOIN monitoreo_ciudadano.zonas_geograficas zg ON r.zona_geografica_id = zg.id
      WHERE r.id = $1 AND r.activo = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    const row = result.rows[0];
    const reporte = {
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
      comentarios_count: 0,
      usuario: {
        id: row.usuario_id,
        nombre: row.usuario_nombre
      },
      categoria: {
        id: row.categoria_id,
        nombre: row.categoria_nombre,
        icono: row.categoria_icono,
        color: row.categoria_color,
        activa: true,
        orden: 1
      },
      zona: {
        id: row.zona_id,
        nombre: row.zona_nombre,
        tipo: 'barrio',
        coordenadas: [],
        activa: true
      },
      imagenes: row.imagenes || []
    };

    res.json({
      success: true,
      data: reporte
    });

  } catch (error) {
    console.error('❌ Error obteniendo reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// CREAR NUEVO REPORTE
// ================================

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      categoria_id,
      ubicacion,
      direccion,
      prioridad = 'MEDIA',
      imagenes = []
    } = req.body;

    const userId = req.user.userId;

    // Validaciones
    if (!titulo || !descripcion || !categoria_id || !ubicacion) {
      return res.status(400).json({
        success: false,
        message: 'Título, descripción, categoría y ubicación son requeridos'
      });
    }

    if (!ubicacion.latitude || !ubicacion.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Coordenadas de ubicación son requeridas'
      });
    }

    const nuevoReporte = await transaction(async (client) => {
      // Obtener zona geográfica basada en ubicación
      const zonaResult = await client.query(`
        SELECT monitoreo_ciudadano.obtener_zona_por_ubicacion($1, $2)
      `, [ubicacion.latitude, ubicacion.longitude]);
      
      const zonaId = zonaResult.rows[0]?.obtener_zona_por_ubicacion;

      // Crear el reporte
      const reporteResult = await client.query(`
        INSERT INTO monitoreo_ciudadano.reportes (
          usuario_id, categoria_id, zona_geografica_id, titulo, descripcion,
          ubicacion, direccion, estado, prioridad, validado
        ) VALUES ($1, $2, $3, $4, $5, 
          ST_SetSRID(ST_MakePoint($6, $7), 4326),
          $8, 'PENDIENTE', $9, false
        )
        RETURNING id, fecha_creacion
      `, [
        userId,
        categoria_id,
        zonaId,
        titulo,
        descripcion,
        ubicacion.longitude,
        ubicacion.latitude,
        direccion || '',
        prioridad.toUpperCase()
      ]);

      const reporteId = reporteResult.rows[0].id;

      // Guardar imágenes si existen
      if (imagenes && imagenes.length > 0) {
        for (const imagenUrl of imagenes) {
          await client.query(`
            INSERT INTO monitoreo_ciudadano.imagenes_reporte (reporte_id, url, tipo)
            VALUES ($1, $2, 'PRINCIPAL')
          `, [reporteId, imagenUrl]);
        }
      }

      return reporteId;
    });

    // Obtener el reporte completo creado
    const reporteCompleto = await query(`
      SELECT 
        r.id,
        r.titulo,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.fecha_creacion,
        ST_X(r.ubicacion) as longitude,
        ST_Y(r.ubicacion) as latitude,
        r.direccion,
        u.nombre as usuario_nombre,
        cp.nombre as categoria_nombre,
        cp.icono as categoria_icono,
        cp.color as categoria_color
      FROM monitoreo_ciudadano.reportes r
      LEFT JOIN monitoreo_ciudadano.usuarios u ON r.usuario_id = u.id
      LEFT JOIN monitoreo_ciudadano.categorias_problemas cp ON r.categoria_id = cp.id
      WHERE r.id = $1
    `, [nuevoReporte]);

    const row = reporteCompleto.rows[0];

    res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente',
      data: {
        id: row.id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        estado: row.estado,
        prioridad: row.prioridad,
        fecha_creacion: row.fecha_creacion,
        ubicacion: {
          latitude: row.latitude,
          longitude: row.longitude
        },
        direccion: row.direccion,
        usuario: {
          nombre: row.usuario_nombre
        },
        categoria: {
          nombre: row.categoria_nombre,
          icono: row.categoria_icono,
          color: row.categoria_color
        },
        imagenes
      }
    });

  } catch (error) {
    console.error('❌ Error creando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// ACTUALIZAR ESTADO DE REPORTE
// ================================

router.patch('/:id/estado', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const userId = req.user.userId;

    const validStates = ['PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'];
    
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Verificar que el usuario sea el propietario del reporte o admin
    const reporteResult = await query(`
      SELECT usuario_id FROM monitoreo_ciudadano.reportes 
      WHERE id = $1 AND activo = true
    `, [id]);

    if (reporteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Por ahora permitir solo al propietario (en producción, admins también podrían)
    if (reporteResult.rows[0].usuario_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este reporte'
      });
    }

    // Actualizar estado
    await query(`
      UPDATE monitoreo_ciudadano.reportes 
      SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [estado, id]);

    res.json({
      success: true,
      message: 'Estado del reporte actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando estado del reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
