import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { ubicacionesService, noticiasService } from '../../servicios/api';
import {
  X, MapPin, Clock, Camera, AlertCircle, Navigation2,
  Building2, BookOpen, UtensilsCrossed, FlaskConical,
  Activity, LogIn, Car, Settings, ScanLine, Calendar,
  Search, ChevronLeft, ChevronRight, Wifi, Zap,
} from 'lucide-react';
import './VistaAR.css';

// ─── Constantes ───────────────────────────────────────────────
const AR_FOV    = 60;
const MAX_DIST  = 100;
const SMOOTH    = 0.12;
const MAX_FULL  = 1;
const MAX_SMALL = 2;
const PAGE_SIZE = 6;

// ─── Geo utils ───────────────────────────────────────────────
function calcBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
          - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}
function calcDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function diffAngulo(a, b) {
  let d = ((b - a + 180) % 360) - 180;
  if (d < -180) d += 360;
  return d;
}
function formatDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function formatFecha(f) {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
}

// ─── Íconos por tipo ─────────────────────────────────────────
const TIPO_ICON = {
  edificio:        Building2,
  biblioteca:      BookOpen,
  casino:          UtensilsCrossed,
  cancha:          Activity,
  laboratorio:     FlaskConical,
  entrada:         LogIn,
  estacionamiento: Car,
  servicio:        Settings,
  otro:            MapPin,
};
const TIPO_LABEL = {
  edificio:'Edificio', biblioteca:'Biblioteca', casino:'Casino / Comedor',
  cancha:'Cancha', laboratorio:'Laboratorio', entrada:'Entrada',
  estacionamiento:'Estacionamiento', servicio:'Servicio', otro:'Otro',
};
function UbiIcon({ tipo, size = 20 }) {
  const Icon = TIPO_ICON[tipo] || MapPin;
  return <Icon size={size} />;
}
function toLatLon(u) {
  const [lon, lat] = u.ubicacion?.coordinates ?? [0, 0];
  return { lat, lon };
}

