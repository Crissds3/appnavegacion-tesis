// Script para actualizar el usuario principal a superadmin
// Ejecutar con: node scripts/actualizarSuperadmin.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const actualizarSuperadmin = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario por email
    const email = 'crisnu32111@gmail.com'; // Cambia esto por tu email
    const usuario = await User.findOne({ email });

    if (!usuario) {
      console.error(`❌ No se encontró un usuario con el email: ${email}`);
      process.exit(1);
    }

    // Actualizar el rol a superadmin
    usuario.rol = 'superadmin';
    await usuario.save();

    console.log('✅ Usuario actualizado exitosamente:');
    console.log(`   Nombre: ${usuario.nombre}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Rol: ${usuario.rol}`);
    console.log(`   ID: ${usuario._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

actualizarSuperadmin();
