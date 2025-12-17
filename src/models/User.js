const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  usuario: {
    type: String,
    required: [true, 'El usuario es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [4, 'El usuario debe tener al menos 4 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  telefono: {
    type: String,
    default: '',
    match: [/^[0-9]{10}$|^$/, 'Teléfono inválido (10 dígitos)']
  },
  avatar: {
    type: String,
    default: ''
  },
  avatar_url: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [320, 'La biografía no puede exceder 320 caracteres'],
    default: ''
  },
  ubicacion: {
    type: String,
    trim: true,
    default: ''
  },
  sitio_web: {
    type: String,
    trim: true,
    default: ''
  },
  seguidores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  siguiendo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  membresia: {
    type: String,
    enum: ['Usuario', 'Miembro', 'Premium'],
    default: 'Usuario'
  },
  creadoEn: {
    type: Date,
    default: Date.now
  },
  ultimoLogin: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {  // <-- ESTE PARÉNTESIS CIERRA EL PRIMER PARÁMETRO
  timestamps: true
});  // <-- AQUÍ SE CIERRA LA LLAMADA A mongoose.Schema()

// Hash de la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Método para eliminar datos sensibles al enviar respuesta
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);