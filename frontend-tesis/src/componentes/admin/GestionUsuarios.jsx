import { useState, useEffect } from 'react';
import { authService } from '../../servicios/api';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  const [formEditar, setFormEditar] = useState({
    nombre: '',
    email: '',
    rol: 'admin'
  });

  const [formPassword, setFormPassword] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await authService.getAdministradores();
      if (response.success) {
        setUsuarios(response.data);
      }
    } catch (error) {
      mostrarMensaje('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormEditar({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
    setShowModalEditar(true);
  };

  const handleCambiarPassword = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormPassword({ password: '', confirmPassword: '' });
    setShowModalPassword(true);
  };

  const submitEditar = async (e) => {
    e.preventDefault();
    
    if (!formEditar.nombre || !formEditar.email) {
      mostrarMensaje('Por favor complete todos los campos', 'error');
      return;
    }

    try {
      const response = await authService.editarUsuario(usuarioSeleccionado._id, formEditar);
      if (response.success) {
        mostrarMensaje('Usuario actualizado exitosamente', 'success');
        setShowModalEditar(false);
        cargarUsuarios();
      }
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al actualizar usuario', 'error');
    }
  };

  const submitCambiarPassword = async (e) => {
    e.preventDefault();
    
    if (!formPassword.password || !formPassword.confirmPassword) {
      mostrarMensaje('Por favor complete todos los campos', 'error');
      return;
    }

    if (formPassword.password.length < 6) {
      mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (formPassword.password !== formPassword.confirmPassword) {
      mostrarMensaje('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      const response = await authService.resetearPasswordPorAdmin(
        usuarioSeleccionado._id, 
        { password: formPassword.password }
      );
      if (response.success) {
        mostrarMensaje('Contraseña actualizada exitosamente', 'success');
        setShowModalPassword(false);
        setFormPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al cambiar contraseña', 'error');
    }
  };

  const toggleEstadoUsuario = async (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} a ${usuario.nombre}?`)) {
      return;
    }

    try {
      const response = await authService.toggleEstadoUsuario(usuario._id);
      if (response.success) {
        mostrarMensaje(response.message, 'success');
        cargarUsuarios();
      }
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await authService.eliminarAdministrador(usuario._id);
      if (response.success) {
        mostrarMensaje('Usuario eliminado exitosamente', 'success');
        cargarUsuarios();
      }
    } catch (error) {
      mostrarMensaje(error.response?.data?.message || 'Error al eliminar usuario', 'error');
    }
  };

  const getRolBadge = (rol) => {
    const badges = {
      superadmin: { texto: 'Super Admin', clase: 'badge-superadmin' },
      admin: { texto: 'Admin', clase: 'badge-admin' },
      usuario: { texto: 'Usuario', clase: 'badge-usuario' }
    };
    return badges[rol] || badges.usuario;
  };

  if (loading) {
    return (
      <div className="gestion-usuarios">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios">
      <div className="header-section">
        <h2>👥 Gestión de Usuarios</h2>
        <p className="subtitle">Administra los usuarios del sistema</p>
      </div>

      {mensaje.texto && (
        <div className={`mensaje mensaje-${mensaje.tipo}`}>
          <span>{mensaje.tipo === 'success' ? '✓' : '⚠️'} {mensaje.texto}</span>
        </div>
      )}

      <div className="usuarios-grid">
        {usuarios.map((usuario) => {
          const badge = getRolBadge(usuario.rol);
          return (
            <div key={usuario._id} className="usuario-card">
              <div className="usuario-header">
                <div className="usuario-info">
                  <h3>{usuario.nombre}</h3>
                  <p className="usuario-email">{usuario.email}</p>
                </div>
                <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                  {usuario.activo ? '🟢 Activo' : '🔴 Inactivo'}
                </span>
              </div>

              <div className="usuario-detalles">
                <div className="detalle-item">
                  <span className="detalle-label">Rol:</span>
                  <span className={`rol-badge ${badge.clase}`}>{badge.texto}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Creado:</span>
                  <span>{new Date(usuario.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              {usuario.rol !== 'superadmin' && (
                <div className="usuario-acciones">
                  <button
                    className="btn-accion btn-editar"
                    onClick={() => handleEditarUsuario(usuario)}
                    title="Editar usuario"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-accion btn-password"
                    onClick={() => handleCambiarPassword(usuario)}
                    title="Cambiar contraseña"
                  >
                    🔒 Contraseña
                  </button>
                  <button
                    className={`btn-accion ${usuario.activo ? 'btn-desactivar' : 'btn-activar'}`}
                    onClick={() => toggleEstadoUsuario(usuario)}
                    title={usuario.activo ? 'Desactivar' : 'Activar'}
                  >
                    {usuario.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                  </button>
                  <button
                    className="btn-accion btn-eliminar"
                    onClick={() => handleEliminar(usuario)}
                    title="Eliminar usuario"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}

              {usuario.rol === 'superadmin' && (
                <div className="usuario-protegido">
                  <p>🛡️ Usuario protegido - No se puede modificar</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Editar */}
      {showModalEditar && (
        <div className="modal-overlay" onClick={() => setShowModalEditar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Editar Usuario</h3>
              <button className="btn-cerrar" onClick={() => setShowModalEditar(false)}>✕</button>
            </div>

            <form onSubmit={submitEditar} className="modal-form">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  placeholder="Nombre del usuario"
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={formEditar.email}
                  onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formEditar.rol}
                  onChange={(e) => setFormEditar({ ...formEditar, rol: e.target.value })}
                  required
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={() => setShowModalEditar(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showModalPassword && (
        <div className="modal-overlay" onClick={() => setShowModalPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Cambiar Contraseña</h3>
              <button className="btn-cerrar" onClick={() => setShowModalPassword(false)}>✕</button>
            </div>

            <form onSubmit={submitCambiarPassword} className="modal-form">
              <div className="info-usuario-modal">
                <p><strong>Usuario:</strong> {usuarioSeleccionado?.nombre}</p>
                <p><strong>Email:</strong> {usuarioSeleccionado?.email}</p>
              </div>

              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={formPassword.password}
                  onChange={(e) => setFormPassword({ ...formPassword, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={formPassword.confirmPassword}
                  onChange={(e) => setFormPassword({ ...formPassword, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={() => setShowModalPassword(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  🔒 Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
