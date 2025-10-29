import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const proteger = async (req, res, next) => {
  let token;

  // Verificar si el token existe en los headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin password)
      req.usuario = await User.findById(decoded.id).select('-password');

      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token inválido'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, no hay token'
    });
  }
};

// Middleware para verificar roles
export const autorizarRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.usuario.rol} no tiene permiso para acceder a esta ruta`
      });
    }
    next();
  };
};
