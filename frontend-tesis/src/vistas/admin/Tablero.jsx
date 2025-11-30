import { useAuth } from '../../contexto/ContextoAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../../componentes/compartidos/Navbar';
import GestionNoticias from '../../componentes/admin/GestionNoticias';
import GestionInfoUniversidad from '../../componentes/admin/GestionInfoUniversidad';
import GestionUsuarios from '../../componentes/admin/GestionUsuarios';
import GestionUbicaciones from '../../componentes/admin/GestionUbicaciones';
import './Tablero.css';

const Tablero = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contenidos');
  const [showProfile, setShowProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <Navbar brandName="Sistema de gestión de información">
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
                      {user?.rol === 'superadmin' ? 'Super Admin' : user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
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
            {user?.rol === 'superadmin' && (
              <button 
                className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Usuarios
              </button>
            )}
          </div>

          {/* Contenido según tab activo */}
          {activeTab === 'contenidos' && (
            <div className="tab-content">
              <GestionNoticias />

              <div className="section-divider"></div>

              <GestionInfoUniversidad />
            </div>
          )}

          {activeTab === 'ubicaciones' && (
            <div className="tab-content">
              <GestionUbicaciones />
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

          {activeTab === 'admin' && user?.rol === 'superadmin' && (
            <div className="tab-content">
              <GestionUsuarios />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tablero;
