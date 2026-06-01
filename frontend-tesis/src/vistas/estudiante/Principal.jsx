import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { utalcaNoticiasService, noticiasService } from '../../servicios/api';
import { Calendar, X, ArrowRight, ExternalLink, Globe, Building2, ZoomIn } from 'lucide-react';
import './Principal.css';

const Principal = () => {
  const navigate = useNavigate();

  // Pestaña activa: 'utalca' | 'campus'
  const [fuente, setFuente] = useState('campus');

  const [noticiasUtalca, setNoticiasUtalca] = useState([]);
  const [noticiasCampus, setNoticiasCampus]  = useState([]);
  const [loadingUtalca, setLoadingUtalca]    = useState(false);
  const [loadingCampus, setLoadingCampus]    = useState(false);
  const [errorUtalca, setErrorUtalca]        = useState('');
  const [errorCampus, setErrorCampus]        = useState('');
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [imagenAmpliada, setImagenAmpliada]           = useState(null);

  // Filtros solo para noticias del campus
  const [filtros, setFiltros] = useState({ tipo: '', categoria: '' });

  useEffect(() => { cargarUtalca(); }, []);
  useEffect(() => { cargarCampus(); }, [filtros]);

  const cargarUtalca = async () => {
    try {
      setLoadingUtalca(true);
      setErrorUtalca('');
      const res = await utalcaNoticiasService.getNoticias();
      if (res.success) setNoticiasUtalca(res.data);
    } catch {
      setErrorUtalca('No se pudieron cargar las noticias de UTalca.');
    } finally {
      setLoadingUtalca(false);
    }
  };

  const cargarCampus = async () => {
    try {
      setLoadingCampus(true);
      setErrorCampus('');
      const res = await noticiasService.getNoticias(filtros);
      if (res.success) setNoticiasCampus(res.data);
    } catch {
      setErrorCampus('No se pudieron cargar las noticias del campus.');
    } finally {
      setLoadingCampus(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const esUtalca = fuente === 'utalca';
  const noticias = esUtalca ? noticiasUtalca : noticiasCampus;
  const loading  = esUtalca ? loadingUtalca  : loadingCampus;
  const error    = esUtalca ? errorUtalca    : errorCampus;

  return (
    <div className="principal-container">
      <Navbar brandName="Módulo informativo" />

      <main className="main-content">
        <div className="feed-noticias">

          {/* ── Header ── */}
          <div className="feed-noticias-header">
            <h1>Noticias y Eventos</h1>
            <p className="feed-subtitle">Mantente informado sobre las últimas novedades del campus</p>
          </div>

          {/* ── Pestañas + filtros en una sola barra ── */}
          <div className="feed-tabs-bar">
            <div className="feed-tabs">
              <button
                className={`feed-tab ${fuente === 'campus' ? 'feed-tab--active' : ''}`}
                onClick={() => setFuente('campus')}
              >
                <Building2 size={16} />
                Campus Curicó
              </button>
              <button
                className={`feed-tab ${fuente === 'utalca' ? 'feed-tab--active' : ''}`}
                onClick={() => setFuente('utalca')}
              >
                <Globe size={16} />
                Noticias UTalca
              </button>
            </div>

            {fuente === 'campus' && (
              <div className="filtros-inline">
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros(p => ({ ...p, tipo: e.target.value }))}
                  className="filtro-select"
                >
                  <option value="">Todos los tipos</option>
                  <option value="Noticia">Noticias</option>
                  <option value="Evento">Eventos</option>
                  <option value="Anuncio">Anuncios</option>
                </select>
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(p => ({ ...p, categoria: e.target.value }))}
                  className="filtro-select"
                >
                  <option value="">Todas las categorías</option>
                    {['Académico','Cultural','Deportivo','Investigación','Extensión','Administrativo','Otro'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>
            )}
          </div>{/* fin feed-tabs-bar */}

          <div className="feed-noticias-content">
            {/* ── Estado de carga / error ── */}
            {loading && (
              <div className="loading-feed">
                <div className="spinner"></div>
                <p>Cargando noticias…</p>
              </div>
            )}
            {error && !loading && (
              <div className="empty-state"><p>{error}</p></div>
            )}

            {/* ── Grid de cards ── */}
            {!loading && !error && (
              <div className="feed-noticias-main">
                {noticias.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay noticias disponibles en este momento.</p>
                  </div>
                ) : (
                  <div className="news-grid">
                    {noticias.map((noticia, i) => {
                      const imagen = esUtalca
                        ? noticia.imagen
                        : (noticia.imagenUrl || '');
                      return (
                        <article
                          key={noticia.id || noticia._id || i}
                          className="news-card"
                          style={{ '--rd': `${i * 0.05}s` }}
                          onClick={() => setNoticiaSeleccionada(noticia)}
                        >
                          <div
                            className="news-card-viewport"
                            style={imagen ? {
                              backgroundImage: `url(${imagen})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            } : {}}
                          >
                            <div className="news-card-badges-top">
                              <span className={`news-badge-tipo ${esUtalca ? '' : `news-badge-tipo--${(noticia.tipo||'').toLowerCase()}`}`}>
                                {esUtalca ? 'UTalca' : (noticia.tipo || 'Noticia')}
                              </span>
                              {!esUtalca && noticia.destacado && (
                                <span className="news-badge-star">★ Destacada</span>
                              )}
                            </div>
                          </div>

                          <div className="news-card-body">
                            {(esUtalca ? noticia.categorias?.[0] : noticia.categoria) && (
                              <span className="news-badge-cat">
                                {esUtalca ? noticia.categorias[0] : noticia.categoria}
                              </span>
                            )}
                            <h3 className="news-card-title">{noticia.titulo}</h3>
                            <p className="news-card-desc">{noticia.descripcion}</p>
                            <div className="news-card-foot">
                              <span className="news-fecha">
                                <Calendar size={13} />
                                {formatearFecha(esUtalca ? noticia.fecha : (noticia.createdAt))}
                              </span>
                              <span className="news-leer-mas">
                                Leer más <ArrowRight size={13} />
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>{/* fin feed-noticias-content */}

          {/* ── Modal ── */}
          {noticiaSeleccionada && (
            <div className="modal-overlay" onClick={() => setNoticiaSeleccionada(null)}>
              <div className="modal-noticia" onClick={(e) => e.stopPropagation()}>
                <button className="btn-cerrar-modal" onClick={() => setNoticiaSeleccionada(null)}>
                  <X size={24} />
                </button>

                {/* Imagen */}
                {(() => {
                  const src = esUtalca ? noticiaSeleccionada.imagen : noticiaSeleccionada.imagenUrl;
                  return src ? (
                    <>
                      <div
                        className="modal-imagen modal-imagen--clickable"
                        style={{ backgroundImage: `url(${src})` }}
                        onClick={() => setImagenAmpliada(src)}
                        title="Click para ver imagen completa"
                      />
                      <button
                        className="btn-ampliar-imagen"
                        onClick={() => setImagenAmpliada(src)}
                      >
                        <ZoomIn size={15} />
                        Ver imagen completa
                      </button>
                    </>
                  ) : null;
                })()}

                <div className="modal-body">
                  {/* Badges */}
                  <div className="modal-badges">
                    {esUtalca ? (
                      noticiaSeleccionada.categorias?.map((c) => (
                        <span key={c} className="badge-categoria">{c}</span>
                      ))
                    ) : (
                      <>
                        <span className={`badge-tipo ${(noticiaSeleccionada.tipo||'').toLowerCase()}`}>
                          {noticiaSeleccionada.tipo}
                        </span>
                        {noticiaSeleccionada.categoria && (
                          <span className="badge-categoria">{noticiaSeleccionada.categoria}</span>
                        )}
                      </>
                    )}
                  </div>

                  <h2>{noticiaSeleccionada.titulo}</h2>

                  <div className="modal-meta">
                    <span className="meta-item">
                      <Calendar size={16} />
                      {formatearFecha(esUtalca ? noticiaSeleccionada.fecha : noticiaSeleccionada.createdAt)}
                    </span>
                    {esUtalca && noticiaSeleccionada.autor && (
                      <span className="meta-item">✍ {noticiaSeleccionada.autor}</span>
                    )}
                  </div>

                  <div className="modal-contenido">
                    <p className="descripcion-full">{noticiaSeleccionada.descripcion}</p>
                    {!esUtalca && noticiaSeleccionada.contenido && (
                      <div className="contenido-full">
                        {noticiaSeleccionada.contenido.split('\n').map((p, idx) => (
                          <p key={idx}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botón UTalca */}
                  {esUtalca && noticiaSeleccionada.link && (
                    <a
                      href={noticiaSeleccionada.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ver-utalca"
                    >
                      <ExternalLink size={16} />
                      Ver noticia completa en utalca.cl
                    </a>
                  )}

                  {/* Botón wayfinding para eventos del campus */}
                  {!esUtalca && noticiaSeleccionada.ubicacionWayfinding && (
                    <button
                      className="btn-como-llegar"
                      onClick={() => {
                        setNoticiaSeleccionada(null);
                        navigate('/wayfinding', {
                          state: { destinoId: noticiaSeleccionada.ubicacionWayfinding._id || noticiaSeleccionada.ubicacionWayfinding },
                        });
                      }}
                    >
                      Cómo llegar (Ver en mapa)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Lightbox imagen completa ── */}
      {imagenAmpliada && (
        <div
          className="lightbox-overlay"
          onClick={() => setImagenAmpliada(null)}
        >
          <button
            className="lightbox-close"
            onClick={() => setImagenAmpliada(null)}
            aria-label="Cerrar imagen"
          >
            <X size={22} />
          </button>
          <img
            src={imagenAmpliada}
            alt="Imagen ampliada"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Principal;
