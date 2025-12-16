// routes/tweet.js - VERSIÓN ACTUALIZADA CON TRANSFORMACIÓN
const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const authMiddleware = require('../middleware/auth.middleware');

// Helper para transformar tweets
const transformTweet = (tweet) => {
  // Transformar comentarios
  const comments = tweet.comentarios ? tweet.comentarios.map(comment => ({
    id: comment._id,
    content: comment.contenido,
    user: comment.usuario ? {
      id: comment.usuario._id,
      username: comment.usuario.usuario || comment.usuario.username,
      name: comment.usuario.nombre,
      email: comment.usuario.email
    } : null,
    date: comment.fecha,
    createdAt: comment.fecha
  })) : [];

  // Transformar likes
  const likes = tweet.likes ? tweet.likes.map(like => ({
    id: like._id,
    username: like.usuario || like.username,
    name: like.nombre
  })) : [];

  // Retornar tweet transformado
  return {
    // IDs
    id: tweet._id ? tweet._id.toString() : tweet.id,
    _id: tweet._id ? tweet._id.toString() : tweet.id,
    
    // Contenido
    content: tweet.contenido,
    contenido: tweet.contenido, // Mantener original también
    text: tweet.contenido, // Alias adicional
    
    // Usuario/Autor
    user: tweet.usuario ? {
      id: tweet.usuario._id,
      username: tweet.usuario.usuario || tweet.usuario.username,
      name: tweet.usuario.nombre,
      email: tweet.usuario.email
    } : null,
    usuario: tweet.usuario, // Mantener original
    author: tweet.usuario ? { // Alias adicional
      id: tweet.usuario._id,
      username: tweet.usuario.usuario || tweet.usuario.username,
      name: tweet.usuario.nombre
    } : null,
    
    // Fechas
    createdAt: tweet.fecha,
    fecha: tweet.fecha, // Mantener original
    updatedAt: tweet.updatedAt,
    timestamp: tweet.fecha, // Alias adicional
    date: tweet.fecha, // Alias adicional
    
    // Interacciones
    likes: likes,
    likesCount: tweet.likes ? tweet.likes.length : 0,
    comments: comments,
    commentsCount: tweet.comentarios ? tweet.comentarios.length : 0,
    
    // Metadatos adicionales
    isLiked: false, // Se calculará en el frontend si es necesario
    isOwnTweet: false // Se calculará en el frontend
  };
};

