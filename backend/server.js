import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import noticiaRoutes from './routes/noticiaRoutes.js';
import infoRoutes from './routes/infoRoutes.js';
import carreraRoutes from './routes/carreraRoutes.js';
import ubicacionRoutes from './routes/ubicacionRoutes.js';

dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
// Aumentar límite para imágenes en Base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.get('/api', (req, res) => {
  res.json({ message: 'API de Navegación - Backend funcionando' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de noticias
app.use('/api/noticias', noticiaRoutes);

// Rutas de información universitaria
app.use('/api/info', infoRoutes);

// Rutas de carreras
app.use('/api/carreras', carreraRoutes);

// Rutas de ubicaciones/wayfinding
app.use('/api/ubicaciones', ubicacionRoutes);

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});