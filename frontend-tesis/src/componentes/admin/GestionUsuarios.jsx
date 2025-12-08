import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
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
  const [usuarioOriginal, setUsuarioOriginal] = useState(null);
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
      showError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessCrearAdmin = (message) => {
    setShowCrearAdmin(false);
    showSuccess(message);
    cargarUsuarios();
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    const initialData = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };
    setFormEditar(initialData);
    setUsuarioOriginal(initialData);
    setShowModalEditar(true);
  };

  const handleCambiarPassword = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormPassword({ password: '', confirmPassword: '' });
    setShowModalPassword(true);
  };

  const hasChanges = () => {
    if (!usuarioOriginal) return true;
    return JSON.stringify(formEditar) !== JSON.stringify(usuarioOriginal);
  };

  const submitEditar = async (e) => {
    e.preventDefault();
    
    if (!formEditar.nombre || !formEditar.email) {
      showError('Por favor complete todos los campos');
      return;
    }

    try {
      const response = await authService.editarUsuario(usuarioSeleccionado._id, formEditar);
      if (response.success) {
        showSuccess('Usuario actualizado exitosamente');
        setShowModalEditar(false);
        cargarUsuarios();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const submitCambiarPassword = async (e) => {
    e.preventDefault();
    
    if (!formPassword.password || !formPassword.confirmPassword) {
      showError('Por favor complete todos los campos');
      return;
    }

    if (formPassword.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formPassword.password !== formPassword.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await authService.resetearPasswordPorAdmin(
        usuarioSeleccionado._id, 
        { password: formPassword.password }
      );
      if (response.success) {
        showSuccess('Contraseña actualizada exitosamente');
        setShowModalPassword(false);
        setFormPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  const toggleEstadoUsuario = async (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    const confirmado = await showConfirm({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de ${accion} a ${usuario.nombre}?`,
      confirmText: `Sí, ${accion}`,
      cancelText: 'Cancelar'
    });

    if (!confirmado) return;

    try {
      const response = await authService.toggleEstadoUsuario(usuario._id);
      if (response.success) {
        showSuccess(response.message);
        cargarUsuarios();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleEliminar = async (usuario) => {
    const confirmado = await showConfirm({
      title: '¿Eliminar usuario?',
      text: `¿Estás seguro de eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmado) return;

    try {
      const response = await authService.eliminarAdministrador(usuario._id);
      if (response.success) {
        showSuccess('Usuario eliminado exitosamente');
        cargarUsuarios();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al eliminar usuario');
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
      <div className="gestion-main-card">
        <div className="gestion-header">
          <div className="header-title">
            <h2>Gestión de usuarios</h2>
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

        <div className="table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id}>
                    <td>
                      <div className="usuario-cell">
                        <div className="avatar-circle">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="usuario-info">
                          <span className="usuario-nombre">{usuario.nombre}</span>
                          <span className="usuario-email">{usuario.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-rol ${usuario.rol}`}>
                        {usuario.rol === 'superadmin' ? 'Super Admin' : 'Administrador'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${usuario.activo ? 'active' : 'inactive'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {usuario.rol !== 'superadmin' ? (
                          <>
                            <button
                              className="btn-action edit"
                              onClick={() => handleEditarUsuario(usuario)}
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="btn-action password"
                              onClick={() => handleCambiarPassword(usuario)}
                              title="Cambiar contraseña"
                            >
                              <Lock size={18} />
                            </button>
                            <button
                              className={`btn-action ${usuario.activo ? 'deactivate' : 'activate'}`}
                              onClick={() => toggleEstadoUsuario(usuario)}
                              title={usuario.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={18} />
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleEliminar(usuario)}
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="protected-badge">
                            <Shield size={14} /> Protegido
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              <div className="modal-title-wrapper">
                <div className="modal-icon-bg">
                  <Edit2 size={24} />
                </div>
                <h3>Editar usuario</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowModalEditar(false)}>
                <X size={24} />
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
                <button 
                  type="submit" 
                  className="btn-submit-modern"
                  disabled={!hasChanges()}
                  style={{ opacity: !hasChanges() ? 0.5 : 1, cursor: !hasChanges() ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={18} /> Guardar cambios
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
              <div className="modal-title-wrapper">
                <div className="modal-icon-bg">
                  <Lock size={24} />
                </div>
                <h3>Cambiar contraseña</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowModalPassword(false)}>
                <X size={24} />
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
                  <Save size={18} /> Actualizar contraseña
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