// GET /api/tweets - Obtener todos los tweets (TRANSFORMADO)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Solicitando tweets para usuario:', req.usuario?.id);
    
    const tweets = await Tweet.find()
      .populate('usuario', 'nombre usuario email')
      .populate('comentarios.usuario', 'nombre usuario')
      .populate('likes', 'nombre usuario')
      .sort({ fecha: -1 });
    
    console.log(`📊 Tweets encontrados en DB: ${tweets.length}`);
    
    // Transformar todos los tweets
    const transformedTweets = tweets.map(tweet => {
      const transformed = transformTweet(tweet);
      
      // Verificar si el usuario actual dio like
      if (req.usuario && transformed.likes) {
        transformed.isLiked = transformed.likes.some(
          like => like.id === req.usuario.id.toString()
        );
      }
      
      // Verificar si es tweet del usuario actual
      if (req.usuario && transformed.user) {
        transformed.isOwnTweet = transformed.user.id === req.usuario.id.toString();
      }
      
      return transformed;
    });
    
    console.log('✅ Tweets transformados exitosamente');
    
    res.json({
      ok: true,
      tweets: transformedTweets,
      count: transformedTweets.length,
      message: 'Tweets obtenidos exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo tweets:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/tweets - Crear nuevo tweet (TRANSFORMADO)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contenido } = req.body;
    
    console.log('📝 Creando tweet:', { 
      usuario: req.usuario?.id, 
      contenido: contenido?.substring(0, 50) + (contenido?.length > 50 ? '...' : '') 
    });
    
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        ok: false,
        message: 'El contenido es requerido'
      });
    }
    
    if (contenido.length > 280) {
      return res.status(400).json({
        ok: false,
        message: 'El tweet no puede exceder los 280 caracteres'
      });
    }
    
    const nuevoTweet = new Tweet({
      contenido: contenido.trim(),
      usuario: req.usuario.id
    });
    
    await nuevoTweet.save();
    
    console.log('💾 Tweet guardado en DB:', nuevoTweet._id);
    
    // Populate y transformar
    const tweetPopulado = await Tweet.findById(nuevoTweet._id)
      .populate('usuario', 'nombre usuario email');
    
    const transformedTweet = transformTweet(tweetPopulado);
    
    // Marcar como tweet propio
    transformedTweet.isOwnTweet = true;
    
    console.log('✅ Tweet transformado:', {
      id: transformedTweet.id,
      content: transformedTweet.content,
      user: transformedTweet.user?.username
    });
    
    res.status(201).json({
      ok: true,
      tweet: transformedTweet,
      message: 'Tweet creado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error creando tweet:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/tweets/feed - Endpoint específico para feed (opcional)
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Solicitando FEED para usuario:', req.usuario?.id);
    
    // Puedes añadir lógica específica para el feed aquí
    // Por ejemplo: tweets de usuarios que sigues, etc.
    
    const tweets = await Tweet.find()
      .populate('usuario', 'nombre usuario email')
      .populate('comentarios.usuario', 'nombre usuario')
      .populate('likes', 'nombre usuario')
      .sort({ fecha: -1 })
      .limit(50); // Limitar para feed
    
    const transformedTweets = tweets.map(tweet => {
      const transformed = transformTweet(tweet);
      
      if (req.usuario) {
        transformed.isLiked = transformed.likes.some(
          like => like.id === req.usuario.id.toString()
        );
        transformed.isOwnTweet = transformed.user?.id === req.usuario.id.toString();
      }
      
      return transformed;
    });
    
    res.json({
      ok: true,
      tweets: transformedTweets,
      count: transformedTweets.length,
      message: 'Feed obtenido exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo feed:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ POST /api/tweets/:id/like - Dar/quitar like (TRANSFORMADO)
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    console.log('❤️ Procesando like:', { tweetId: id, usuarioId });
    
    const tweet = await Tweet.findById(id)
      .populate('usuario', 'nombre usuario email')
      .populate('likes', 'nombre usuario');
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Verificar si ya dio like
    const likeIndex = tweet.likes.findIndex(
      like => like._id.toString() === usuarioId
    );
    
    let liked;
    
    if (likeIndex === -1) {
      // Dar like
      tweet.likes.push(usuarioId);
      liked = true;
      console.log('👍 Like agregado');
    } else {
      // Quitar like
      tweet.likes.splice(likeIndex, 1);
      liked = false;
      console.log('👎 Like removido');
    }
    
    await tweet.save();
    
    // Volver a populate después de guardar
    const tweetActualizado = await Tweet.findById(id)
      .populate('usuario', 'nombre usuario email')
      .populate('likes', 'nombre usuario');
    
    const transformedTweet = transformTweet(tweetActualizado);
    transformedTweet.isLiked = liked;
    transformedTweet.isOwnTweet = transformedTweet.user?.id === usuarioId.toString();
    
    res.json({
      ok: true,
      tweet: transformedTweet, // Devolver tweet actualizado
      message: liked ? 'Like agregado' : 'Like removido',
      likes: transformedTweet.likesCount,
      liked: liked
    });
  } catch (error) {
    console.error('❌ Error en like:', error);
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
    
    console.log('🗑️ Eliminando tweet:', { tweetId: id, usuarioId });
    
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
    
    console.log('✅ Tweet eliminado');
    
    res.json({
      ok: true,
      message: 'Tweet eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando tweet:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/tweets/:id - Obtener tweet específico (NUEVO)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Obteniendo tweet específico:', id);
    
    const tweet = await Tweet.findById(id)
      .populate('usuario', 'nombre usuario email')
      .populate('comentarios.usuario', 'nombre usuario')
      .populate('likes', 'nombre usuario');
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    const transformedTweet = transformTweet(tweet);
    
    // Verificar interacciones del usuario actual
    if (req.usuario) {
      transformedTweet.isLiked = transformedTweet.likes.some(
        like => like.id === req.usuario.id.toString()
      );
      transformedTweet.isOwnTweet = transformedTweet.user?.id === req.usuario.id.toString();
    }
    
    res.json({
      ok: true,
      tweet: transformedTweet,
      message: 'Tweet obtenido exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo tweet:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;