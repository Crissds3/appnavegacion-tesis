import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { infoService, carrerasService } from '../../servicios/api';
import './SobreUniversidad.css';

const SobreUniversidad = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [infoGeneral, setInfoGeneral] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('general');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [infoResponse, carrerasResponse] = await Promise.all([
        infoService.getInfo(),
        carrerasService.getCarreras()
      ]);

      if (infoResponse.success) {
        setInfoGeneral(infoResponse.data);
      }
      if (carrerasResponse.success) {
        setCarreras(carrerasResponse.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalleCarrera = (carrera) => {
    setCarreraSeleccionada(carrera);
  };

  const cerrarDetalleCarrera = () => {
    setCarreraSeleccionada(null);
  };

  return (
    <div className="sobre-universidad-container">
      <Navbar brandName="Módulo informativo">
        <div className="navbar-buttons">
          <button onClick={() => navigate('/wayfinding')} className="btn-wayfinding">
            🗺️ Wayfinding
          </button>
          <button onClick={() => navigate('/estudiante')} className="btn-volver">
            ← Volver
          </button>
          <button onClick={() => navigate('/')} className="btn-inicio">
            Inicio
          </button>
        </div>
      </Navbar>

      <main className="main-content">
        <div className="sobre-header">
          <h1>Sobre la Universidad</h1>
          <p className="sobre-subtitle">Conoce nuestra institución y oferta académica</p>
        </div>

        <div className="sobre-content">
          {/* Navegación de tabs */}
          <div className="tabs-navigation">
            <button
              className={`tab-nav-button ${seccionActiva === 'general' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('general')}
            >
              <span className="tab-icon">🏛️</span>
              <span>Información General</span>
            </button>
            <button
              className={`tab-nav-button ${seccionActiva === 'carreras' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('carreras')}
            >
              <span className="tab-icon">🎓</span>
              <span>Carreras</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando información...</p>
            </div>
          ) : (
            <>
              {/* TAB INFORMACIÓN GENERAL */}
              {seccionActiva === 'general' && (
                <div className="tab-panel">
                  {infoGeneral.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📚</span>
                      <p>No hay información disponible en este momento</p>
                    </div>
                  ) : (
                    <div className="info-grid">
                      {infoGeneral.map((info) => (
                        <div key={info._id} className="info-card">
                          <div className="info-card-header">
                            <span className="info-icon">{info.icono}</span>
                            <h3>{info.titulo}</h3>
                          </div>
                          <div className="info-card-content">
                            <p>{info.contenido}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CARRERAS */}
              {seccionActiva === 'carreras' && (
                <div className="tab-panel">
                  {carreras.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🎓</span>
                      <p>No hay carreras disponibles en este momento</p>
                    </div>
                  ) : (
                    <div className="carreras-section">
                      <div className="carreras-intro">
                        <h2>Oferta académica</h2>
                        <p>Explora nuestras {carreras.length} carreras disponibles</p>
                      </div>

                      <div className="carreras-grid">
                        {carreras.map((carrera) => (
                          <div key={carrera._id} className="carrera-card-estudiante">
                            <div className="carrera-card-body">
                              <h4>{carrera.nombre}</h4>
                              <div className="carrera-detalles-mini">
                                <span>⏱️ {carrera.duracion}</span>
                                <span>📍 {carrera.modalidad}</span>
                              </div>
                              <p className="carrera-descripcion-mini">
                                {carrera.descripcion.length > 150 
                                  ? carrera.descripcion.substring(0, 150) + '...' 
                                  : carrera.descripcion}
                              </p>
                              <button 
                                className="btn-ver-mas"
                                onClick={() => abrirDetalleCarrera(carrera)}
                              >
                                📖 Ver detalles
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL DETALLE DE CARRERA */}
      {carreraSeleccionada && (
        <div className="modal-overlay-carrera" onClick={cerrarDetalleCarrera}>
          <div className="modal-carrera-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarDetalleCarrera}>
              ✕
            </button>

            <div className="modal-carrera-body">
              <div className="modal-carrera-header">
                <h2>{carreraSeleccionada.nombre}</h2>
                <div className="modal-carrera-badges">
                  <span className="badge-modal">📍 {carreraSeleccionada.modalidad}</span>
                  <span className="badge-modal">⏱️ {carreraSeleccionada.duracion}</span>
                </div>
              </div>

              <div className="modal-carrera-seccion">
                <h3>📄 Descripción</h3>
                <p>{carreraSeleccionada.descripcion}</p>
              </div>

              {/* Espacio reservado para ubicación futura */}
              {carreraSeleccionada.ubicacion && (
                <div className="modal-carrera-seccion">
                  <h3>📍 Ubicación</h3>
                  <p>{carreraSeleccionada.ubicacion}</p>
                </div>
              )}

              <div className="modal-carrera-footer">
                <a 
                  href={carreraSeleccionada.enlaceOficial} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-enlace-oficial"
                >
                  🔗 Ver información completa en el sitio oficial
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SobreUniversidad;
