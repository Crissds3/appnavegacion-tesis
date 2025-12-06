import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { noticiasService } from '../../servicios/api';
import { 
  Calendar, 
  MapPin, 
  User, 
  Star, 
  Building2, 
  Map, 
  Home,
  X,
  ArrowRight
} from 'lucide-react';
import './Principal.css';

const Principal = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', categoria: '' });
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

  const categorias = [
    'Académico',
    'Cultural',
    'Deportivo',
    'Investigación',
    'Extensión',
    'Administrativo',
    'Otro'
  ];

  useEffect(() => {
    cargarNoticias();
  }, [filtros]);

  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const response = await noticiasService.getNoticias(filtros);
      if (response.success) {
        setNoticias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirNoticia = async (id) => {
    try {
      const response = await noticiasService.getNoticiaById(id);
      if (response.success) {
        setNoticiaSeleccionada(response.data);
      }
    } catch (error) {
      console.error('Error al cargar noticia:', error);
    }
  };

  const cerrarNoticia = () => {
    setNoticiaSeleccionada(null);
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const noticiasDestacadas = noticias.filter(n => n.destacado);
  const noticiasNormales = noticias.filter(n => !n.destacado);

  return (
    <div className="principal-container">
      <Navbar brandName="Módulo informativo">
        <div className="navbar-buttons">
          <button onClick={() => navigate('/sobre-universidad')} className="btn-info-universidad">
            <Building2 size={18} />
            Sobre la Universidad
          </button>
          <button onClick={() => navigate('/wayfinding')} className="btn-wayfinding">
            <Map size={18} />
            Wayfinding
          </button>
          <button onClick={() => navigate('/')} className="btn-inicio">
            <Home size={18} />
            Inicio
          </button>
        </div>
      </Navbar>

      <main className="main-content">
        <div className="feed-noticias">
          <div className="feed-noticias-header">
            <h1>Noticias y eventos</h1>
            <p className="feed-subtitle">Mantente informado sobre las últimas novedades del campus</p>
          </div>

          <div className="feed-noticias-content">
            <div className="feed-controls">
              <div className="filtros">
                <select 
                  value={filtros.tipo} 
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                  className="filtro-select"
                >
                  <option value="">Todos</option>
                  <option value="Noticia">Noticias</option>
                  <option value="Evento">Eventos</option>
                  <option value="Anuncio">Anuncios</option>
                </select>

                <select 
                  value={filtros.categoria} 
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                  className="filtro-select"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-feed">
                <div className="spinner"></div>
                <p>Cargando contenido...</p>
              </div>
            ) : (
              <div className="feed-noticias-main">
                {noticiasDestacadas.length > 0 && (
                  <div className="destacadas-section">
                    <h3 className="section-title">
                      <Star className="icon-destacado" size={24} fill="#FFC107" color="#FFC107" /> 
                      Destacadas
                    </h3>
                    <div className="destacadas-grid">
                      {noticiasDestacadas.map(noticia => (
                        <div 
                          key={noticia._id} 
                          className="card-destacada"
                          onClick={() => abrirNoticia(noticia._id)}
                        >
                          {(noticia.imagenBase64 || noticia.imagenUrl) && (
                            <div 
                              className="card-imagen"
                              style={{ backgroundImage: `url(${noticia.imagenBase64 || noticia.imagenUrl})` }}
                            >
                              <div className="card-overlay"></div>
                            </div>
                          )}
                          <div className="card-content-destacada">
                            <div className="card-badges">
                              <span className={`badge-tipo ${noticia.tipo.toLowerCase()}`}>
                                {noticia.tipo}
                              </span>
                              <span className="badge-categoria">
                                {noticia.categoria}
                              </span>
                            </div>
                            <h4>{noticia.titulo}</h4>
                            <p className="descripcion">{noticia.descripcion}</p>
                            {noticia.tipo === 'Evento' && noticia.fechaEvento && (
                              <div className="info-evento">
                                <span>
                                  <Calendar size={14} />
                                  {formatearFecha(noticia.fechaEvento)}
                                </span>
                                {noticia.ubicacionEvento && (
                                  <span>
                                    <MapPin size={14} />
                                    {noticia.ubicacionEvento}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {noticiasNormales.length > 0 && (
                  <div className="noticias-section">
                    <h3 className="section-title">Recientes</h3>
                    <div className="noticias-grid">
                      {noticiasNormales.map(noticia => (
                        <div 
                          key={noticia._id} 
                          className="card-noticia"
                          onClick={() => abrirNoticia(noticia._id)}
                        >
                          {(noticia.imagenBase64 || noticia.imagenUrl) && (
                            <div 
                              className="card-imagen-small"
                              style={{ backgroundImage: `url(${noticia.imagenBase64 || noticia.imagenUrl})` }}
                            />
                          )}
                          <div className="card-content">
                            <div className="card-badges">
                              <span className={`badge-tipo ${noticia.tipo.toLowerCase()}`}>
                                {noticia.tipo}
                              </span>
                              <span className="badge-categoria">
                                {noticia.categoria}
                              </span>
                            </div>
                            <h4>{noticia.titulo}</h4>
                            <p className="descripcion">{noticia.descripcion}</p>
                            <div className="card-footer">
                              <span className="fecha">
                                <Calendar size={14} />
                                {formatearFecha(noticia.createdAt)}
                              </span>
                              <span className="ver-mas">
                                Leer más <ArrowRight size={14} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {noticias.length === 0 && (
                  <div className="empty-state">
                    <p>No hay noticias disponibles en este momento</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {noticiaSeleccionada && (
            <div className="modal-overlay" onClick={cerrarNoticia}>
              <div className="modal-noticia" onClick={(e) => e.stopPropagation()}>
                <button className="btn-cerrar-modal" onClick={cerrarNoticia}>
                  <X size={24} />
                </button>
                
                {(noticiaSeleccionada.imagenBase64 || noticiaSeleccionada.imagenUrl) && (
                  <div 
                    className="modal-imagen"
                    style={{ backgroundImage: `url(${noticiaSeleccionada.imagenBase64 || noticiaSeleccionada.imagenUrl})` }}
                  />
                )}

                <div className="modal-body">
                  <div className="modal-badges">
                    <span className={`badge-tipo ${noticiaSeleccionada.tipo.toLowerCase()}`}>
                      {noticiaSeleccionada.tipo}
                    </span>
                    <span className="badge-categoria">
                      {noticiaSeleccionada.categoria}
                    </span>
                  </div>

                  <h2>{noticiaSeleccionada.titulo}</h2>
                  
                  <div className="modal-meta">
                    <span className="meta-item">
                      <Calendar size={16} />
                      {formatearFecha(noticiaSeleccionada.createdAt)}
                    </span>
                    {noticiaSeleccionada.autor && (
                      <span className="meta-item">
                        <User size={16} />
                        {noticiaSeleccionada.autor.nombre}
                      </span>
                    )}
                  </div>

                  {noticiaSeleccionada.tipo === 'Evento' && (
                    <div className="evento-info">
                      {noticiaSeleccionada.fechaEvento && (
                        <div className="info-item">
                          <strong>Fecha del evento:</strong>
                          <span>
                            <Calendar size={16} />
                            {formatearFecha(noticiaSeleccionada.fechaEvento)}
                          </span>
                        </div>
                      )}
                      {noticiaSeleccionada.ubicacionEvento && (
                        <div className="info-item">
                          <strong>Ubicación:</strong>
                          <span>
                            <MapPin size={16} />
                            {noticiaSeleccionada.ubicacionEvento}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="modal-contenido">
                    <p className="descripcion-full">{noticiaSeleccionada.descripcion}</p>
                    <div className="contenido-full">
                      {noticiaSeleccionada.contenido.split('\n').map((parrafo, idx) => (
                        <p key={idx}>{parrafo}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Principal;
