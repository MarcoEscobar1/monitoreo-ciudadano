const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// ================================
// OBTENER TODAS LAS ZONAS
// ================================

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        nombre,
        tipo,
        activo,
        poblacion,
        area_km2
      FROM monitoreo_ciudadano.zonas_geograficas
      WHERE activo = true
      ORDER BY nombre ASC
    `);

    const zonas = result.rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      activa: row.activo,
      poblacion: row.poblacion,
      area_km2: row.area_km2,
      coordenadas: [] // En una implementación completa, cargarías las coordenadas del polígono
    }));

    res.json({
      success: true,
      data: zonas
    });

  } catch (error) {
    console.error('❌ Error obteniendo zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
