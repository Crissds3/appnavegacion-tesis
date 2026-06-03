import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Navigation, Compass, Route, Ruler, Clock,
  Search, CheckCircle, RefreshCw, X, Target, Share2,
  Building2, BookOpen, UtensilsCrossed, Activity,
  FlaskConical, LogIn, Settings, LayoutGrid,
} from 'lucide-react';
import Navbar from '../../componentes/compartidos/Navbar';
import MapaWayfinding from '../../componentes/wayfinding/MapaWayfinding';
import useGeolocation from '../../hooks/useGeolocation';
import useCompass from '../../hooks/useCompass';
import api from '../../servicios/api';
import { CATEGORIA_CONFIG } from '../../utils/iconosMapa';
import './Wayfinding.css';

// ─── Chips de filtro ──────────────────────────────────────────────────────
const CHIPS = [
  { tipo: 'todos',       label: 'Todos',      Icon: LayoutGrid },
  { tipo: 'edificio',    label: 'Edificio',   Icon: Building2 },
  { tipo: 'biblioteca',  label: 'Biblioteca', Icon: BookOpen },
  { tipo: 'casino',      label: 'Casino',     Icon: UtensilsCrossed },
  { tipo: 'cancha',      label: 'Cancha',     Icon: Activity },
  { tipo: 'laboratorio', label: 'Laboratorio',Icon: FlaskConical },
  { tipo: 'servicio',    label: 'Servicio',   Icon: Settings },
  { tipo: 'entrada',     label: 'Entrada',    Icon: LogIn },
];

