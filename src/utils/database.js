const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Conectado exitosamente');
    
    mongoose.connection.on('error', (err) => {
      console.error(`❌ Error de MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    
    // En producción, no detener el proceso inmediatamente
    if (process.env.NODE_ENV === 'production') {
      // Intentar reconectar después de 5 segundos
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;