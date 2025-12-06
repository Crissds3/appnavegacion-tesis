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
  const [isProfileFixed, setIsProfileFixed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Contenidos', onClick: () => setActiveTab('contenidos'), active: activeTab === 'contenidos' },
    { name: 'Ubicaciones', onClick: () => setActiveTab('ubicaciones'), active: activeTab === 'ubicaciones' },
    { name: 'AR', onClick: () => setActiveTab('ar'), active: activeTab === 'ar' },
  ];

  if (user?.rol === 'superadmin') {
    navLinks.push({ name: 'Usuarios', onClick: () => setActiveTab('admin'), active: activeTab === 'admin' });
  }

  const formatName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    // Retorna el primer nombre y la inicial del segundo nombre/apellido
    return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
  };

  const handleProfileClick = () => {
    setIsProfileFixed(!isProfileFixed);
    if (isProfileFixed) {
      setShowProfile(false);
    } else {
      setShowProfile(true);
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar brandName="Sistema de gestión" customLinks={navLinks}>
        <div className="navbar-user-section">
          <div 
            className="user-info-wrapper"
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => !isProfileFixed && setShowProfile(false)}
          >
            <button 
              className={`btn-user-profile ${isProfileFixed ? 'active' : ''}`}
              onClick={handleProfileClick}
            >
              <div className="user-avatar-circle-small">
                {user?.nombre?.charAt(0)}
              </div>
              <span className="user-name">{formatName(user?.nombre)}</span>
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
          <h1>Panel de administración</h1>
          <p className="dashboard-subtitle">Gestiona el contenido y configuración de la plataforma</p>
        </div>

        <div className="dashboard-content">
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="success-message">
              <span>✓ {successMessage}</span>
            </div>
          )}
          {/* Tabs de navegación movidos al Navbar */}

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
