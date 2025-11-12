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

  const agruparPorFacultad = () => {
    const agrupadas = {};
    carreras.forEach(carrera => {
      if (!agrupadas[carrera.facultad]) {
        agrupadas[carrera.facultad] = [];
      }
      agrupadas[carrera.facultad].push(carrera);
    });
    return agrupadas;
  };

  const carrerasPorFacultad = agruparPorFacultad();

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

                      {Object.entries(carrerasPorFacultad).map(([facultad, carrerasFacultad]) => (
                        <div key={facultad} className="facultad-section">
                          <h3 className="facultad-titulo">
                            <span className="facultad-icon">🏫</span>
                            {facultad}
                          </h3>
                          <div className="carreras-grid">
                            {carrerasFacultad.map((carrera) => (
                              <div key={carrera._id} className="carrera-card-estudiante">
                                {carrera.imagenUrl && (
                                  <div 
                                    className="carrera-imagen"
                                    style={{ backgroundImage: `url(${carrera.imagenUrl})` }}
                                  />
                                )}
                                <div className="carrera-card-body">
                                  <h4>{carrera.nombre}</h4>
                                  <p className="carrera-codigo">{carrera.codigo}</p>
                                  <p className="carrera-grado">{carrera.grado}</p>
                                  <div className="carrera-detalles-mini">
                                    <span>⏱️ {carrera.duracion}</span>
                                    <span>📍 {carrera.modalidad}</span>
                                  </div>
                                  <p className="carrera-descripcion-mini">
                                    {carrera.descripcion.substring(0, 100)}...
                                  </p>
                                  <button 
                                    className="btn-ver-mas"
                                    onClick={() => abrirDetalleCarrera(carrera)}
                                  >
                                    Ver más información
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
            
            {carreraSeleccionada.imagenUrl && (
              <div 
                className="modal-carrera-imagen"
                style={{ backgroundImage: `url(${carreraSeleccionada.imagenUrl})` }}
              />
            )}

            <div className="modal-carrera-body">
              <div className="modal-carrera-header">
                <h2>{carreraSeleccionada.nombre}</h2>
                <p className="modal-carrera-codigo">{carreraSeleccionada.codigo}</p>
                <div className="modal-carrera-badges">
                  <span className="badge-modal">{carreraSeleccionada.grado}</span>
                  <span className="badge-modal">{carreraSeleccionada.modalidad}</span>
                  <span className="badge-modal">⏱️ {carreraSeleccionada.duracion}</span>
                </div>
              </div>

              <div className="modal-carrera-seccion">
                <h3> Descripción</h3>
                <p>{carreraSeleccionada.descripcion}</p>
              </div>

              {carreraSeleccionada.requisitos && (
                <div className="modal-carrera-seccion">
                  <h3> Requisitos de Ingreso</h3>
                  <p>{carreraSeleccionada.requisitos}</p>
                </div>
              )}

              {carreraSeleccionada.perfilEgreso && (
                <div className="modal-carrera-seccion">
                  <h3> Perfil de Egreso</h3>
                  <p>{carreraSeleccionada.perfilEgreso}</p>
                </div>
              )}

              {carreraSeleccionada.campoLaboral && (
                <div className="modal-carrera-seccion">
                  <h3> Campo Laboral</h3>
                  <p>{carreraSeleccionada.campoLaboral}</p>
                </div>
              )}

              {carreraSeleccionada.mallaCurricular && (
                <div className="modal-carrera-seccion">
                  <h3> Malla Curricular</h3>
                  <p>{carreraSeleccionada.mallaCurricular}</p>
                </div>
              )}

              {(carreraSeleccionada.contacto?.email || 
                carreraSeleccionada.contacto?.telefono || 
                carreraSeleccionada.contacto?.oficina) && (
                <div className="modal-carrera-seccion modal-contacto">
                  <h3>📞 Información de Contacto</h3>
                  <div className="contacto-info">
                    {carreraSeleccionada.contacto.email && (
                      <p>✉️ <strong>Email:</strong> {carreraSeleccionada.contacto.email}</p>
                    )}
                    {carreraSeleccionada.contacto.telefono && (
                      <p>📱 <strong>Teléfono:</strong> {carreraSeleccionada.contacto.telefono}</p>
                    )}
                    {carreraSeleccionada.contacto.oficina && (
                      <p>🏢 <strong>Oficina:</strong> {carreraSeleccionada.contacto.oficina}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-carrera-footer">
                <p className="modal-facultad">
                  <strong>Facultad:</strong> {carreraSeleccionada.facultad}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SobreUniversidad;
