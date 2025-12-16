const { verificarToken, extraerToken } = require('../utils/jwt');
const User = require('../models/User');

const autenticar = async (req, res, next) => {
  try {
    const token = extraerToken(req);
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        message: 'Acceso no autorizado. Token requerido.'
      });
    }
    
    const decoded = verificarToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        ok: false,
        message: 'Token inválido o expirado.'
      });
    }
    
    const usuario = await User.findById(decoded.id).select('-password');
    
    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        ok: false,
        message: 'Usuario no encontrado o inactivo.'
      });
    }
    
    req.user = usuario;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error en la autenticación.'
    });
  }
};

module.exports = autenticar;