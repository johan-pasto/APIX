const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  contenido: {
    type: String,
    required: [true, 'El contenido es requerido'],
    maxlength: [280, 'El comentario no puede tener más de 280 caracteres'],
    trim: true
  },
  
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: [true, 'El tweet es requerido'],
    index: true
  },
  
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido'],
    index: true
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  comentarioPadre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para contar likes
CommentSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Populate automático para usuario
CommentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'usuario',
    select: 'usuario nombre avatar'
  });
  next();
});

// Middleware para eliminar respuestas hijas si existe
CommentSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ comentarioPadre: this._id });
  next();
});

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);