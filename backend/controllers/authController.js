import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { 
  enviarEmailRecuperacion, 
  crearEmailRecuperacion,
  enviarEmail,
  crearEmailBienvenida,
  crearEmailActualizacionPerfil,
  crearEmailCambioPasswordAdmin
} from '../config/email.js';

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

//Registrar nuevo usuario
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const usuario = await User.create({
      nombre,
      email,
      password
    });

    if (usuario) {
      res.status(201).json({
        success: true,
        data: {
          _id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          token: generarToken(usuario._id)
        }
      });
    }
  } catch (error) {
    console.error('Error en registrarUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario',
      error: error.message
    });
  }
};

//Login de usuario
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione email y contraseña'
      });
    }

    // Buscar usuario y incluir password
    const usuario = await User.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const passwordCorrecto = await usuario.compararPassword(password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Login exitoso
    res.json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: generarToken(usuario._id)
      }
    });
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        createdAt: usuario.createdAt
      }
    });
  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// Actualizar perfil del usuario
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, email } = req.body;

    const camposActualizar = {};
    if (nombre) camposActualizar.nombre = nombre;
    if (email) camposActualizar.email = email;

    const usuario = await User.findByIdAndUpdate(
      req.usuario.id,
      camposActualizar,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en actualizarPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// Crear administrador
export const crearAdministrador = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos'
      });
    }

    // Verificar que sea superadmin
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Solo el administrador principal puede crear nuevas cuentas'
      });
    }

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const usuario = await User.create({
      nombre,
      email,
      password,
      rol: 'admin' // Siempre crear como admin
    });

    if (usuario) {
      // Enviar correo de bienvenida
      try {
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
        await enviarEmail({
          email: usuario.email,
          subject: 'Bienvenido al Sistema de Navegación UTalca',
          html: crearEmailBienvenida(usuario.nombre, usuario.email, password, loginUrl)
        });
      } catch (emailError) {
        console.error('Error al enviar correo de bienvenida:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Administrador creado exitosamente. Se ha enviado un correo con las credenciales.',
        data: {
          _id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    }
  } catch (error) {
    console.error('Error en crearAdministrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el administrador',
      error: error.message
    });
  }
};

// Obtener todos los administradores
export const obtenerAdministradores = async (req, res) => {
  try {
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const administradores = await User.find({ rol: { $in: ['admin', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: administradores
    });
  } catch (error) {
    console.error('Error en obtenerAdministradores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener administradores',
      error: error.message
    });
  }
};

// Eliminar administrador
export const eliminarAdministrador = async (req, res) => {
  try {
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    // No permitir que un administrador se elimine a sí mismo
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    const administrador = await User.findById(req.params.id);

    if (!administrador) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    if (administrador.rol !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es un administrador'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Administrador eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en eliminarAdministrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar administrador',
      error: error.message
    });
  }
};

// Solicitar recuperación de contraseña
export const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione un email'
      });
    }

    // Buscar usuario por email
    const usuario = await User.findOne({ email });

    // Por seguridad, siempre devolvemos el mismo mensaje aunque el usuario no exista
    if (!usuario) {
      return res.json({
        success: true,
        message: 'Si el correo existe en nuestro sistema, recibirás un email con las instrucciones'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacte al administrador'
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash del token para guardar en la base de datos
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Establecer tiempo de expiración (1 hora)
    const resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    // Guardar token y expiración en el usuario
    usuario.resetPasswordToken = resetPasswordToken;
    usuario.resetPasswordExpire = resetPasswordExpire;
    await usuario.save({ validateBeforeSave: false });

    // Crear URL de recuperación
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer-password/${resetToken}`;

    try {
      // Enviar email
      await enviarEmailRecuperacion({
        email: usuario.email,
        subject: 'Recuperación de Contraseña',
        html: crearEmailRecuperacion(usuario.nombre, resetUrl)
      });

      res.json({
        success: true,
        message: 'Si el correo existe en nuestro sistema, recibirás un email con las instrucciones'
      });
    } catch (error) {
      // Si falla el envío del correo, limpiar los campos de recuperación
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpire = undefined;
      await usuario.save({ validateBeforeSave: false });

      console.error('Error al enviar email:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el correo electrónico. Intente nuevamente más tarde'
      });
    }
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message
    });
  }
};

// Restablecer contraseña
export const restablecerPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el token y la nueva contraseña'
      });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Hash del token recibido para comparar con el de la base de datos
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con el token y que no haya expirado
    const usuario = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Establecer nueva contraseña
    usuario.password = password;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;
    await usuario.save();

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña'
    });
  } catch (error) {
    console.error('Error en restablecerPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: error.message
    });
  }
};

// Editar usuario (solo superadmin)
export const editarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol } = req.body;
    const { id } = req.params;

    // Validar que el usuario no se edite a sí mismo
    if (id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes editar tu propio usuario desde aquí. Usa el perfil'
      });
    }

    // Buscar usuario
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir crear otro superadmin
    if (rol === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'No se puede asignar el rol de superadmin'
      });
    }

    // Actualizar campos y detectar cambios
    const cambios = {};
    if (nombre && usuario.nombre !== nombre) {
      cambios['Nombre'] = `${usuario.nombre} ➝ ${nombre}`;
      usuario.nombre = nombre;
    }
    if (email && usuario.email !== email) {
      cambios['Email'] = `${usuario.email} ➝ ${email}`;
      usuario.email = email;
    }
    if (rol && usuario.rol !== rol) {
      cambios['Rol'] = `${usuario.rol} ➝ ${rol}`;
      usuario.rol = rol;
    }

    await usuario.save();

    // Enviar correo si hubo cambios
    if (Object.keys(cambios).length > 0) {
      try {
        await enviarEmail({
          email: usuario.email,
          subject: 'Actualización de Perfil - App Navegación UTalca',
          html: crearEmailActualizacionPerfil(usuario.nombre, cambios)
        });
      } catch (emailError) {
        console.error('Error al enviar correo de actualización:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });
  } catch (error) {
    console.error('Error en editarUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar el usuario',
      error: error.message
    });
  }
};

// Activar/Desactivar usuario (solo superadmin)
export const toggleEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el usuario no se desactive a sí mismo
    if (id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Buscar usuario
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar otro superadmin
    if (usuario.rol === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'No se puede modificar el estado de otro superadmin'
      });
    }

    // Cambiar estado
    usuario.activo = !usuario.activo;
    await usuario.save();

    res.json({
      success: true,
      message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });
  } catch (error) {
    console.error('Error en toggleEstadoUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del usuario',
      error: error.message
    });
  }
};

// Resetear contraseña por admin (solo superadmin)
export const resetearPasswordPorAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validar contraseña
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar que no sea él mismo
    if (id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'Usa la opción de cambiar contraseña en tu perfil'
      });
    }

    // Buscar usuario
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir cambiar contraseña de otro superadmin
    if (usuario.rol === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar la contraseña de otro superadmin'
      });
    }

    // Actualizar contraseña
    usuario.password = password;
    await usuario.save();

    // Enviar correo con nueva contraseña
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      await enviarEmail({
        email: usuario.email,
        subject: 'Contraseña Restablecida por Administrador',
        html: crearEmailCambioPasswordAdmin(usuario.nombre, password, loginUrl)
      });
    } catch (emailError) {
      console.error('Error al enviar correo de cambio de contraseña:', emailError);
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Se ha notificado al usuario por correo.'
    });
  } catch (error) {
    console.error('Error en resetearPasswordPorAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear la contraseña',
      error: error.message
    });
  }
};
