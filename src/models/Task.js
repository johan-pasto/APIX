const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    minlength: [1, 'El título no puede estar vacío'],
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  descripcion: {
    type: String,
    default: '',
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  completada: {
    type: Boolean,
    default: false
  },
  fechaVencimiento: {
    type: Date,
    default: () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 7); // 7 días por defecto
      return fecha;
    }
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  categoria: {
    type: String,
    default: 'general',
    enum: ['general', 'trabajo', 'personal', 'estudio', 'salud', 'otros']
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  etiquetas: [{
    type: String,
    trim: true
  }],
  recordatorio: {
    type: Date,
    default: null
  },
  creadoEn: {
    type: Date,
    default: Date.now
  },
  actualizadoEn: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
taskSchema.index({ usuario: 1, completada: 1 });
taskSchema.index({ fechaVencimiento: 1 });
taskSchema.index({ prioridad: 1 });
taskSchema.index({ usuario: 1, categoria: 1 });

module.exports = mongoose.model('Task', taskSchema);