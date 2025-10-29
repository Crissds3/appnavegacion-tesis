import { useAuth } from '../contexto/ContextoAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../componentes/Navbar';
import './Tablero.css';

const Tablero = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contenidos');
  const [showProfile, setShowProfile] = useState(false);

  // Datos de ejemplo para noticias y eventos
  const [noticias, setNoticias] = useState([
    {
      id: 1,
      tipo: 'Evento',
      titulo: 'Conferencia: IA en la Educación',
      categoria: 'Académico'
    },
    {
      id: 2,
      tipo: 'Noticia',
      titulo: 'Nueva biblioteca digital',
      categoria: 'Académico'
    },
    {
      id: 3,
      tipo: 'Evento',
      titulo: 'Festival cultural',
      categoria: 'Cultural'
    }
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddNoticia = () => {
    const nuevaNoticia = {
      id: noticias.length + 1,
      tipo: 'Noticia',
      titulo: 'Nueva noticia',
      categoria: 'General'
    };
    setNoticias([...noticias, nuevaNoticia]);
  };

  const handleDeleteNoticia = (id) => {
    setNoticias(noticias.filter(noticia => noticia.id !== id));
  };

  return (
    <div className="dashboard-container">
      <Navbar brandName="Campus AR Platform">
        <div className="navbar-user-section">
          <button onClick={() => setShowProfile(!showProfile)} className="btn-profile">
            👤 {user?.nombre}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </Navbar>

      <div className="dashboard-content">
        {/* Tabs de navegación */}
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'contenidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('contenidos')}
          >
            � Contenidos
          </button>
          <button 
            className={`tab-button ${activeTab === 'ubicaciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('ubicaciones')}
          >
            📍 Ubicaciones
          </button>
          <button 
            className={`tab-button ${activeTab === 'ar' ? 'active' : ''}`}
            onClick={() => setActiveTab('ar')}
          >
            🎯 AR
          </button>
        </div>

        {/* Modal de perfil */}
        {showProfile && (
          <div className="profile-modal">
            <div className="profile-card">
              <div className="profile-header">
                <h3>Información del Usuario</h3>
                <button onClick={() => setShowProfile(false)} className="btn-close">✕</button>
              </div>
              <div className="profile-body">
                <div className="info-row">
                  <span className="label">Nombre:</span>
                  <span className="value">{user?.nombre}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Rol:</span>
                  <span className={`badge badge-${user?.rol}`}>
                    {user?.rol === 'admin' ? '👑 Administrador' : '👤 Usuario'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido según tab activo */}
        {activeTab === 'contenidos' && (
          <div className="tab-content">
            <div className="section-card">
              <div className="section-header">
                <h2>Gestión de Noticias y Eventos</h2>
                <p className="section-subtitle">
                  Crea, edita y gestiona el contenido que verán los estudiantes
                </p>
              </div>

              <button onClick={handleAddNoticia} className="btn-add">
                + Agregar
              </button>

              <div className="table-container">
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Título</th>
                      <th>Categoría</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noticias.map((noticia) => (
                      <tr key={noticia.id}>
                        <td>
                          <span className={`tipo-badge ${noticia.tipo.toLowerCase()}`}>
                            {noticia.tipo}
                          </span>
                        </td>
                        <td>{noticia.titulo}</td>
                        <td>{noticia.categoria}</td>
                        <td>
                          <button className="btn-action btn-edit">✏️</button>
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteNoticia(noticia.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
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
      </div>
    </div>
  );
};

export default Tablero;
