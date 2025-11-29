import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ubicacion from '../models/Ubicacion.js';

dotenv.config();

async function limpiarUbicaciones() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado\n');

    const count = await Ubicacion.countDocuments();
    console.log(`📊 Ubicaciones a eliminar: ${count}`);
    
    await Ubicacion.deleteMany({});
    console.log('🗑️  Base de datos limpia\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

limpiarUbicaciones();
