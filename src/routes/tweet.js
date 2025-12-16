const mongoose = require('mongoose');
const User = require('../models/User'); 
/**
 * @route   GET /api/tweets/:id/comentarios
 * @desc    Obtener todos los comentarios de un tweet
 * @access  Public
 */
router.get('/:id/comentarios', async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
      .populate('comentarios.usuario', 'username nombre avatar');
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    res.json({
      ok: true,
      comentarios: tweet.comentarios || [],
      count: tweet.comentarios ? tweet.comentarios.length : 0
    });
    
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tweets/:id/comentarios
 * @desc    Crear un nuevo comentario en un tweet
 * @access  Private
 */
router.post('/:id/comentarios', authMiddleware, validarComentario, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    const nuevoComentario = {
      _id: new mongoose.Types.ObjectId(),
      usuario: req.user.id,
      contenido: req.body.contenido,
      fecha: new Date()
    };
    
    // Agregar comentario al array
    tweet.comentarios.push(nuevoComentario);
    await tweet.save();
    
    // Obtener tweet con populate para enviar respuesta
    const tweetActualizado = await Tweet.findById(req.params.id)
      .populate('comentarios.usuario', 'username nombre avatar');
    
    const comentarioCreado = tweetActualizado.comentarios.find(
      c => c._id.toString() === nuevoComentario._id.toString()
    );
    
    res.status(201).json({
      ok: true,
      message: 'Comentario creado exitosamente',
      comentario: comentarioCreado
    });
    
  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al crear comentario',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/tweets/:tweetId/comentarios/:comentarioId
 * @desc    Actualizar un comentario
 * @access  Private (solo dueño del comentario)
 */
router.put('/:tweetId/comentarios/:comentarioId', authMiddleware, validarEdicionComentario, async (req, res) => {
  try {
    const { tweetId, comentarioId } = req.params;
    const { contenido } = req.body;
    
    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Buscar el comentario
    const comentarioIndex = tweet.comentarios.findIndex(
      c => c._id.toString() === comentarioId
    );
    
    if (comentarioIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: 'Comentario no encontrado'
      });
    }
    
    const comentario = tweet.comentarios[comentarioIndex];
    
    // Verificar que el usuario sea el dueño del comentario
    if (comentario.usuario.toString() !== req.user.id) {
      return res.status(403).json({
        ok: false,
        message: 'No autorizado para editar este comentario'
      });
    }
    
    // Actualizar comentario
    tweet.comentarios[comentarioIndex].contenido = contenido;
    tweet.comentarios[comentarioIndex].editado = true;
    tweet.comentarios[comentarioIndex].updatedAt = new Date();
    
    await tweet.save();
    
    // Obtener tweet actualizado
    const tweetActualizado = await Tweet.findById(tweetId)
      .populate('comentarios.usuario', 'username nombre avatar');
    
    res.json({
      ok: true,
      message: 'Comentario actualizado',
      comentario: tweetActualizado.comentarios[comentarioIndex]
    });
    
  } catch (error) {
    console.error('Error actualizando comentario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar comentario',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/tweets/:tweetId/comentarios/:comentarioId
 * @desc    Eliminar un comentario
 * @access  Private (solo dueño del comentario o admin)
 */
router.delete('/:tweetId/comentarios/:comentarioId', authMiddleware, async (req, res) => {
  try {
    const { tweetId, comentarioId } = req.params;
    
    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Buscar el comentario
    const comentarioIndex = tweet.comentarios.findIndex(
      c => c._id.toString() === comentarioId
    );
    
    if (comentarioIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: 'Comentario no encontrado'
      });
    }
    
    const comentario = tweet.comentarios[comentarioIndex];
    
    // Verificar permisos
    const isOwner = comentario.usuario.toString() === req.user.id;
    const isAdmin = req.user.rol === 'admin'; // Asumiendo que tienes campo 'rol'
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        ok: false,
        message: 'No autorizado para eliminar este comentario'
      });
    }
    
    // Eliminar comentario
    tweet.comentarios.splice(comentarioIndex, 1);
    await tweet.save();
    
    res.json({
      ok: true,
      message: 'Comentario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar comentario',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tweets/:tweetId/comentarios/:comentarioId/like
 * @desc    Dar/quitar like a un comentario
 * @access  Private
 */
router.post('/:tweetId/comentarios/:comentarioId/like', authMiddleware, async (req, res) => {
  try {
    const { tweetId, comentarioId } = req.params;
    
    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
      return res.status(404).json({
        ok: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Buscar el comentario
    const comentarioIndex = tweet.comentarios.findIndex(
      c => c._id.toString() === comentarioId
    );
    
    if (comentarioIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: 'Comentario no encontrado'
      });
    }
    
    const comentario = tweet.comentarios[comentarioIndex];
    const userId = req.user.id;
    
    // Verificar si ya dio like
    const likeIndex = comentario.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      // Dar like
      tweet.comentarios[comentarioIndex].likes.push(userId);
    } else {
      // Quitar like
      tweet.comentarios[comentarioIndex].likes.splice(likeIndex, 1);
    }
    
    await tweet.save();
    
    // Obtener tweet actualizado
    const tweetActualizado = await Tweet.findById(tweetId);
    const comentarioActualizado = tweetActualizado.comentarios[comentarioIndex];
    
    res.json({
      ok: true,
      liked: likeIndex === -1, // true si acaba de dar like, false si quitó
      likesCount: comentarioActualizado.likes.length
    });
    
  } catch (error) {
    console.error('Error dando like al comentario:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al dar like',
      error: error.message
    });
  }
});