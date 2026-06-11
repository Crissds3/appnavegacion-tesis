import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import CrearAdmin from './CrearAdmin';
import {
  User, Edit2, Lock, Trash2, Power, Search, X, Save, Shield, Plus,
} from 'lucide-react';
import './GestionUsuarios.css';

const Modal = ({ title, icon: Icon, onClose, children }) => createPortal(
  <div className="gu-modal-overlay">
    <div className="gu-modal" onClick={e => e.stopPropagation()}>
      <div className="gu-modal-header">
        <div className="gu-modal-title-row">
          <div className="gu-modal-icon"><Icon size={20} /></div>
          <h3>{title}</h3>
        </div>
        <button className="gu-modal-close" onClick={onClose}><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

const GestionUsuarios = () => {
  const [usuarios,            setUsuarios]           = useState([]);
  const [loading,             setLoading]            = useState(true);
  const [showModalEditar,     setShowModalEditar]    = useState(false);
  const [showModalPassword,   setShowModalPassword]  = useState(false);
  const [showCrearAdmin,      setShowCrearAdmin]     = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado]= useState(null);
  const [usuarioOriginal,     setUsuarioOriginal]    = useState(null);
  const [filtro,              setFiltro]             = useState('');

  const [formEditar,   setFormEditar]   = useState({ nombre: '', email: '', rol: 'admin' });
  const [formPassword, setFormPassword] = useState({ password: '', confirmPassword: '' });

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await authService.getAdministradores();
      if (res.success) setUsuarios(res.data);
    } catch { showError('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };

  const handleSuccessCrearAdmin = (msg) => { setShowCrearAdmin(false); showSuccess(msg); cargarUsuarios(); };

  const handleEditarUsuario = (u) => {
    setUsuarioSeleccionado(u);
    const d = { nombre: u.nombre, email: u.email, rol: u.rol };
    setFormEditar(d); setUsuarioOriginal(d); setShowModalEditar(true);
  };

  const handleCambiarPassword = (u) => {
    setUsuarioSeleccionado(u);
    setFormPassword({ password: '', confirmPassword: '' });
    setShowModalPassword(true);
  };

  const hasChanges = () => !usuarioOriginal || JSON.stringify(formEditar) !== JSON.stringify(usuarioOriginal);

  const submitEditar = async (e) => {
    e.preventDefault();
    if (!formEditar.nombre || !formEditar.email) { showError('Completa todos los campos'); return; }
    try {
      const res = await authService.editarUsuario(usuarioSeleccionado._id, formEditar);
      if (res.success) { showSuccess('Usuario actualizado'); setShowModalEditar(false); cargarUsuarios(); }
    } catch (err) { showError(err.response?.data?.message || 'Error al actualizar'); }
  };

  const submitCambiarPassword = async (e) => {
    e.preventDefault();
    if (!formPassword.password || !formPassword.confirmPassword) { showError('Completa todos los campos'); return; }
    if (formPassword.password.length < 6) { showError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (formPassword.password !== formPassword.confirmPassword) { showError('Las contraseñas no coinciden'); return; }
    try {
      const res = await authService.resetearPasswordPorAdmin(usuarioSeleccionado._id, { password: formPassword.password });
      if (res.success) { showSuccess('Contraseña actualizada'); setShowModalPassword(false); }
    } catch (err) { showError(err.response?.data?.message || 'Error al cambiar contraseña'); }
  };

  const toggleEstadoUsuario = async (u) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    const ok = await showConfirm({ title: `¿${accion.charAt(0).toUpperCase()+accion.slice(1)} usuario?`, text: `¿Seguro de ${accion} a ${u.nombre}?`, confirmText: `Sí, ${accion}`, cancelText: 'Cancelar' });
    if (!ok) return;
    try {
      const res = await authService.toggleEstadoUsuario(u._id);
      if (res.success) { showSuccess(res.message); cargarUsuarios(); }
    } catch (err) { showError(err.response?.data?.message || 'Error al cambiar estado'); }
  };

  const handleEliminar = async (u) => {
    const ok = await showConfirm({ title: '¿Eliminar usuario?', text: `¿Seguro de eliminar a ${u.nombre}? Esta acción no se puede deshacer.`, confirmText: 'Sí, eliminar', cancelText: 'Cancelar' });
    if (!ok) return;
    try {
      const res = await authService.eliminarAdministrador(u._id);
      if (res.success) { showSuccess('Usuario eliminado'); cargarUsuarios(); }
    } catch (err) { showError(err.response?.data?.message || 'Error al eliminar'); }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const ROL_COLOR = { superadmin: '#8B0000', admin: '#E53935' };
  const ROL_BG    = { superadmin: 'rgba(139,0,0,.12)', admin: 'rgba(229,57,53,.10)' };
  const ROL_LABEL = { superadmin: 'Super Admin', admin: 'Administrador' };

  return (
    <div className="guu-wrap">

      {/* Cabecera */}
      <div className="guu-header">
        <p className="guu-subtitle">{usuarios.length} administradores registrados en el sistema</p>
        <div className="guu-header-right">
          <div className="guu-search">
            <Search size={16} />
            <input type="text" placeholder="Buscar por nombre o email…"
              value={filtro} onChange={e => setFiltro(e.target.value)} />
            {filtro && <button onClick={() => setFiltro('')}><X size={13} /></button>}
          </div>
          <button className="guu-btn-add" onClick={() => setShowCrearAdmin(true)}>
            <Plus size={17} /> Nuevo administrador
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="guu-state"><div className="guu-spinner" /><p>Cargando usuarios…</p></div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="guu-state"><User size={34} opacity={.25} /><p>No se encontraron usuarios</p></div>
      ) : (
        <div className="guu-grid">
          {usuariosFiltrados.map(u => (
            <div key={u._id} className={`guu-card ${u.rol === 'superadmin' ? 'guu-card--superadmin' : ''} ${!u.activo ? 'guu-card--inactive' : ''}`}>
              {/* Avatar + nombre */}
              <div className="guu-card-top">
                <div className="guu-avatar" style={{ background: ROL_BG[u.rol] || 'rgba(229,57,53,.10)', color: ROL_COLOR[u.rol] || '#E53935' }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="guu-card-info">
                  <span className="guu-name">{u.nombre}</span>
                  <span className="guu-email">{u.email}</span>
                </div>
                {!u.activo && <span className="guu-inactive-chip">Inactivo</span>}
              </div>

              {/* Rol + estado */}
              <div className="guu-card-meta">
                <span className="guu-badge-rol" style={{ background: ROL_BG[u.rol] || 'rgba(229,57,53,.10)', color: ROL_COLOR[u.rol] || '#E53935' }}>
                  {u.rol === 'superadmin' && <Shield size={11} />}
                  {ROL_LABEL[u.rol] || u.rol}
                </span>
                <span className={`guu-badge-status ${u.activo ? 'guu-badge-status--on' : 'guu-badge-status--off'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones */}
              <div className="guu-card-actions">
                {u.rol !== 'superadmin' ? (
                  <>
                    <button className="guu-btn guu-btn--edit"   title="Editar"           onClick={() => handleEditarUsuario(u)}><Edit2 size={15} /></button>
                    <button className="guu-btn guu-btn--lock"   title="Contraseña"       onClick={() => handleCambiarPassword(u)}><Lock size={15} /></button>
                    <button className={`guu-btn ${u.activo ? 'guu-btn--off' : 'guu-btn--on'}`} title={u.activo ? 'Desactivar' : 'Activar'} onClick={() => toggleEstadoUsuario(u)}><Power size={15} /></button>
                    <button className="guu-btn guu-btn--delete" title="Eliminar"         onClick={() => handleEliminar(u)}><Trash2 size={15} /></button>
                  </>
                ) : (
                  <span className="guu-protected"><Shield size={13} /> Protegido</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Admin */}
      {showCrearAdmin && createPortal(
        <CrearAdmin onClose={() => setShowCrearAdmin(false)} onSuccess={handleSuccessCrearAdmin} />,
        document.body
      )}

      {/* Modal Editar */}
      {showModalEditar && (
        <Modal title="Editar usuario" icon={Edit2} onClose={() => setShowModalEditar(false)}>
          <form onSubmit={submitEditar} className="gu-form" style={{ padding: '20px 24px 24px' }}>
            <div className="gu-field">
              <label>Nombre completo</label>
              <input type="text" value={formEditar.nombre} required
                onChange={e => setFormEditar(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="gu-field">
              <label>Correo electrónico</label>
              <input type="email" value={formEditar.email} required
                onChange={e => setFormEditar(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="gu-form-actions">
              <button type="button" className="gu-btn-cancel" onClick={() => setShowModalEditar(false)}>Cancelar</button>
              <button type="submit" className="gu-btn-save" disabled={!hasChanges()}>
                <Save size={15} /> Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Contraseña */}
      {showModalPassword && (
        <Modal title="Cambiar contraseña" icon={Lock} onClose={() => setShowModalPassword(false)}>
          <form onSubmit={submitCambiarPassword} className="gu-form" style={{ padding: '20px 24px 24px' }}>
            {/* Info usuario */}
            <div className="guu-user-summary">
              <div className="guu-avatar guu-avatar--sm"
                style={{ background: ROL_BG[usuarioSeleccionado?.rol] || 'rgba(229,57,53,.10)', color: ROL_COLOR[usuarioSeleccionado?.rol] || '#E53935' }}>
                {usuarioSeleccionado?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="guu-name">{usuarioSeleccionado?.nombre}</span>
                <span className="guu-email">{usuarioSeleccionado?.email}</span>
              </div>
            </div>
            <div className="gu-field">
              <label>Nueva contraseña</label>
              <input type="password" value={formPassword.password} required
                placeholder="Mínimo 6 caracteres"
                onChange={e => setFormPassword(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="gu-field">
              <label>Confirmar contraseña</label>
              <input type="password" value={formPassword.confirmPassword} required
                placeholder="Repite la contraseña"
                onChange={e => setFormPassword(p => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            <div className="gu-form-actions">
              <button type="button" className="gu-btn-cancel" onClick={() => setShowModalPassword(false)}>Cancelar</button>
              <button type="submit" className="gu-btn-save"><Save size={15} /> Actualizar contraseña</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GestionUsuarios;
