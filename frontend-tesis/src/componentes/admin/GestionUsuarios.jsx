import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authService } from '../../servicios/api';
import CrearAdmin from './CrearAdmin';
import { 
  User, 
  Mail, 
  Shield, 
  Edit2, 
  Lock, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Power,
  Search,
  X,
  Save,
  AlertCircle,
  Plus
} from 'lucide-react';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showCrearAdmin, setShowCrearAdmin] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [filtro, setFiltro] = useState('');
  
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

  const handleSuccessCrearAdmin = (message) => {
    setShowCrearAdmin(false);
    mostrarMensaje(message, 'success');
    cargarUsuarios();
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

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="gestion-usuarios-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios-container">
      {mensaje.texto && (
        <div className={`mensaje-flotante mensaje-${mensaje.tipo}`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="gestion-main-card">
        <div className="gestion-header">
          <div className="header-title">
            <h2>Gestión de Usuarios</h2>
            <p className="header-subtitle">Administra los accesos y roles del sistema</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-create-modern" 
              onClick={() => setShowCrearAdmin(true)}
            >
              <Plus size={18} />
              <span>Crear Admin</span>
            </button>
            <div className="search-wrapper-modern">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o email..." 
                className="search-input-modern"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="usuarios-grid-modern">
          {usuariosFiltrados.map((usuario) => (
            <div key={usuario._id} className="usuario-card-modern">
              <div className="card-top-accent"></div>
              <div className="usuario-card-header">
                <div className="avatar-placeholder">
                  <User size={24} />
                </div>
                <div className="usuario-info-main">
                  <h3>{usuario.nombre}</h3>
                  <div className="usuario-email-row">
                    <Mail size={14} />
                    <span>{usuario.email}</span>
                  </div>
                </div>
                <div className={`status-indicator ${usuario.activo ? 'active' : 'inactive'}`} title={usuario.activo ? 'Activo' : 'Inactivo'}></div>
              </div>

              <div className="usuario-card-body">
                <div className="info-row">
                  <span className="label">Rol</span>
                  <span className={`badge-rol ${usuario.rol}`}>
                    {usuario.rol === 'superadmin' ? 'Super Admin' : 'Administrador'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Estado</span>
                  <span className={`badge-status ${usuario.activo ? 'active' : 'inactive'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="usuario-card-actions">
                {usuario.rol !== 'superadmin' ? (
                  <>
                    <button
                      className="btn-icon-modern edit"
                      onClick={() => handleEditarUsuario(usuario)}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon-modern password"
                      onClick={() => handleCambiarPassword(usuario)}
                      title="Cambiar contraseña"
                    >
                      <Lock size={18} />
                    </button>
                    <button
                      className={`btn-icon-modern ${usuario.activo ? 'deactivate' : 'activate'}`}
                      onClick={() => toggleEstadoUsuario(usuario)}
                      title={usuario.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power size={18} />
                    </button>
                    <button
                      className="btn-icon-modern delete"
                      onClick={() => handleEliminar(usuario)}
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <div className="protected-user-msg">
                    <Shield size={14} />
                    <span>Usuario Protegido</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Crear Admin */}
      {showCrearAdmin && createPortal(
        <CrearAdmin 
          onClose={() => setShowCrearAdmin(false)}
          onSuccess={handleSuccessCrearAdmin}
        />,
        document.body
      )}

      {/* Modal Editar */}
      {showModalEditar && createPortal(
        <div className="modal-overlay-modern">
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Editar Usuario</h3>
              <button className="btn-close-modal" onClick={() => setShowModalEditar(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitEditar} className="modal-form-modern">
              <div className="form-group-modern">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={formEditar.email}
                  onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div className="modal-footer-modern">
                <button type="button" className="btn-cancel-modern" onClick={() => setShowModalEditar(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit-modern">
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Cambiar Contraseña */}
      {showModalPassword && createPortal(
        <div className="modal-overlay-modern">
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Cambiar Contraseña</h3>
              <button className="btn-close-modal" onClick={() => setShowModalPassword(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitCambiarPassword} className="modal-form-modern">
              <div className="user-summary">
                <div className="summary-icon"><User size={20} /></div>
                <div className="summary-info">
                  <span className="summary-name">{usuarioSeleccionado?.nombre}</span>
                  <span className="summary-email">{usuarioSeleccionado?.email}</span>
                </div>
              </div>

              <div className="form-group-modern">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={formPassword.password}
                  onChange={(e) => setFormPassword({ ...formPassword, password: e.target.value })}
                  className="input-modern"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={formPassword.confirmPassword}
                  onChange={(e) => setFormPassword({ ...formPassword, confirmPassword: e.target.value })}
                  className="input-modern"
                  placeholder="Repite la contraseña"
                  required
                />
              </div>

              <div className="modal-footer-modern">
                <button type="button" className="btn-cancel-modern" onClick={() => setShowModalPassword(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit-modern">
                  <Save size={18} /> Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GestionUsuarios;
