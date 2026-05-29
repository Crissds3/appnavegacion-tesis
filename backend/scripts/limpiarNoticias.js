/**
 * Script de limpieza: elimina TODAS las noticias de la base de datos
 * y sus imágenes asociadas en Cloudinary.
 *
 * Uso (desde la carpeta /backend):
 *   node scripts/limpiarNoticias.js
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Noticia from '../models/Noticia.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function limpiar() {
  console.log('Conectando a MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado.');

  const noticias = await Noticia.find({ cloudinaryPublicId: { $ne: '' } });
  console.log(`Eliminando ${noticias.length} imágenes de Cloudinary…`);

  await Promise.allSettled(
    noticias.map(async (n) => {
      if (n.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(n.cloudinaryPublicId, { resource_type: 'image' });
        console.log(`  ✓ ${n.cloudinaryPublicId}`);
      }
    })
  );

  const result = await Noticia.deleteMany({});
  console.log(`\n✅ ${result.deletedCount} noticias eliminadas de MongoDB.`);

  await mongoose.disconnect();
  console.log('Desconectado. Listo.');
}

limpiar().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
