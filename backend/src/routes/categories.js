const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// ================================
// OBTENER TODAS LAS CATEGORÍAS
// ================================

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        nombre,
        descripcion,
        icono,
        color,
        activo,
        orden_visualizacion as orden
      FROM monitoreo_ciudadano.categorias_problemas
      WHERE activo = true
      ORDER BY orden_visualizacion ASC, nombre ASC
    `);

    const categorias = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      icono: row.icono,
      color: row.color,
      activa: row.activo,
      orden: row.orden
    }));

    res.json({
      success: true,
      data: categorias
    });

  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// OBTENER CATEGORÍA POR ID
// ================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si es un UUID válido o un orden numérico
    let query_text;
    let query_param;
    
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      // Es un UUID válido
      query_text = `
        SELECT 
          id,
          nombre,
          descripcion,
          icono,
          color,
          activo,
          orden_visualizacion as orden
        FROM monitoreo_ciudadano.categorias_problemas
        WHERE id = $1 AND activo = true
      `;
      query_param = id;
    } else if (/^\d+$/.test(id)) {
      // Es un número (orden)
      query_text = `
        SELECT 
          id,
          nombre,
          descripcion,
          icono,
          color,
          activo,
          orden_visualizacion as orden
        FROM monitoreo_ciudadano.categorias_problemas
        WHERE orden_visualizacion = $1 AND activo = true
      `;
      query_param = parseInt(id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría inválido'
      });
    }

    const result = await query(query_text, [query_param]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const row = result.rows[0];
    const categoria = {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      icono: row.icono,
      color: row.color,
      activa: row.activo,
      orden: row.orden
    };

    res.json({
      success: true,
      data: categoria
    });

  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
