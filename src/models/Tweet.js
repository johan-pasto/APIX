// models/Tweet.js
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  contenido: {
    type: String,
    required: [true, 'El contenido es requerido'],
    maxlength: [280, 'Máximo 280 caracteres'],
    trim: true
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
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contenido: {
      type: String,
      required: true,
      maxlength: 280
    },
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

module.exports = mongoose.model('Tweet', tweetSchema);