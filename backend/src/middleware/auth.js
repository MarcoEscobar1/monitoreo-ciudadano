const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key_development', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'secret_key_development', (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.tipo_usuario !== 'ADMINISTRADOR' && req.user.tipo_usuario !== 'MODERADOR') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden acceder a este recurso'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authMiddleware: authenticateToken,
  optionalAuth,
  adminMiddleware
};
