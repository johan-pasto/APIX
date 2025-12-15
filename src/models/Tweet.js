const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  contenido: {
    type: String,
    required: [true, 'El contenido es requerido'],
    maxlength: [280, 'Máximo 280 caracteres']
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contenido: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para mejor rendimiento
tweetSchema.index({ usuario: 1, fecha: -1 });
tweetSchema.index({ fecha: -1 });

module.exports = mongoose.model('Tweet', tweetSchema);