// ═══════════════════════════════════════════════════════════════
// Overlay de cámara AR
// ═══════════════════════════════════════════════════════════════
const CamaraAR = ({ ubicaciones, eventos, onClose }) => {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const headingRef = useRef(null);
  const rafRef     = useRef(null);

  const [fase, setFase]         = useState('permisos');
  const [errorMsg, setErrorMsg] = useState('');
  const [posicion, setPosicion] = useState(null);
  const [, setHeading]          = useState(0);
  const [visible, setVisible]   = useState([]);
  const [detalle, setDetalle]   = useState(null);

  const necesitaPermiso = typeof DeviceOrientationEvent !== 'undefined'
                       && typeof DeviceOrientationEvent.requestPermission === 'function';

  useEffect(() => {
    if (fase !== 'listo' || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [fase]);

  useEffect(() => {
    (async () => {
      try {
        if (necesitaPermiso) {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== 'granted') throw new Error('Permiso de orientación denegado en iOS. Actívalo en Ajustes › Safari › Movimiento y orientación.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        setFase('listo');
      } catch (err) {
        setErrorMsg(err.message || 'No se pudo acceder a la cámara o sensores.');
        setFase('error');
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
    };
  }, [necesitaPermiso]);

  useEffect(() => {
    if (fase !== 'listo') return;
    const wid = navigator.geolocation.watchPosition(
      pos => setPosicion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}, { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [fase]);

  useEffect(() => {
    if (fase !== 'listo') return;
    const onOri = (e) => {
      let raw = null;
      if (e.webkitCompassHeading != null)     raw = e.webkitCompassHeading;
      else if (e.absolute && e.alpha != null) raw = (360 - e.alpha) % 360;
      else if (e.alpha != null)               raw = (360 - e.alpha) % 360;
      if (raw === null) return;
      if (headingRef.current === null) headingRef.current = raw;
      else {
        let d = raw - headingRef.current;
        if (d > 180) d -= 360; if (d < -180) d += 360;
        headingRef.current = ((headingRef.current + d * SMOOTH) % 360 + 360) % 360;
      }
      setHeading(headingRef.current);
    };
    window.addEventListener('deviceorientationabsolute', onOri, true);
    window.addEventListener('deviceorientation', onOri, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOri, true);
      window.removeEventListener('deviceorientation', onOri, true);
    };
  }, [fase]);

  useEffect(() => {
    if (fase !== 'listo' || !posicion) return;
    const tick = () => {
      const h = headingRef.current ?? 0;
      setVisible(
        ubicaciones
          .map(u => {
            const { lat, lon } = toLatLon(u);
            return {
              ...u,
              _lat: lat, _lon: lon,
              dist: calcDistancia(posicion.lat, posicion.lon, lat, lon),
              diff: diffAngulo(h, calcBearing(posicion.lat, posicion.lon, lat, lon)),
            };
          })
          .filter(u => u.dist <= MAX_DIST && Math.abs(u.diff) <= AR_FOV / 2)
          .sort((a, b) => a.dist - b.dist)
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fase, posicion, ubicaciones]);

  const eventosDelLugar = detalle
    ? eventos.filter(ev => {
        const id = ev.ubicacionWayfinding?._id || ev.ubicacionWayfinding;
        return id && id.toString() === detalle._id.toString();
      })
    : [];

  return (
    <div className="ar-camara-overlay">
      {fase === 'permisos' && (
        <div className="ar-camara-estado">
          {/* Fondo decorativo */}
          <div className="ar-camara-estado-bg" />
          <div className="ar-camara-estado-content">
            <div className="ar-spinner-ring" />
            <h3>Iniciando AR</h3>
            <p>Solicitando acceso a cámara y sensores…</p>
          </div>
        </div>
      )}

      {fase === 'error' && (
        <div className="ar-camara-estado ar-camara-estado--error">
          <div className="ar-camara-estado-bg" />
          <div className="ar-camara-estado-content">
            <div className="ar-camara-error-icon">
              <AlertCircle size={36} />
            </div>
            <h3>No se pudo activar</h3>
            <p>{errorMsg}</p>
            <button className="ar-btn-cerrar-error" onClick={onClose}>
              <X size={16} /> Volver
            </button>
          </div>
        </div>
      )}

      {fase === 'listo' && (
        <>
          <video ref={videoRef} className="ar-video" autoPlay playsInline muted />

          {/* Viñeta decorativa */}
          <div className="ar-vignette" />

          {/* Retícula central */}
          <div className="ar-reticula">
            <div className="ar-reticula-h" />
            <div className="ar-reticula-v" />
            <div className="ar-reticula-corner ar-rc-tl" />
            <div className="ar-reticula-corner ar-rc-tr" />
            <div className="ar-reticula-corner ar-rc-bl" />
            <div className="ar-reticula-corner ar-rc-br" />
          </div>

          {/* HUD superior */}
          <div className="ar-hud">
            <button className="ar-hud-back" onClick={onClose}>
              <X size={18} />
            </button>
            <div className="ar-hud-titulo">AR Campus</div>
            <div className="ar-hud-badges">
              <span className={`ar-hud-badge ${posicion ? 'ar-hud-badge--ok' : 'ar-hud-badge--wait'}`}>
                <MapPin size={11} />{posicion ? 'GPS activo' : 'Localizando…'}
              </span>
              <span className="ar-hud-badge">
                <Navigation2 size={11} />{Math.round(headingRef.current ?? 0)}°
              </span>
            </div>
          </div>

          {/* Barra inferior de info */}
          <div className="ar-hud-bottom">
            <div className="ar-hud-bottom-pill">
              <Wifi size={12} />
              <span>{visible.length} edificio{visible.length !== 1 ? 's' : ''} en rango</span>
            </div>
          </div>

          {/* Etiqueta principal */}
          {posicion && visible.slice(0, MAX_FULL).map(u => {
            const xPct = ((u.diff / AR_FOV) + 0.5) * 100;
            return (
              <div
                key={u._id}
                className="ar-etiqueta ar-etiqueta--principal"
                style={{ left: `${xPct}%`, top: '42%' }}
                onClick={() => setDetalle(u)}
              >
                <div className="ar-etiqueta-pulse" />
                <div className="ar-etiqueta-icono ar-etiqueta-icono--lg">
                  <UbiIcon tipo={u.tipo} size={26} />
                </div>
                <div className="ar-etiqueta-cuerpo">
                  <span className="ar-etiqueta-nombre">{u.nombre}</span>
                  <span className="ar-etiqueta-dist">{formatDist(u.dist)}</span>
                </div>
              </div>
            );
          })}

          {/* Íconos secundarios */}
          {posicion && visible.slice(MAX_FULL, MAX_FULL + MAX_SMALL).map((u, i) => {
            const xPct = ((u.diff / AR_FOV) + 0.5) * 100;
            const top  = 30 - i * 6;
            return (
              <div
                key={u._id}
                className="ar-etiqueta ar-etiqueta--secundaria"
                style={{ left: `${xPct}%`, top: `${top}%` }}
                onClick={() => setDetalle(u)}
              >
                <div className="ar-etiqueta-icono ar-etiqueta-icono--sm">
                  <UbiIcon tipo={u.tipo} size={16} />
                </div>
                <span className="ar-etiqueta-dist-sm">{formatDist(u.dist)}</span>
              </div>
            );
          })}

          {posicion && visible.length === 0 && (
            <div className="ar-sin-puntos">
              <Navigation2 size={14} />
              Gira lentamente para ver los edificios
            </div>
          )}

          {/* Panel detalle */}
          {detalle && (
            <div className="ar-panel-overlay" onClick={() => setDetalle(null)}>
              <div className="ar-panel" onClick={e => e.stopPropagation()}>
                <div className="ar-panel-drag" />
                <button className="ar-panel-close" onClick={() => setDetalle(null)}><X size={17} /></button>

                <div className="ar-panel-header">
                  <div className="ar-panel-icono"><UbiIcon tipo={detalle.tipo} size={24} /></div>
                  <div>
                    <h2 className="ar-panel-nombre">{detalle.nombre}</h2>
                    <span className="ar-panel-cat">{TIPO_LABEL[detalle.tipo] || detalle.tipo}</span>
                  </div>
                </div>

                <div className="ar-panel-fila">
                  <MapPin size={15} /><span>{formatDist(detalle.dist)} de distancia</span>
                </div>

                {detalle.descripcion && (
                  <p className="ar-panel-desc">{detalle.descripcion}</p>
                )}

                {detalle.metadatos?.horario && (
                  <div className="ar-panel-horarios">
                    <div className="ar-panel-horarios-titulo"><Clock size={14} />Horario de atención</div>
                    <p className="ar-panel-horario-texto">{detalle.metadatos.horario}</p>
                  </div>
                )}

                {eventosDelLugar.length > 0 && (
                  <div className="ar-panel-eventos">
                    <div className="ar-panel-eventos-titulo"><Calendar size={14} />Eventos</div>
                    {eventosDelLugar.map(ev => (
                      <div key={ev._id} className="ar-panel-evento-item">
                        <span className="ar-panel-evento-nombre">{ev.titulo}</span>
                        {ev.fechaEvento && (
                          <span className="ar-panel-evento-fecha">{formatFecha(ev.fechaEvento)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Página principal
// ═══════════════════════════════════════════════════════════════
const VistaAR = () => {
  useNavigate();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [eventos, setEventos]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  // Buscador y paginador
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina]     = useState(1);

  useEffect(() => {
    Promise.all([
      ubicacionesService.getUbicacionesPublicas(),
      noticiasService.getNoticias({ tipo: 'Evento' }),
    ])
      .then(([ubRes, evRes]) => {
        if (ubRes.success) {
          setUbicaciones(ubRes.data.filter(u => u.tipo !== 'evento' && u.visible !== false));
        }
        if (evRes.success) setEventos(evRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtrar por búsqueda
  const filtradas = ubicaciones.filter(u => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      (TIPO_LABEL[u.tipo] || u.tipo)?.toLowerCase().includes(q) ||
      u.descripcion?.toLowerCase().includes(q)
    );
  });

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  const handleBusqueda = (val) => {
    setBusqueda(val);
    setPagina(1);
  };

  return (
    <div className="ar-page">
      <Navbar brandName="Módulo informativo" />

      <main className="ar-main">
        {/* ── Header — mismo estilo y ancho que Noticias ── */}
        <header className="ar-page-header">
          <h1>Información Contextual AR</h1>
          <p className="ar-page-subtitle">
            Apunta tu cámara hacia los edificios del campus y obtén información en tiempo real sobre cada lugar.
          </p>
        </header>

        <div className="ar-page-content">

          {/* ── Tarjeta de lanzamiento rediseñada ── */}
          <div className="ar-launch-card">
            <div className="ar-launch-bg-glow" />

            <div className="ar-launch-left">
              <div className="ar-launch-icon-wrap">
                <ScanLine size={28} />
                <div className="ar-launch-icon-ring" />
              </div>
              <div className="ar-launch-text">
                <div className="ar-launch-badge">
                  <Zap size={11} /> Tecnología AR
                </div>
                <h2>Vista de cámara AR</h2>
                <p>
                  Activa la cámara y apunta hacia los edificios del campus. El más cercano
                  (hasta 100&nbsp;m) aparece destacado con nombre y horario. Los demás se
                  muestran como íconos — tócalos para ver el detalle.
                </p>
                <div className="ar-launch-features">
                  <span><MapPin size={12} /> GPS en tiempo real</span>
                  <span><Navigation2 size={12} /> Brújula integrada</span>
                  <span><Clock size={12} /> Horarios</span>
                </div>
              </div>
            </div>

            <button className="ar-launch-btn" onClick={() => setCamaraAbierta(true)}>
              <Camera size={20} />
              Activar cámara AR
            </button>
          </div>

          {/* ── Barra: título + contador + buscador ── */}
          <div className="ar-lista-toolbar">
            <div className="ar-lista-toolbar-left">
              <h3>Lugares disponibles</h3>
              <span className="ar-lista-count">
                {filtradas.length} lugar{filtradas.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="ar-buscador-wrap">
              <Search size={15} className="ar-buscador-icon" />
              <input
                id="ar-buscador"
                type="text"
                className="ar-buscador"
                placeholder="Buscar lugar…"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
              />
              {busqueda && (
                <button className="ar-buscador-clear" onClick={() => handleBusqueda('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="ar-lista-loading">
              <div className="ar-spinner-sm" />
              <span>Cargando ubicaciones…</span>
            </div>
          )}

          {/* ── Vacío ── */}
          {!loading && filtradas.length === 0 && (
            <div className="ar-lista-empty">
              <MapPin size={32} opacity={0.3} />
              <p>{busqueda ? `Sin resultados para "${busqueda}"` : 'Aún no hay ubicaciones configuradas en el campus.'}</p>
            </div>
          )}

          {/* ── Grid de cards ── */}
          {!loading && paginadas.length > 0 && (
            <div className="ar-lista-grid">
              {paginadas.map(u => {
                const evs = eventos.filter(ev => {
                  const id = ev.ubicacionWayfinding?._id || ev.ubicacionWayfinding;
                  return id && id.toString() === u._id.toString();
                });
                return (
                  <div key={u._id} className="ar-card">
                    <div className="ar-card-header">
                      <div className="ar-card-icono">
                        <UbiIcon tipo={u.tipo} size={22} />
                      </div>
                      <span className="ar-card-cat">{TIPO_LABEL[u.tipo] || u.tipo}</span>
                    </div>
                    <div className="ar-card-body">
                      <h4 className="ar-card-nombre">{u.nombre}</h4>
                      {u.descripcion && (
                        <p className="ar-card-desc">{u.descripcion}</p>
                      )}
                    </div>
                    <div className="ar-card-footer">
                      {u.metadatos?.horario && (
                        <div className="ar-card-horario">
                          <Clock size={12} />
                          <span>{u.metadatos.horario}</span>
                        </div>
                      )}
                      {evs.length > 0 && (
                        <div className="ar-card-eventos">
                          <Calendar size={12} />
                          {evs.map(ev => (
                            <span key={ev._id} className="ar-lista-evento-chip">{ev.titulo}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Paginador ── */}
          {!loading && totalPaginas > 1 && (
            <div className="ar-paginador">
              <button
                className="ar-pag-btn"
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="ar-pag-pages">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`ar-pag-num ${n === paginaSegura ? 'ar-pag-num--active' : ''}`}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                className="ar-pag-btn"
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </main>

      {camaraAbierta && (
        <CamaraAR
          ubicaciones={ubicaciones}
          eventos={eventos}
          onClose={() => setCamaraAbierta(false)}
        />
      )}
    </div>
  );
};

export default VistaAR;
