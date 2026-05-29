import { useEffect, useState, useRef } from 'react';
import Navbar from '../../componentes/compartidos/Navbar';
import { tourVirtualService } from '../../servicios/api';
import Visor3D from '../../componentes/compartidos/Visor3D';
import './TourVirtual.css';

const ICON_ARROW = (
  <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ICON_LAYERS = (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
    <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);
const ICON_CUBE = (
  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const TourVirtual = () => {
  const [edificios, setEdificios]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState(null);
  const tiltCleanupRef = useRef([]);

  useEffect(() => {
    const cargarEdificios = async () => {
      try {
        setLoading(true);
        const response = await tourVirtualService.getEdificiosPublicos();
        if (response.success) setEdificios(response.data);
        else setError(response.message || 'No se pudieron cargar los edificios');
      } catch (err) {
        setError(err.message || 'Error al cargar los edificios');
      } finally {
        setLoading(false);
      }
    };
    cargarEdificios();
  }, []);

  /* Tilt 3D con el mouse al aparecer las cards */
  useEffect(() => {
    if (loading) return;
    tiltCleanupRef.current.forEach(({ card, onMove, onLeave }) => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    });
    tiltCleanupRef.current = [];

    const fine = window.matchMedia('(pointer:fine)').matches;
    if (!fine) return;

    const timer = setTimeout(() => {
      document.querySelectorAll('.tv-card').forEach(card => {
        let raf = null;
        const onMove = (ev) => {
          const r = card.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width  - 0.5;
          const py = (ev.clientY - r.top)  / r.height - 0.5;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            card.style.transform = `perspective(1000px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-4px)`;
          });
        };
        const onLeave = () => {
          if (raf) cancelAnimationFrame(raf);
          card.style.transform = '';
        };
        card.addEventListener('pointermove', onMove);
        card.addEventListener('pointerleave', onLeave);
        tiltCleanupRef.current.push({ card, onMove, onLeave });
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, edificios]);

  const getModelUrl = (e) => e?.modeloUrl || e?.url || e?.archivoUrl || '';

  return (
    <div className="tv-wrap">
      <Navbar brandName="Módulo informativo" />

      <main className="tv-main">

        {/* ── HEADER ── */}
        <header className="tv-header">
          <h1>Minitour Virtual</h1>
          <p className="tv-header-sub">Recorre los edificios del Campus Curicó en 3D desde donde estés.</p>
        </header>

        <div className="tv-page">
          {/* ── Cabecera de sección ── */}
          <div className="tv-section-head">
            <div>
              <h2 className="tv-section-title">Explora cada edificio</h2>
              <p className="tv-section-sub">Selecciona un edificio y entra a su modelo tridimensional.</p>
            </div>
            {!loading && !error && (
              <span className="tv-count-pill">
                <b>{edificios.length}</b> modelos listos
              </span>
            )}
          </div>

          {/* ── Estados ── */}
          {loading && (
            <div className="tv-state">
              <div className="tv-spinner" aria-hidden="true"></div>
              <p>Cargando edificios…</p>
            </div>
          )}
          {error && !loading && (
            <div className="tv-state tv-state--error">{error}</div>
          )}

          {/* ── Grid de cards ── */}
          {!loading && !error && (
            <div className="tv-grid">
              {edificios.length === 0 && (
                <div className="tv-empty">Aún no hay edificios disponibles.</div>
              )}

              {edificios.map((edificio, i) => {
                const modelUrl = getModelUrl(edificio);
                return (
                  <article
                    key={edificio._id || edificio.id || edificio.nombre}
                    className="tv-card"
                    style={{ '--rd': `${i * 0.09}s` }}
                  >
                    {/* Viewport con model-viewer real */}
                    <div className="tv-viewport">
                      <span className="tv-vp-badge">{ICON_CUBE} 3D</span>
                      {modelUrl ? (
                        <model-viewer
                          class="tv-model-viewer"
                          src={modelUrl}
                          auto-rotate
                          auto-rotate-delay="0"
                          rotation-per-second="30deg"
                          interaction-prompt="none"
                          disable-zoom
                          shadow-intensity="0.8"
                          exposure="0.9"
                          camera-orbit="0deg 75deg 105%"
                          style={{ width: '100%', height: '100%', background: 'transparent' }}
                        />
                      ) : (
                        <div className="tv-no-model">
                          <svg viewBox="0 0 24 24" fill="none" width="36" height="36" opacity="0.4">
                            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                          </svg>
                          <span>Sin modelo</span>
                        </div>
                      )}
                    </div>

                    {/* Cuerpo */}
                    <div className="tv-card-body">
                      <h3 className="tv-card-name">{edificio.nombre}</h3>
                      {edificio.descripcion && (
                        <p className="tv-card-desc">{edificio.descripcion}</p>
                      )}
                      <div className="tv-card-foot">
                        <button
                          className="tv-explore-btn"
                          onClick={() => setSelectedEdificio(edificio)}
                        >
                          Explorar en 3D {ICON_ARROW}
                        </button>
                        <span className="tv-meta">{ICON_LAYERS} Modelo 3D</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedEdificio && (
        <Visor3D
          url={getModelUrl(selectedEdificio)}
          nombre={selectedEdificio.nombre}
          onClose={() => setSelectedEdificio(null)}
        />
      )}
    </div>
  );
};

export default TourVirtual;
