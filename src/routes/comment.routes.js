const express = require('express');
const Comment = require('../models/Comment');
const Tweet = require('../models/Tweet');
const authMiddleware = require('../middleware/auth.middleware');
const { validarComentario: validateComment } = require('../middleware/validate.middleware');

const router = express.Router();

// GET /api/comentarios - Obtener todos los comentarios (con filtros)
router.get('/', async (req, res) => {
  try {
    const { tweetId, usuarioId, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (tweetId) {
      query.tweet = tweetId;
    }
    
    if (usuarioId) {
      query.usuario = usuarioId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const comentarios = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('usuario', 'username nombre avatar')
      .populate({
        path: 'tweet',
        select: 'contenido usuario',
        populate: {
          path: 'usuario',
          select: 'username nombre'
        }
      });
    
    const total = await Comment.countDocuments(query);
    
    res.json({
      success: true,
      count: comentarios.length,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
      comentarios
    });
    
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
});

// GET /api/comentarios/:id - Obtener un comentario específico
router.get('/:id', async (req, res) => {
  try {
    const comentario = await Comment.findById(req.params.id)
      .populate('usuario', 'username nombre avatar')
      .populate({
        path: 'tweet',
        select: 'contenido usuario',
        populate: {
          path: 'usuario',
          select: 'username nombre'
        }
      })
      .populate({
        path: 'comentarioPadre',
        populate: {
          path: 'usuario',
          select: 'username nombre avatar'
        }
      });
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }
    
    // Obtener respuestas si es un comentario padre
    const respuestas = await Comment.find({ comentarioPadre: comentario._id })
      .populate('usuario', 'username nombre avatar');
    
    res.json({
      success: true,
      comentario: {
        ...comentario.toObject(),
        respuestas
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentario',
      error: error.message
    });
  }
});

// POST /api/comentarios - Crear un nuevo comentario
router.post('/', authMiddleware, validateComment, async (req, res) => {
  try {
    const { contenido, tweetId, comentarioPadre } = req.body;
    const usuarioId = req.user.id;
    
    // Verificar que el tweet exista
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet no encontrado'
      });
    }
    
    // Si es respuesta a otro comentario, verificar que exista
    if (comentarioPadre) {
      const comentarioPadreDoc = await Comment.findById(comentarioPadre);
      if (!comentarioPadreDoc) {
        return res.status(404).json({
          success: false,
          message: 'Comentario padre no encontrado'
        });
      }
    }
    
    // Crear comentario
    const comentario = await Comment.create({
      contenido,
      tweet: tweetId,
      usuario: usuarioId,
      comentarioPadre: comentarioPadre || null
    });
    
    // Obtener comentario con populate
    const comentarioCompleto = await Comment.findById(comentario._id)
      .populate('usuario', 'username nombre avatar')
      .populate({
        path: 'tweet',
        select: 'contenido usuario',
        populate: {
          path: 'usuario',
          select: 'username nombre'
        }
      });
    
    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      comentario: comentarioCompleto
    });
    
  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear comentario',
      error: error.message
    });
  }
});

// PUT /api/comentarios/:id - Actualizar comentario
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { contenido } = req.body;
    const usuarioId = req.user.id;
    
    const comentario = await Comment.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }
    
    // Verificar que el usuario sea el dueño del comentario
    if (comentario.usuario.toString() !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para editar este comentario'
      });
    }
    
    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido es requerido'
      });
    }
    
    comentario.contenido = contenido;
    await comentario.save();
    
    const comentarioActualizado = await Comment.findById(comentario._id)
      .populate('usuario', 'username nombre avatar');
    
    res.json({
      success: true,
      message: 'Comentario actualizado',
      comentario: comentarioActualizado
    });
    
  } catch (error) {
    console.error('Error actualizando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar comentario',
      error: error.message
    });
  }
});

// DELETE /api/comentarios/:id - Eliminar comentario
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const comentario = await Comment.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }
    
    // Verificar que el usuario sea el dueño del comentario o admin
    if (comentario.usuario.toString() !== usuarioId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este comentario'
      });
    }
    
    // Si es un comentario padre, también eliminar respuestas
    if (!comentario.comentarioPadre) {
      await Comment.deleteMany({ comentarioPadre: comentario._id });
    }
    
    await comentario.deleteOne();
    
    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comentario',
      error: error.message
    });
  }
});

// POST /api/comentarios/:id/like - Dar/quitar like a comentario
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const comentario = await Comment.findById(req.params.id);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }
    
    const likeIndex = comentario.likes.indexOf(usuarioId);
    let liked = false;
    
    if (likeIndex === -1) {
      // Dar like
      comentario.likes.push(usuarioId);
      liked = true;
    } else {
      // Quitar like
      comentario.likes.splice(likeIndex, 1);
      liked = false;
    }
    
    await comentario.save();
    
    res.json({
      success: true,
      liked,
      likesCount: comentario.likes.length
    });
    
  } catch (error) {
    console.error('Error dando like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al dar like',
      error: error.message
    });
  }
});

module.exports = router;