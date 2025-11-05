import { useAuth } from '../../contexto/ContextoAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../../componentes/compartidos/Navbar';
import CrearAdmin from '../../componentes/admin/CrearAdmin';
import GestionNoticias from '../../componentes/admin/GestionNoticias';
import './Tablero.css';

const Tablero = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contenidos');
  const [showProfile, setShowProfile] = useState(false);
  const [showCrearAdmin, setShowCrearAdmin] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [administradores, setAdministradores] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSuccessCrearAdmin = (message) => {
    setShowCrearAdmin(false);
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    // Recargar lista de administradores
    if (activeTab === 'admin') {
      cargarAdministradores();
    }
  };

  const cargarAdministradores = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/administradores', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdministradores(data.data);
      }
    } catch (error) {
      console.error('Error al cargar administradores:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleEliminarAdmin = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este administrador?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/auth/administradores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Administrador eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 5000);
        cargarAdministradores();
      }
    } catch (error) {
      console.error('Error al eliminar administrador:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      cargarAdministradores();
    }
  }, [activeTab]);

  return (
    <div className="dashboard-container">
      <Navbar brandName="Campus AR Platform">
        <div className="navbar-user-section">
          <div className="user-info-wrapper">
            <button onClick={() => setShowProfile(!showProfile)} className="btn-user-profile">
              <span className="user-icon">👤</span>
              <span className="user-name">{user?.nombre}</span>
              <span className="user-arrow">{showProfile ? '▲' : '▼'}</span>
            </button>
            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    <span>{user?.nombre?.charAt(0)}</span>
                  </div>
                  <div className="profile-info">
                    <p className="profile-name">{user?.nombre}</p>
                    <p className="profile-email">{user?.email}</p>
                    <span className={`profile-badge badge-${user?.rol}`}>
                      {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </div>
                </div>
                <div className="profile-dropdown-actions">
                  <button onClick={handleLogout} className="btn-logout-dropdown">
                    <span></span> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Navbar>

      <main className="main-content">
        {/* Header estilo estudiante */}
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <p className="dashboard-subtitle">Gestiona el contenido y configuración de la plataforma</p>
        </div>

        <div className="dashboard-content">
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="success-message">
              <span>✓ {successMessage}</span>
            </div>
          )}
          {/* Tabs de navegación */}
          <div className="tabs-container">
            <button 
              className={`tab-button ${activeTab === 'contenidos' ? 'active' : ''}`}
              onClick={() => setActiveTab('contenidos')}
            >
              Contenidos
            </button>
            <button 
              className={`tab-button ${activeTab === 'ubicaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('ubicaciones')}
            >
              Ubicaciones
            </button>
            <button 
              className={`tab-button ${activeTab === 'ar' ? 'active' : ''}`}
              onClick={() => setActiveTab('ar')}
            >
              AR
            </button>
            <button 
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Administradores
            </button>
          </div>

          {/* Modal de crear administrador */}
          {showCrearAdmin && (
            <CrearAdmin 
              onClose={() => setShowCrearAdmin(false)}
              onSuccess={handleSuccessCrearAdmin}
            />
          )}

          {/* Contenido según tab activo */}
          {activeTab === 'contenidos' && (
            <div className="tab-content">
              <GestionNoticias />

              <div className="section-card" style={{ marginTop: '30px' }}>
                <div className="section-header">
                  <h2>Información Estática de la Universidad</h2>
                  <p className="section-subtitle">
                    Actualiza información sobre la universidad y las carreras
                  </p>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <h4>Misión</h4>
                    <p>Configurar la misión institucional</p>
                    <button className="btn-secondary-sm">Editar</button>
                  </div>
                  <div className="info-item">
                    <h4>Visión</h4>
                    <p>Configurar la visión institucional</p>
                    <button className="btn-secondary-sm">Editar</button>
                  </div>
                  <div className="info-item">
                    <h4>Carreras</h4>
                    <p>Gestionar información de carreras</p>
                    <button className="btn-secondary-sm">Editar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ubicaciones' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-header">
                  <h2>Gestión de Ubicaciones</h2>
                  <p className="section-subtitle">
                    Administra los puntos de interés del campus
                  </p>
                </div>
                <div className="empty-state">
                  <p>🗺️ Módulo de ubicaciones en desarrollo...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ar' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-header">
                  <h2>Contenido de Realidad Aumentada</h2>
                  <p className="section-subtitle">
                    Gestiona los elementos AR del campus
                  </p>
                </div>
                <div className="empty-state">
                  <p>🎯 Módulo AR en desarrollo...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-header">
                  <h2>Gestión de Administradores</h2>
                  <p className="section-subtitle">
                    Administra los usuarios con permisos de administración
                  </p>
                </div>
                <div className="admin-actions">
                  <button onClick={() => setShowCrearAdmin(true)} className="btn-create-admin-main">
                    <span className="btn-icon">+</span>
                    <span>Crear Nuevo Administrador</span>
                  </button>
                </div>

                {loadingAdmins ? (
                  <div className="loading-state">Cargando administradores...</div>
                ) : administradores.length === 0 ? (
                  <div className="empty-state">
                    <p>👥 No hay administradores registrados</p>
                  </div>
                ) : (
                  <div className="admins-table-container">
                    <table className="admins-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Fecha de Registro</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {administradores.map((admin) => (
                          <tr key={admin._id}>
                            <td>
                              <div className="admin-name-cell">
                                <div className="admin-avatar-small">
                                  {admin.nombre?.charAt(0)}
                                </div>
                                <span>{admin.nombre}</span>
                              </div>
                            </td>
                            <td>{admin.email}</td>
                            <td>{new Date(admin.createdAt).toLocaleDateString('es-CL')}</td>
                            <td>
                              <div className="admin-table-actions">
                                {admin._id !== user?._id && (
                                  <button
                                    onClick={() => handleEliminarAdmin(admin._id)}
                                    className="btn-delete-admin"
                                    title="Eliminar administrador"
                                  >
                                    🗑️
                                  </button>
                                )}
                                {admin._id === user?._id && (
                                  <span className="current-user-badge">Tú</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tablero;
