require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./utils/database');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const tweetRoutes = require('./routes/tweet');

// Conectar a la base de datos
connectDB();

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
    message: 'API de Mi Todo App - Funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/login',
        registro: 'POST /api/registro',
        perfil: 'GET /api/perfil (requiere token)'
      },
      tasks: {
        todas: 'GET /api/tasks (requiere token)',
        crear: 'POST /api/tasks (requiere token)',
        actualizar: 'PUT /api/tasks/:id (requiere token)',
        eliminar: 'DELETE /api/tasks/:id (requiere token)'
      }
    }
  });
});

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api', taskRoutes);
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