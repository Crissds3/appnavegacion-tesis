import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { infoService, carrerasService } from '../../servicios/api';
import { 
  Map, 
  ArrowLeft, 
  Home, 
  Building2, 
  GraduationCap, 
  Clock, 
  MapPin, 
  ExternalLink, 
  X, 
  Info,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import './SobreUniversidad.css';

const SobreUniversidad = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [infoGeneral, setInfoGeneral] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null);
  const [infoSeleccionada, setInfoSeleccionada] = useState(null);
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

  const abrirDetalleInfo = (info) => {
    setInfoSeleccionada(info);
  };

  const cerrarDetalleInfo = () => {
    setInfoSeleccionada(null);
  };

  return (
    <div className="sobre-universidad-container">
      <Navbar brandName="Módulo informativo">
        <div className="navbar-buttons">
          <button onClick={() => navigate('/wayfinding')} className="btn-nav btn-wayfinding">
            <Map size={18} />
            <span>Wayfinding</span>
          </button>
          <button onClick={() => navigate('/estudiante')} className="btn-nav btn-volver">
            <ArrowLeft size={18} />
            <span>Volver</span>
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
              <Building2 size={20} />
              <span>Información General</span>
            </button>
            <button
              className={`tab-nav-button ${seccionActiva === 'carreras' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('carreras')}
            >
              <GraduationCap size={20} />
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
                <div className="tab-panel fade-in">
                  {infoGeneral.length === 0 ? (
                    <div className="empty-state">
                      <Info size={48} className="empty-icon" />
                      <p>No hay información disponible en este momento</p>
                    </div>
                  ) : (
                    <div className="info-grid">
                      {infoGeneral.map((info) => (
                        <div key={info._id} className="info-card" onClick={() => abrirDetalleInfo(info)}>
                          <div className="info-card-icon">
                            <BookOpen size={24} />
                          </div>
                          <div className="info-card-content">
                            <h3>{info.titulo}</h3>
                            <p>
                              {info.contenido.length > 100 
                                ? info.contenido.substring(0, 100) + '...' 
                                : info.contenido}
                            </p>
                            <span className="btn-leer-mas">
                              Leer más <ChevronRight size={16} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CARRERAS */}
              {seccionActiva === 'carreras' && (
                <div className="tab-panel fade-in">
                  {carreras.length === 0 ? (
                    <div className="empty-state">
                      <GraduationCap size={48} className="empty-icon" />
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
                            <div className="carrera-card-header">
                              <div className="carrera-icon-wrapper">
                                <GraduationCap size={24} />
                              </div>
                              <h4>{carrera.nombre}</h4>
                            </div>
                            <div className="carrera-card-body">
                              <div className="carrera-meta">
                                <div className="meta-item">
                                  <Clock size={16} />
                                  <span>{carrera.duracion}</span>
                                </div>
                                <div className="meta-item">
                                  <MapPin size={16} />
                                  <span>{carrera.modalidad}</span>
                                </div>
                              </div>
                              <button 
                                className="btn-ver-detalles"
                                onClick={() => abrirDetalleCarrera(carrera)}
                              >
                                Ver detalles
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

      {/* MODAL INFORMACIÓN GENERAL */}
      {infoSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content-info" onClick={(e) => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarDetalleInfo}>
              <X size={24} />
            </button>
            
            <div className="modal-header-simple">
              <div className="modal-icon-large">
                <BookOpen size={32} />
              </div>
              <h2>{infoSeleccionada.titulo}</h2>
            </div>
            
            <div className="modal-body-scroll">
              <p className="info-full-text">{infoSeleccionada.contenido}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CARRERA */}
      {carreraSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content-carrera" onClick={(e) => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarDetalleCarrera}>
              <X size={24} />
            </button>

            <div className="modal-carrera-header-styled">
              <div className="header-content">
                <h2>{carreraSeleccionada.nombre}</h2>
                <div className="badges-container">
                  <span className="badge-modal">
                    <MapPin size={14} /> {carreraSeleccionada.modalidad}
                  </span>
                  <span className="badge-modal">
                    <Clock size={14} /> {carreraSeleccionada.duracion}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-body-scroll">
              <div className="modal-section">
                <h3>
                  <BookOpen size={20} />
                  Descripción
                </h3>
                <p>{carreraSeleccionada.descripcion}</p>
              </div>

              {carreraSeleccionada.ubicacion && (
                <div className="modal-section">
                  <h3>
                    <MapPin size={20} />
                    Ubicación
                  </h3>
                  {typeof carreraSeleccionada.ubicacion === 'object' ? (
                    <div className="ubicacion-action-wrapper">
                      <p className="ubicacion-nombre">{carreraSeleccionada.ubicacion.nombre}</p>
                      <button 
                        className="btn-ir-ubicacion"
                        onClick={() => navigate('/wayfinding', { state: { destinoId: carreraSeleccionada.ubicacion._id } })}
                      >
                        <Map size={18} />
                        Ir al edificio
                      </button>
                    </div>
                  ) : (
                    <p>{carreraSeleccionada.ubicacion}</p>
                  )}
                </div>
              )}

              <div className="modal-footer-action">
                <a 
                  href={carreraSeleccionada.enlaceOficial} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-enlace-oficial"
                >
                  <span>Ver sitio oficial</span>
                  <ExternalLink size={18} />
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
