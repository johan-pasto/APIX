// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tweet = require('../models/Tweet');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   GET /api/users/:userId
 * @desc    Obtener información de un usuario por ID
 * @access  Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -__v -createdAt -updatedAt'); // Excluir datos sensibles
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      usuario: user
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener usuario'
    });
  }
});

/**
 * @route   GET /api/users/:userId/tweets
 * @desc    Obtener todos los tweets de un usuario específico
 * @access  Public
 */
router.get('/:userId/tweets', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar si el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener tweets del usuario
    const tweets = await Tweet.find({ usuario: userId })
      .populate('usuario', 'nombre username avatar')
      .populate('comentarios.usuario', 'nombre username avatar')
      .sort({ fecha: -1 });
    
    res.json({
      ok: true,
      tweets,
      count: tweets.length
    });
  } catch (error) {
    console.error('Error obteniendo tweets del usuario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener tweets del usuario'
    });
  }
});

/**
 * @route   PUT /api/users/:userId
 * @desc    Actualizar perfil de usuario
 * @access  Private (solo el propio usuario)
 */

router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.user.id) {
      return res.status(403).json({
        ok: false,
        message: 'No autorizado para actualizar este perfil'
      });
    }
    
    const { 
      nombre, 
      telefono, 
      avatar_url, 
      bio, 
      ubicacion, 
      sitio_web 
    } = req.body;
    
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (sitio_web !== undefined) updateData.sitio_web = sitio_web;
    
    const usuarioActualizado = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');
    
    res.json({
      ok: true,
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar perfil'
    });
  }
});

/**
 * @route   GET /api/users/:userId/seguidores
 * @desc    Obtener seguidores de un usuario
 * @access  Public
 */
router.get('/:userId/seguidores', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('seguidores', 'nombre username avatar')
      .select('seguidores');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      seguidores: user.seguidores || [],
      count: user.seguidores ? user.seguidores.length : 0
    });
  } catch (error) {
    console.error('Error obteniendo seguidores:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener seguidores'
    });
  }
});

/**
 * @route   GET /api/users/:userId/siguiendo
 * @desc    Obtener usuarios que sigue un usuario
 * @access  Public
 */
router.get('/:userId/siguiendo', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('siguiendo', 'nombre username avatar')
      .select('siguiendo');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      ok: true,
      siguiendo: user.siguiendo || [],
      count: user.siguiendo ? user.siguiendo.length : 0
    });
  } catch (error) {
    console.error('Error obteniendo usuarios seguidos:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener usuarios seguidos'
    });
  }
});

module.exports = router;