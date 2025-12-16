const { body, validationResult } = require('express-validator');

const validarLogin = [
  body('usuario')
    .trim()
    .notEmpty().withMessage('El usuario es requerido'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('La contraseña es requerida'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Error de validación',
        errores: errores.array()
      });
    }
    next();
  }
];

const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  
  body('usuario')
    .trim()
    .notEmpty().withMessage('El usuario es requerido')
    .isLength({ min: 4 }).withMessage('El usuario debe tener al menos 4 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Solo letras, números y guiones bajos'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('telefono')
    .optional()
    .matches(/^[0-9]{10}$|^$/).withMessage('Teléfono inválido (10 dígitos)'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Error de validación',
        errores: errores.array()
      });
    }
    next();
  }
];

const validarTarea = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ max: 200 }).withMessage('El título no puede exceder 200 caracteres'),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  
  body('prioridad')
    .optional()
    .isIn(['baja', 'media', 'alta', 'urgente']).withMessage('Prioridad inválida'),
  
  body('categoria')
    .optional()
    .isIn(['general', 'trabajo', 'personal', 'estudio', 'salud', 'otros']).withMessage('Categoría inválida'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Error de validación',
        errores: errores.array()
      });
    }
    next();
  }
];
const validarComentario = [
  body('contenido')
    .trim()
    .notEmpty().withMessage('El contenido del comentario es requerido')
    .isLength({ max: 280 }).withMessage('El comentario no puede exceder 280 caracteres'),
  
  body('tweetId')
    .notEmpty().withMessage('El ID del tweet es requerido')
    .isMongoId().withMessage('ID de tweet inválido'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Error de validación',
        errores: errores.array()
      });
    }
    next();
  }
];

const validarEdicionComentario = [
  body('contenido')
    .trim()
    .notEmpty().withMessage('El contenido del comentario es requerido')
    .isLength({ max: 280 }).withMessage('El comentario no puede exceder 280 caracteres'),
  
  body('comentarioId')
    .notEmpty().withMessage('El ID del comentario es requerido')
    .isMongoId().withMessage('ID de comentario inválido'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Error de validación',
        errores: errores.array()
      });
    }
    next();
  }
];


module.exports = {
  validarLogin,
  validarRegistro,
  validarTarea,
  validarComentario,
  validarEdicionComentario
};