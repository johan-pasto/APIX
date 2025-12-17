const mongoose = require('mongoose');

// Cache para la conexión de MongoDB (IMPORTANTE para Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { 
    conn: null, 
    promise: null,
    connectionCount: 0 
  };
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    console.log(`🔗 Conectando a MongoDB (Intento #${cached.connectionCount + 1})...`);
    
    // Si ya tenemos una conexión cacheada, usarla
    if (cached.conn) {
      console.log('✅ Usando conexión cacheada a MongoDB');
      return cached.conn;
    }
    
    // Si no hay promesa de conexión pendiente, crear una
    if (!cached.promise) {
      console.log('🔄 Creando nueva conexión a MongoDB...');
      
      const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // IMPORTANTE para serverless
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // 10 segundos
        socketTimeoutMS: 45000, // 45 segundos
      };
      
      cached.promise = mongoose.connect(mongoUri, opts)
        .then((mongooseInstance) => {
          console.log('✅ Nueva conexión a MongoDB establecida');
          cached.connectionCount++;
          
          // Manejar eventos de conexión
          mongooseInstance.connection.on('error', (err) => {
            console.error(`❌ Error de MongoDB: ${err.message}`);
            cached.conn = null;
            cached.promise = null;
          });
          
          mongooseInstance.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB desconectado - Limpiando cache');
            cached.conn = null;
            cached.promise = null;
          });
          
          return mongooseInstance;
        })
        .catch((error) => {
          console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
          cached.promise = null;
          throw error;
        });
    }
    
    // Esperar a que la conexión se establezca
    cached.conn = await cached.promise;
    
    return cached.conn;
    
  } catch (error) {
    console.error(`❌ Error fatal en connectDB: ${error.message}`);
    
    // En producción (Vercel), no exitear el proceso
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Intentando reconectar en 5 segundos...');
      // Limpiar cache y reintentar
      cached.conn = null;
      cached.promise = null;
      
      // No bloquear - retornar error pero no reintentar automáticamente
      throw error;
    } else {
      // En desarrollo, salir con error
      process.exit(1);
    }
  }
};

// Función para verificar el estado de la conexión
connectDB.getStatus = () => ({
  isConnected: !!cached.conn,
  connectionCount: cached.connectionCount,
  hasPendingPromise: !!cached.promise
});

module.exports = connectDB;