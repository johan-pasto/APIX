// routes/tweet.js - VERSIÓN COMPLETA
const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/tweets - Obtener todos los tweets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .populate('usuario', 'nombre usuario email')
      .populate('comentarios.usuario', 'nombre usuario')
      .populate('likes', 'nombre usuario')  // También popula likes
      .sort({ fecha: -1 });
    
    res.json({
      ok: true,
      tweets
    });
  } catch (error) {
    console.error('Error obteniendo tweets:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/tweets - Crear nuevo tweet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contenido } = req.body;
    
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        ok: false,
        message: 'El contenido es requerido'
      });
    }
    
    const nuevoTweet = new Tweet({
      contenido: contenido.trim(),
      usuario: req.usuario.id
    });
    
    await nuevoTweet.save();
    
    const tweetPopulado = await Tweet.findById(nuevoTweet._id)
      .populate('usuario', 'nombre usuario email');
    
    res.status(201).json({
      ok: true,
      tweet: tweetPopulado,
      message: 'Tweet creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando tweet:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ POST /api/tweets/:id/like - Dar/quitar like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    const tweet = await Tweet.findById(id);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Verificar si ya dio like
    const likeIndex = tweet.likes.indexOf(usuarioId);
    
    if (likeIndex === -1) {
      // Dar like
      tweet.likes.push(usuarioId);
    } else {
      // Quitar like
      tweet.likes.splice(likeIndex, 1);
    }
    
    await tweet.save();
    
    res.json({
      ok: true,
      message: likeIndex === -1 ? 'Like agregado' : 'Like removido',
      likes: tweet.likes.length,
      liked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error en like:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ DELETE /api/tweets/:id - Eliminar tweet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    const tweet = await Tweet.findById(id);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Verificar que el usuario es el dueño
    if (tweet.usuario.toString() !== usuarioId) {
      return res.status(403).json({
        ok: false,
        message: 'No autorizado para eliminar este tweet'
      });
    }
    
    await Tweet.findByIdAndDelete(id);
    
    res.json({
      ok: true,
      message: 'Tweet eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando tweet:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;