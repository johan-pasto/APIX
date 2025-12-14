const jwt = require('jsonwebtoken');

const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      usuario: usuario.usuario,
      email: usuario.email,
      membresia: usuario.membresia
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const extraerToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

module.exports = {
  generarToken,
  verificarToken,
  extraerToken
};