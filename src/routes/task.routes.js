const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const autenticar = require('../middleware/auth.middleware');
const { validarTarea } = require('../middleware/validate.middleware');

// Todas las rutas requieren autenticación
router.use(autenticar);

// GET /api/tasks - Obtener todas las tareas del usuario
router.get('/tasks', async (req, res) => {
  try {
    const { completada, categoria, prioridad, desde, hasta, busqueda } = req.query;
    
    // Construir filtro
    const filtro = { usuario: req.usuario._id };
    
    if (completada !== undefined) {
      filtro.completada = completada === 'true';
    }
    
    if (categoria) {
      filtro.categoria = categoria;
    }
    
    if (prioridad) {
      filtro.prioridad = prioridad;
    }
    
    if (desde || hasta) {
      filtro.fechaVencimiento = {};
      if (desde) filtro.fechaVencimiento.$gte = new Date(desde);
      if (hasta) filtro.fechaVencimiento.$lte = new Date(hasta);
    }
    
    if (busqueda) {
      filtro.$or = [
        { titulo: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } },
        { etiquetas: { $regex: busqueda, $options: 'i' } }
      ];
    }
    
    // Obtener tareas
    const tareas = await Task.find(filtro)
      .sort({ 
        prioridad: -1, 
        fechaVencimiento: 1,
        creadoEn: -1 
      });
    
    // Estadísticas
    const total = await Task.countDocuments({ usuario: req.usuario._id });
    const completadas = await Task.countDocuments({ 
      usuario: req.usuario._id, 
      completada: true 
    });
    const pendientes = await Task.countDocuments({ 
      usuario: req.usuario._id, 
      completada: false 
    });
    
    res.json({
      ok: true,
      tareas,
      estadisticas: {
        total,
        completadas,
        pendientes,
        porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

// POST /api/tasks - Crear nueva tarea
router.post('/tasks', validarTarea, async (req, res) => {
  try {
    const { titulo, descripcion, fechaVencimiento, prioridad, categoria, etiquetas } = req.body;
    
    const nuevaTarea = new Task({
      titulo,
      descripcion: descripcion || '',
      fechaVencimiento: fechaVencimiento || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      prioridad: prioridad || 'media',
      categoria: categoria || 'general',
      etiquetas: etiquetas || [],
      usuario: req.usuario._id
    });
    
    await nuevaTarea.save();
    
    res.status(201).json({
      ok: true,
      message: 'Tarea creada exitosamente',
      tarea: nuevaTarea
    });
    
  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

// PUT /api/tasks/:id - Actualizar tarea
router.put('/tasks/:id', validarTarea, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la tarea exista y pertenezca al usuario
    const tarea = await Task.findOne({ _id: id, usuario: req.usuario._id });
    
    if (!tarea) {
      return res.status(404).json({
        ok: false,
        message: 'Tarea no encontrada'
      });
    }
    
    // Actualizar campos
    const camposActualizables = ['titulo', 'descripcion', 'fechaVencimiento', 'prioridad', 'categoria', 'etiquetas', 'completada', 'recordatorio'];
    
    camposActualizables.forEach(campo => {
      if (req.body[campo] !== undefined) {
        tarea[campo] = req.body[campo];
      }
    });
    
    tarea.actualizadoEn = new Date();
    await tarea.save();
    
    res.json({
      ok: true,
      message: 'Tarea actualizada exitosamente',
      tarea
    });
    
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tarea = await Task.findOneAndDelete({ 
      _id: id, 
      usuario: req.usuario._id 
    });
    
    if (!tarea) {
      return res.status(404).json({
        ok: false,
        message: 'Tarea no encontrada'
      });
    }
    
    res.json({
      ok: true,
      message: 'Tarea eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

// PATCH /api/tasks/:id/toggle - Alternar estado de completada
router.patch('/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tarea = await Task.findOne({ _id: id, usuario: req.usuario._id });
    
    if (!tarea) {
      return res.status(404).json({
        ok: false,
        message: 'Tarea no encontrada'
      });
    }
    
    tarea.completada = !tarea.completada;
    tarea.actualizadoEn = new Date();
    await tarea.save();
    
    res.json({
      ok: true,
      message: `Tarea ${tarea.completada ? 'completada' : 'marcada como pendiente'}`,
      tarea
    });
    
  } catch (error) {
    console.error('Error alternando tarea:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en el servidor'
    });
  }
});

module.exports = router;