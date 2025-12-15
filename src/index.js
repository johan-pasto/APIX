require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./utils/database');

app.get('/api/test-db', async (req, res) => {
  const mongoose = require('mongoose');
  try {
    // Intenta una operación simple de MongoDB
    const User = require('./models/User');
    const count = await User.countDocuments();
    res.json({ ok: true, message: '✅ DB Conectada', userCount: count });
  } catch (error) {
    console.error('❌ Error en test-db:', error.message);
    res.status(500).json({ 
      ok: false, 
      message: '❌ Error DB', 
      error: error.message,
      hasMongoUri: !!process.env.MONGODB_URI
    });
  }
});


// Importar rutas
const authRoutes = require('./routes/auth.routes');
const tweetRoutes = require('./routes/tweet');

// Conectar a la base de datos
connectDB();

// Importar modelos para que Mongoose los registre
require('./models/User');
require('./models/Tweet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud/verificación
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API de Twitter Clone - Funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/login',
        registro: 'POST /api/registro',
        perfil: 'GET /api/perfil (requiere token)'
      },
      tweets: {
        obtener_todos: 'GET /api/tweets (requiere token)',
        crear: 'POST /api/tweets (requiere token)',
        like: 'POST /api/tweets/:id/like (requiere token)',
        eliminar: 'DELETE /api/tweets/:id (requiere token)'
      }
    }
  });
});

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api/tweets', tweetRoutes);

// Middleware para manejar errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.originalUrl}`
  });
});

// Middleware para manejar errores generales
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err);
  const statusCode = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    ok: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Solo iniciar servidor localmente (no en Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
    console.log(`📝 Endpoints disponibles en http://localhost:${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;