const Wayfinding = () => {
  const navigate   = useNavigate();
  const routerLoc  = useLocation();

  const [ubicaciones,          setUbicaciones]          = useState([]);
  const [busqueda,             setBusqueda]             = useState('');
  const [resultadosBusqueda,   setResultadosBusqueda]   = useState([]);
  const [origen,               setOrigen]               = useState(null);
  const [destino,              setDestino]              = useState(null);
  const [modoSeleccion,        setModoSeleccion]        = useState(null);
  const [infoRuta,             setInfoRuta]             = useState(null);
  const [isNavigating,         setIsNavigating]         = useState(false);
  const [usarUbicacionSimulada,setUsarUbicacionSimulada]= useState(false);
  const [haLlegado,            setHaLlegado]            = useState(false);
  const [locationCard,         setLocationCard]         = useState(null); // preview card
  const [filtroTipo,           setFiltroTipo]           = useState('todos');

  const { ubicacion: ubicacionUsuario, error: errorGeo, cargando: cargandoGeo } =
    useGeolocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });

  const { heading, requestCompassPermission } = useCompass();

  const ubicacionSimulada = { lat: -35.002607, lng: -71.230519, accuracy: 10 };
  const ubicacionActual   = usarUbicacionSimulada ? ubicacionSimulada : ubicacionUsuario;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => { cargarUbicaciones(); }, []);

  // ── Destino desde otra vista ───────────────────────────────────────────────
  useEffect(() => {
    if (ubicaciones.length > 0 && routerLoc.state?.destinoId) {
      const found = ubicaciones.find(u => u._id === routerLoc.state.destinoId);
      if (found) { setDestino(found); window.history.replaceState({}, document.title); }
    }
  }, [ubicaciones, routerLoc.state]);

  // ── Detección de llegada ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isNavigating || !ubicacionActual || !destino) return;
    const coords = destino.ubicacion?.coordinates;
    if (!coords || coords.length < 2) return;
    const dist = L.latLng(ubicacionActual.lat, ubicacionActual.lng)
      .distanceTo(L.latLng(coords[1], coords[0]));
    if (dist < 15) { setIsNavigating(false); setHaLlegado(true); }
  }, [isNavigating, ubicacionActual, destino]);

  const cargarUbicaciones = async () => {
    try {
      const res  = await api.get('/ubicaciones/publicas?visible=true');
      const all  = res.data.data || [];
      const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
      setUbicaciones(all.filter(ub => {
        if (ub.tipo === 'evento' && ub.metadatos?.fechaEvento) {
          const [y, m, d] = ub.metadatos.fechaEvento.split('-');
          return new Date(y, m - 1, d) >= hoy;
        }
        return true;
      }));
    } catch (e) { console.error('Error al cargar ubicaciones:', e); }
  };

  const buscarUbicaciones = (texto) => {
    setBusqueda(texto);
    setResultadosBusqueda(
      texto.trim().length > 1
        ? ubicaciones.filter(ub =>
            ub.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            ub.descripcion?.toLowerCase().includes(texto.toLowerCase())
          )
        : []
    );
  };

  const seleccionarDesdeResultado = (ub) => {
    if (modoSeleccion === 'origen')  { setOrigen(ub);  setModoSeleccion(null); }
    else if (modoSeleccion === 'destino') { setDestino(ub); setModoSeleccion(null); }
    else { setLocationCard(ub); }
    setBusqueda(''); setResultadosBusqueda([]);
  };

  const usarMiUbicacion = () => {
    const ub = ubicacionActual;
    if (!ub) return;
    setOrigen({
      _id: 'mi-ubicacion',
      nombre: usarUbicacionSimulada ? 'Mi Ubicación (Simulada)' : 'Mi Ubicación',
      ubicacion: { coordinates: [ub.lng, ub.lat] },
    });
  };

  const limpiarRuta = () => {
    setOrigen(null); setDestino(null); setModoSeleccion(null);
    setInfoRuta(null); setIsNavigating(false); setHaLlegado(false);
  };

  const iniciarViaje = () => {
    if (!ubicacionActual || !destino || !origen) return;
    requestCompassPermission();
    setIsNavigating(true);
  };

  const compartirUbicacion = async (ub) => {
    const texto = `Mira esta ubicación en el campus: ${ub.nombre}`;
    const base  = window.location.origin.includes('localhost')
      ? 'https://appnavegacion-tesis.vercel.app' : window.location.origin;
    const url   = `${base}${window.location.pathname}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Campus U. de Talca', text: texto, url }); }
      catch (e) { if (e.name !== 'AbortError') console.error(e); }
    } else {
      await navigator.clipboard.writeText(`${texto}\n${url}`).catch(() => {});
      alert('Enlace copiado al portapapeles');
    }
  };

  const toggleSimulada = () => {
    const next = !usarUbicacionSimulada;
    setUsarUbicacionSimulada(next);
    if (origen?._id === 'mi-ubicacion') {
      const ub = next ? ubicacionSimulada : ubicacionUsuario;
      if (ub) setOrigen({ _id: 'mi-ubicacion', nombre: next ? 'Mi Ubicación (Simulada)' : 'Mi Ubicación', ubicacion: { coordinates: [ub.lng, ub.lat] } });
    }
  };

  // Distancia desde ubicación actual hasta la location card
  const distanciaCard = (() => {
    if (!locationCard || !ubicacionActual) return null;
    const c = locationCard.ubicacion?.coordinates;
    if (!c) return null;
    const d = L.latLng(ubicacionActual.lat, ubicacionActual.lng).distanceTo(L.latLng(c[1], c[0]));
    return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
  })();

  // Ubicaciones filtradas para los chips (se pasan al mapa)
  const ubicacionesFiltradas = filtroTipo === 'todos'
    ? ubicaciones
    : ubicaciones.filter(u => u.tipo === filtroTipo || u.categoria === filtroTipo);

  const metrosRestantes = infoRuta?.distancia
    ? (parseFloat(infoRuta.distancia) * 1000).toFixed(0) : null;

  const getColor = (ub) =>
    CATEGORIA_CONFIG[ub?.tipo]?.color || CATEGORIA_CONFIG[ub?.categoria]?.color || '#E53935';

  // ── MODO NAVEGACIÓN FULLSCREEN ────────────────────────────────────────────
  if (isNavigating) {
    return (
      <div className="nav-screen">
        <div className="nav-map-inner">
          <MapaWayfinding
            origen={origen} destino={destino}
            ubicacionUsuario={ubicacionActual}
            onRutaCalculada={setInfoRuta}
            isNavigating={isNavigating} heading={heading}
          />
        </div>

        <div className="nav-top">
          <div className="nav-banner">
            <div className="nav-turn-ic"><Navigation size={24} /></div>
            <div className="nav-banner-txt">
              <div className="l1">Navegando hacia</div>
              <div className="l2">{destino?.nombre}</div>
            </div>
          </div>
        </div>

        <button className="nav-exit" onClick={() => setIsNavigating(false)}>
          <X size={17} /> Salir
        </button>

        {infoRuta && (
          <div className="nav-sheet">
            <div className="nav-handle" />
            <div className="nav-progress">
              <i style={{ width: '55%' }} />
            </div>
            <div className="nav-stats">
              <div className="nav-eta">
                <div className="big">{infoRuta.tiempo}</div>
                <div className="sub">min restantes</div>
              </div>
              <div className="nav-vsep" />
              <div className="nav-stat">
                <span className="v">{metrosRestantes}</span>
                <span className="u">m</span>
              </div>
              <div className="nav-dest">
                <div className="l">Destino</div>
                <div className="n"><MapPin size={13} />{destino?.nombre}</div>
              </div>
            </div>
            <div className="nav-bottom-actions">
              <div className="nav-live"><RefreshCw size={13} className="spin-slow" /> Tiempo real</div>
              <button className="btn-finish" onClick={() => setIsNavigating(false)}>
                <CheckCircle size={17} /> Finalizar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MODO NORMAL ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#eaeaee', minHeight: '100vh', paddingTop: '70px' }}>
      <Navbar brandName="Módulo de navegación" />

      {/* Header */}
      <div className="wf-header">
        <h1>Sistema de Navegación Wayfinding</h1>
        <p>Encuentra tu camino en el Campus Curicó - Universidad de Talca</p>
      </div>

      {/* Barra de filtros — en flujo normal, siempre visible */}
      <div className="wf-chips-bar">
        {CHIPS.map(({ tipo, label, Icon }) => {
          const cnt = tipo === 'todos'
            ? ubicaciones.length
            : ubicaciones.filter(u =>
                (u.tipo?.toLowerCase() === tipo) ||
                (u.categoria?.toLowerCase() === tipo)
              ).length;
          return (
            <button
              key={tipo}
              className={`wf-chip ${filtroTipo === tipo ? 'wf-chip--active' : ''}`}
              onClick={() => setFiltroTipo(tipo)}
            >
              <Icon size={14} />
              {label}
              {cnt > 0 && <span className="wf-chip-cnt">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Body: mapa + sidebar */}
      <div className="wf-body">

        {/* ── Mapa ── */}
        <div className="map-panel">
          {/* Mapa real */}
          <div className="map-inner">
            <MapaWayfinding
              origen={origen} destino={destino}
              ubicacionUsuario={ubicacionActual}
              onRutaCalculada={setInfoRuta}
              isNavigating={false} heading={heading}
              filtroExterno={filtroTipo}
              hideControls={true}
              onUbicacionClick={(ub) => {
                setBusqueda(''); setResultadosBusqueda([]);
                setLocationCard(ub);
              }}
            />
          </div>

          {/* Overlay buscador */}
          <div className="map-overlay-top">
            <div className={`searchbar${modoSeleccion ? ' modo-seleccion' : ''}`}>
              <Search size={18} />
              <input
                type="text"
                placeholder={
                  modoSeleccion === 'origen'  ? 'Buscar punto de origen...' :
                  modoSeleccion === 'destino' ? 'Buscar destino...' :
                  '¿A dónde quieres ir?'
                }
                value={busqueda}
                onChange={e => buscarUbicaciones(e.target.value)}
                autoComplete="off"
              />
              {busqueda && (
                <button className="clear" onClick={() => { setBusqueda(''); setResultadosBusqueda([]); }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {resultadosBusqueda.length > 0 && (
              <div className="search-results">
                {resultadosBusqueda.slice(0, 8).map(ub => (
                  <div key={ub._id} className="sr-item" onClick={() => seleccionarDesdeResultado(ub)}>
                    <div className="sr-ic" style={{ background: getColor(ub) }}>
                      <MapPin size={17} />
                    </div>
                    <div className="sr-info">
                      <div className="sr-name">{ub.nombre}</div>
                      <div className="sr-type">{CATEGORIA_CONFIG[ub.tipo]?.label || ub.tipo}</div>
                    </div>
                    <Navigation size={15} className="sr-arrow" />
                  </div>
                ))}
              </div>
            )}
            {busqueda.length > 1 && resultadosBusqueda.length === 0 && (
              <div className="search-results">
                <div className="sr-empty">No encontramos "{busqueda}"</div>
              </div>
            )}
          </div>


          {/* FAB: mi ubicación */}
          <div className="map-fabs">
            <button
              className={`fab ${ubicacionActual ? 'locate-on' : ''}`}
              title="Usar mi ubicación"
              onClick={usarMiUbicacion}
            >
              <Target size={20} />
            </button>
          </div>

          {/* Indicador modo selección — sobre el buscador */}

          {/* Contador visible */}
          {!locationCard && !modoSeleccion && (
            <div className="visible-count">
              <MapPin size={13} /> <b>{ubicacionesFiltradas.length}</b> lugares
            </div>
          )}

          {/* Location Card */}
          {locationCard && (
            <div className="loc-card">
              <div className="loc-head">
                <div className="loc-ic" style={{ background: getColor(locationCard) }}>
                  <MapPin size={20} />
                </div>
                <div className="loc-meta">
                  <div className="loc-name">{locationCard.nombre}</div>
                  <div className="loc-badge" style={{ background: getColor(locationCard) + '18', color: getColor(locationCard) }}>
                    <span className="dot" style={{ background: getColor(locationCard) }} />
                    {CATEGORIA_CONFIG[locationCard.tipo]?.label || locationCard.tipo}
                  </div>
                </div>
                <button className="loc-close" onClick={() => setLocationCard(null)}>
                  <X size={15} />
                </button>
              </div>

              {locationCard.descripcion && (
                <p className="loc-desc">{locationCard.descripcion}</p>
              )}
              {locationCard.metadatos?.horario && (
                <p className="loc-desc" style={{ marginTop: 2 }}>
                  <strong>Horario:</strong> {locationCard.metadatos.horario}
                </p>
              )}
              {distanciaCard && (
                <div className="loc-dist">
                  <Navigation size={13} /> {distanciaCard} · ~ {Math.round(parseFloat(distanciaCard) / 1.3 / 60)} min a pie
                </div>
              )}

              <div className="loc-actions">
                <button
                  className="btn btn-primary loc-btn-navegar"
                  onClick={() => { setDestino(locationCard); setLocationCard(null); }}
                >
                  <Navigation size={15} /> Navegar
                </button>
                <button
                  className="btn btn-ghost loc-btn-icon"
                  title="Como origen"
                  onClick={() => { setOrigen(locationCard); setLocationCard(null); }}
                >
                  <Target size={16} />
                </button>
                <button
                  className="btn btn-ghost loc-btn-icon"
                  title="Compartir"
                  onClick={() => compartirUbicacion(locationCard)}
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="side">

          {/* Planificador de ruta */}
          <div className="card">
            <div className="route-header">
              <Route size={20} />
              <span className="rh-title">Planificar ruta</span>
              {infoRuta && <span className="rh-badge"><CheckCircle size={13} /> Lista</span>}
            </div>

            {/* Origen */}
            <div className="route-row">
              <div className="route-label">
                <div className="pindot pin-origen"><Navigation size={11} /></div>
                Origen
              </div>
              {origen ? (
                <div className="chosen origen">
                  <span className="cdot" style={{ background: '#1E6FE0' }} />
                  <span>{origen.nombre}</span>
                  <button className="x" onClick={() => setOrigen(null)}><X size={13} /></button>
                </div>
              ) : (
                <div className="btngrid">
                  <button
                    className={`input-btn ${modoSeleccion === 'origen' ? 'active' : ''}`}
                    onClick={() => setModoSeleccion('origen')}
                  >
                    <Search size={14} /> Seleccionar
                  </button>
                  <button className="input-btn" onClick={usarMiUbicacion}>
                    <Target size={14} /> Mi ubicación
                  </button>
                </div>
              )}
            </div>

            <div className="route-track" />

            {/* Destino */}
            <div className="route-row">
              <div className="route-label">
                <div className="pindot pin-destino"><MapPin size={11} /></div>
                Destino
              </div>
              {destino ? (
                <div className="chosen">
                  <span className="cdot" style={{ background: '#D32F2F' }} />
                  <span>{destino.nombre}</span>
                  <button className="x" onClick={() => setDestino(null)}><X size={13} /></button>
                </div>
              ) : (
                <button
                  className={`input-btn ${modoSeleccion === 'destino' ? 'active' : ''}`}
                  style={{ width: '100%' }}
                  onClick={() => setModoSeleccion('destino')}
                >
                  <Search size={14} /> Buscar destino
                </button>
              )}
            </div>

            {/* Acciones */}
            <div className="route-actions">
              <button
                className="btn btn-go"
                onClick={iniciarViaje}
                disabled={!origen || !destino}
              >
                <Compass size={17} /> Iniciar navegación
              </button>
              {(origen || destino) && (
                <button className="btn-clear-route" onClick={limpiarRuta}>Limpiar</button>
              )}
            </div>

            {/* Resumen de ruta */}
            {infoRuta && (
              <div className="route-summary">
                <h4><Route size={14} /> Detalles del recorrido</h4>
                <div className="summary-grid">
                  <div className="summary-stat">
                    <div className="lab"><Clock size={11} /> Tiempo</div>
                    <div className="val">{infoRuta.tiempo}<small> min</small></div>
                  </div>
                  <div className="summary-stat">
                    <div className="lab"><Ruler size={11} /> Distancia</div>
                    <div className="val">{infoRuta.distancia}<small> km</small></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info / GPS */}
          <div className="card info-card">
            <div className="info-strip">
              <div
                className={`sim-row ${usarUbicacionSimulada ? 'on' : ''}`}
                onClick={toggleSimulada}
              >
                <div className={`switch-sm ${usarUbicacionSimulada ? 'on' : ''}`} />
                Simular ubicación en campus
              </div>

              {ubicacionActual && (
                <div className={`geo-badge ${usarUbicacionSimulada ? 'sim' : 'ok'}`}>
                  <span className="gdot" />
                  {usarUbicacionSimulada ? 'Simulada activa' : 'GPS activo'}
                </div>
              )}
              {errorGeo && !usarUbicacionSimulada && (
                <div className="geo-badge err">
                  <span className="gdot" />
                  Error de GPS
                </div>
              )}
              {cargandoGeo && !ubicacionUsuario && !usarUbicacionSimulada && (
                <div className="geo-badge" style={{ background: '#f0f1f3', borderColor: '#dfe1e5', color: '#6b7280' }}>
                  <span className="gdot" style={{ background: '#9aa1ab' }} />
                  Obteniendo ubicación…
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal de llegada ── */}
      {haLlegado && (
        <div className="modal-bg">
          <div className="modal">
            <div className="modal-ic"><CheckCircle size={38} /></div>
            <h2>¡Has llegado!</h2>
            {destino && <div className="dest"><MapPin size={15} /> {destino.nombre}</div>}
            <p>Tu recorrido ha finalizado exitosamente.</p>
            <button
              className="btn btn-primary"
              onClick={() => { setHaLlegado(false); limpiarRuta(); }}
            >
              <CheckCircle size={16} /> Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wayfinding;
