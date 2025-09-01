const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// ================================
// REGISTRO DE USUARIO
// ================================

router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM monitoreo_ciudadano.usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const result = await query(`
      INSERT INTO monitoreo_ciudadano.usuarios 
      (nombre, email, telefono, password_hash, tipo_usuario, email_verificado, metodo_auth)
      VALUES ($1, $2, $3, $4, 'CIUDADANO', true, 'EMAIL')
      RETURNING id, nombre, email, telefono, fecha_registro, activo
    `, [nombre, email.toLowerCase(), telefono || null, passwordHash]);

    const user = result.rows[0];

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key_development',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          fecha_registro: user.fecha_registro,
          activo: user.activo,
          role: 'user'
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// LOGIN DE USUARIO
// ================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const result = await query(`
      SELECT id, nombre, email, telefono, password_hash, fecha_registro, activo, tipo_usuario
      FROM monitoreo_ciudadano.usuarios 
      WHERE email = $1 AND activo = true
    `, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key_development',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          fecha_registro: user.fecha_registro,
          activo: user.activo,
          role: user.tipo_usuario?.toLowerCase() || 'user'
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// VERIFICAR TOKEN
// ================================

router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_development');

    // Buscar usuario actual
    const result = await query(`
      SELECT id, nombre, email, telefono, fecha_registro, activo, tipo_usuario
      FROM monitoreo_ciudadano.usuarios 
      WHERE id = $1 AND activo = true
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          fecha_registro: user.fecha_registro,
          activo: user.activo,
          role: user.tipo_usuario?.toLowerCase() || 'user'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ================================
// RECUPERAR CONTRASEÑA
// ================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validar email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Verificar si el usuario existe
    const result = await query(
      'SELECT id FROM monitoreo_ciudadano.usuarios WHERE email = $1 AND activo = true',
      [email.toLowerCase()]
    );

    // Respuesta genérica por seguridad (no revelar si el email existe)
    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
    });

    // En una implementación real, aquí enviarías un email con un token de recuperación

  } catch (error) {
    console.error('❌ Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ================================
// LOGOUT
// ================================

router.post('/logout', async (req, res) => {
  try {
    // En una implementación completa, aquí podrías:
    // 1. Invalidar el token en una blacklist
    // 2. Limpiar sesiones activas
    // 3. Registrar el logout en logs de auditoría
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
