require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./utils/database');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const tweetRoutes = require('./routes/tweet');
const userRoutes = require('./routes/user');

// Conectar a la base de datos
connectDB();

// Importar modelos para que Mongoose los registre
require('./models/User');
require('./models/Tweet');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE DE LOGGING (AGREGAR ESTO) ==========
app.use((req, res, next) => {
  console.log('🌐 [' + new Date().toISOString() + ']', req.method, req.url);
  
  // Log body solo para rutas específicas (evitar logs sensibles)
  const safeRoutes = ['/api/tweets', '/api/users'];
  if (safeRoutes.some(route => req.url.startsWith(route)) && req.body) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// Middleware para verificar conexión DB en cada request
app.use(async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    
    if (dbState !== 1) { // 1 = connected
      console.log('⚠️  MongoDB no conectado. Estado:', dbState);
      await connectDB(); // Reconectar
    }
    
    next();
  } catch (error) {
    console.error('❌ Error conexión DB:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Error de conexión a la base de datos'
    });
  }
});
// ========== FIN MIDDLEWARE DE LOGGING ==========

// Resto de middlewares
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
  console.log('🏠 Ruta raíz accedida');
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
      users: {
        obtener_usuario: 'GET /api/users/:userId',
        obtener_tweets_usuario: 'GET /api/users/:userId/tweets',
        actualizar_perfil: 'PUT /api/users/:userId (requiere token)'
      },
      tweets: {
        obtener_todos: 'GET /api/tweets',
        crear: 'POST /api/tweets (requiere token)',
        like: 'POST /api/tweets/:id/like (requiere token)',
        eliminar: 'DELETE /api/tweets/:id (requiere token)'
      }
    }
  });
});

// ✅ MOVER AQUÍ la ruta test-db (después de crear app)
app.get('/api/test-db', async (req, res) => {
  console.log('🧪 /api/test-db accedido');
  const mongoose = require('mongoose');
  try {
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

// ========== RUTA DE DIAGNÓSTICO (AGREGAR ESTO) ==========
app.get('/api/diagnostic', async (req, res) => {
  console.log('🔍 /api/diagnostic accedido');
  const mongoose = require('mongoose');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    server: {
      node: process.version,
      environment: process.env.NODE_ENV || 'development',
      vercel: {
        region: process.env.VERCEL_REGION || 'local',
        url: process.env.VERCEL_URL || 'local'
      }
    },
    mongodb: {
      has_uri: !!process.env.MONGODB_URI,
      connection_state: mongoose.connection.readyState,
      state_description: {
        0: 'Desconectado',
        1: 'Conectado',
        2: 'Conectando',
        3: 'Desconectando'
      }[mongoose.connection.readyState],
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
      models: ['User', 'Tweet']
    },
    routes: {
      active: [
        '/api/login',
        '/api/registro', 
        '/api/perfil',
        '/api/tweets',
        '/api/users/:userId',
        '/api/users/:userId/tweets'
      ]
    }
  };
  
  res.json(diagnostic);
});

// ========== RUTA DE TEST UPDATE (AGREGAR ESTO) ==========
app.post('/api/test-update-profile', async (req, res) => {
  console.log('🧪 /api/test-update-profile accedido');
  console.log('📦 Body recibido:', req.body);
  
  try {
    const mongoose = require('mongoose');
    const User = require('./models/User');
    
    // Usar el primer usuario disponible
    const testUser = await User.findOne().sort({ _id: 1 }).limit(1);
    
    if (!testUser) {
      return res.status(404).json({
        ok: false,
        message: 'No hay usuarios en la base de datos'
      });
    }
    
    console.log('👤 Usuario encontrado para test:', testUser._id);
    
    // Actualizar con datos de prueba
    const updateData = {
      bio: 'Test update ' + new Date().toISOString(),
      avatar_url: 'https://picsum.photos/200/200?' + Date.now()
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');
    
    console.log('✅ Usuario actualizado en test:', {
      id: updatedUser._id,
      bio: updatedUser.bio,
      avatar_url: updatedUser.avatar_url
    });
    
    res.json({
      ok: true,
      message: 'Test de actualización exitoso',
      user: updatedUser,
      testData: updateData
    });
    
  } catch (error) {
    console.error('❌ Error en test-update:', error);
    res.status(500).json({
      ok: false,
      message: 'Error en test',
      error: error.message
    });
  }
});
// ========== FIN RUTAS DE DIAGNÓSTICO ==========

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/users', userRoutes);

// Middleware para manejar errores 404
app.use('*', (req, res) => {
  console.log('❌ 404 Ruta no encontrada:', req.originalUrl);
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.originalUrl}`
  });
});

// Middleware para manejar errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
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