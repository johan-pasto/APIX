const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet'); // Necesitas este modelo
const authMiddleware = require('../middleware/auth.middleware');

// POST /api/tweets/:id/like - Dar/quitar like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id; // Del middleware de autenticación
    
    // Buscar el tweet
    const tweet = await Tweet.findById(id);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Verificar si el usuario ya dio like
    const likeIndex = tweet.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      // Dar like
      tweet.likes.push(userId);
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

// DELETE /api/tweets/:id - Eliminar tweet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    // Buscar el tweet
    const tweet = await Tweet.findById(id);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Verificar que el usuario es el dueño del tweet
    if (tweet.usuario.toString() !== userId) {
      return res.status(403).json({
        ok: false,
        message: 'No autorizado para eliminar este tweet'
      });
    }
    
    // Eliminar el tweet
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