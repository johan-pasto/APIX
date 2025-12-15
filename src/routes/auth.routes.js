const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generarToken } = require('../utils/jwt');
const { validarLogin, validarRegistro } = require('../middleware/validate.middleware');

// POST /api/login - Iniciar sesión
router.post('/login', validarLogin, async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    // Buscar usuario por nombre de usuario
    const user = await User.findOne({ usuario: usuario.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Verificar contraseña
    const passwordValida = await user.compararPassword(password);
    
    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Actualizar último login
    user.ultimoLogin = new Date();
    await user.save();
    
    // Generar token JWT
    const token = generarToken(user);
    
    res.json({
      ok: true,
      message: 'Login exitoso',
      token,
      usuario: {
        id: user._id,
        nombre: user.nombre,
        usuario: user.usuario,
        email: user.email,
        membresia: user.membresia,
        ultimoLogin: user.ultimoLogin
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

router.post('/registro', validarRegistro, async (req, res) => {
  // AÑADE ESTAS LÍNEAS:
  console.log('🔵 [REGISTRO] Solicitud recibida en Vercel');
  console.log('🔵 [REGISTRO] Body recibido:', req.body);
  console.log('🔵 [REGISTRO] Valor de MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA');

  try {
    const { nombre, usuario, email, password, telefono } = req.body;
    // ... el resto de tu código original ...
  } catch (error) {
    console.error('🔴 [REGISTRO] Error completo:', error); // Agrega esto en el catch
    // ... manejo del error ...
  }
});

// POST /api/registro - Registrarse
router.post('/registro', validarRegistro, async (req, res) => {
  try {
    const { nombre, usuario, email, password, telefono } = req.body;
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({
      $or: [
        { usuario: usuario.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (usuarioExistente) {
      return res.status(400).json({
        ok: false,
        message: 'El usuario o email ya están registrados'
      });
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = new User({
      nombre,
      usuario: usuario.toLowerCase(),
      email: email.toLowerCase(),
      password,
      telefono: telefono || ''
    });
    
    await nuevoUsuario.save();
    
    // Generar token JWT
    const token = generarToken(nuevoUsuario);
    
    res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        usuario: nuevoUsuario.usuario,
        email: nuevoUsuario.email,
        membresia: nuevoUsuario.membresia
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        message: 'El usuario o email ya están registrados'
      });
    }
    
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

// GET /api/perfil - Obtener perfil (requiere autenticación)
router.get('/perfil', require('../middleware/auth.middleware'), async (req, res) => {
  try {
    res.json({
      ok: true,
      usuario: req.usuario
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

module.exports = router;