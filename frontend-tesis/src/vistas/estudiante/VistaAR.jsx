import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { puntosARService } from '../../servicios/api';
import {
  X, MapPin, Clock, ChevronDown, AlertCircle, Camera,
  BookOpen, UtensilsCrossed, FlaskConical, GraduationCap,
  Building2, Activity, Navigation2,
} from 'lucide-react';
import './VistaAR.css';

// ─── Constantes ───────────────────────────────────────────────
const AR_FOV   = 70;
const MAX_DIST = 300;
const SMOOTH   = 0.12;

// ─── Utilidades geográficas ──────────────────────────────────
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

// ─── Estado abierto/cerrado ──────────────────────────────────
const DIA_MAP = { 0:'domingo',1:'lunes',2:'martes',3:'miercoles',4:'jueves',5:'viernes',6:'sabado' };
function estaAbierto(horarios) {
  if (!horarios?.length) return null;
  const dia  = DIA_MAP[new Date().getDay()];
  const mins = new Date().getHours() * 60 + new Date().getMinutes();
  for (const h of horarios) {
    const t = h.turno.toLowerCase()
      .replace('lunes a viernes','lunes-viernes')
      .replace('lunes a sábado','lunes-sabado')
      .replace('lunes a sabado','lunes-sabado')
      .replace('lunes a domingo','lunes-domingo');
    const aplica = t.includes('lunes-domingo')
      || (t.includes('lunes-sabado') && dia !== 'domingo')
      || (t.includes('lunes-viernes') && !['sabado','domingo'].includes(dia))
      || t === dia;
    if (aplica) {
      const [ah, am] = h.apertura.split(':').map(Number);
      const [ch, cm] = h.cierre.split(':').map(Number);
      return mins >= ah * 60 + am && mins <= ch * 60 + cm;
    }
  }
  return null;
}

// ─── Íconos por categoría (Lucide) ──────────────────────────
const CAT_ICONS = {
  biblioteca:     BookOpen,
  casino:         UtensilsCrossed,
  laboratorio:    FlaskConical,
  aula:           GraduationCap,
  administrativo: Building2,
  deportivo:      Activity,
  otro:           MapPin,
};
function CatIcon({ categoria, size = 20, ...props }) {
  const Icon = CAT_ICONS[categoria] || MapPin;
  return <Icon size={size} {...props} />;
}

// ─── Componente principal ─────────────────────────────────────
const VistaAR = () => {
  const navigate    = useRef(useNavigate()).current;
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);   // guarda el stream para aplicarlo después del render
  const headingRef  = useRef(null);
  const rafRef      = useRef(null);

  const [estado, setEstado] = useState('inicio');
  const [errorMsg, setErrorMsg]         = useState('');
  const [posicion, setPosicion]         = useState(null);
  const [heading, setHeading]           = useState(0);
  const [puntos, setPuntos]             = useState([]);
  const [visible, setVisible]           = useState([]);
  const [detalle, setDetalle]           = useState(null);

  const necesitaPermiso = typeof DeviceOrientationEvent !== 'undefined'
                       && typeof DeviceOrientationEvent.requestPermission === 'function';

  // Cargar puntos AR
  useEffect(() => {
    puntosARService.getPuntosPublicos()
      .then(res => { if (res.success) setPuntos(res.data); })
      .catch(() => {});
  }, []);

  // ── CORRECCIÓN CÁMARA: aplicar stream DESPUÉS del render ──
  // El <video> solo existe en el DOM cuando estado === 'listo',
  // por eso guardamos el stream en un ref y lo aplicamos en el effect.
  useEffect(() => {
    if (estado !== 'listo' || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [estado]);

  // ── Iniciar AR ──
  const iniciarAR = useCallback(async () => {
    setEstado('permisos');
    try {
      // iOS: la brújula DEBE ser el primer await desde el gesto del usuario
      if (necesitaPermiso) {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') throw new Error('Permiso de orientación denegado. Actívalo en Ajustes > Safari > Movimiento y orientación.');
      }

      // Cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;  // guardar, se aplica en el useEffect de arriba
      setEstado('listo');          // dispara el render con el <video>
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo acceder a la cámara o sensores.');
      setEstado('error');
    }
  }, [necesitaPermiso]);

  // GPS
  useEffect(() => {
    if (estado !== 'listo') return;
    const wid = navigator.geolocation.watchPosition(
      pos => setPosicion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [estado]);

  // Brújula con suavizado
  useEffect(() => {
    if (estado !== 'listo') return;
    const onOri = (e) => {
      let raw = null;
      if (e.webkitCompassHeading != null)     raw = e.webkitCompassHeading;
      else if (e.absolute && e.alpha != null) raw = (360 - e.alpha) % 360;
      else if (e.alpha != null)               raw = (360 - e.alpha) % 360;
      if (raw === null) return;
      if (headingRef.current === null) { headingRef.current = raw; }
      else {
        let d = raw - headingRef.current;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
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
  }, [estado]);

  // Calcular puntos visibles (rAF loop)
  useEffect(() => {
    if (estado !== 'listo' || !posicion) return;
    const tick = () => {
      const h = headingRef.current ?? 0;
      setVisible(
        puntos
          .map(p => ({
            ...p,
            dist:    calcDistancia(posicion.lat, posicion.lon, p.latitud, p.longitud),
            bearing: calcBearing(posicion.lat, posicion.lon, p.latitud, p.longitud),
            diff:    diffAngulo(h, calcBearing(posicion.lat, posicion.lon, p.latitud, p.longitud)),
          }))
          .filter(p => p.dist <= MAX_DIST && Math.abs(p.diff) <= AR_FOV / 2)
          .sort((a, b) => a.dist - b.dist)
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [estado, posicion, puntos]);

  // Detener stream al desmontar
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Pantalla inicio ──────────────────────────────────────────
  if (estado === 'inicio') return (
    <div className="ar-inicio">
      <div className="ar-inicio-glow" aria-hidden="true" />
      <div className="ar-inicio-topo" aria-hidden="true" />

      <button className="ar-back" onClick={() => navigate(-1)}><X size={20} /></button>

      <div className="ar-inicio-content">
        <span className="ar-inicio-eyebrow">
          <span className="ar-eyebrow-dot" />
          Realidad Aumentada · Campus Curicó
        </span>

        <h1 className="ar-inicio-titulo">
          Información contextual<br />en el campus
        </h1>
        <p className="ar-inicio-sub">
          Apunta la cámara de tu celular hacia los edificios del campus y verás en pantalla su nombre, horarios y estado actual en tiempo real.
        </p>

        <div className="ar-permisos-lista">
          <div className="ar-permiso-item">
            <Camera size={16} />
            <span>Acceso a la cámara trasera</span>
          </div>
          <div className="ar-permiso-item">
            <MapPin size={16} />
            <span>Ubicación GPS</span>
          </div>
          <div className="ar-permiso-item">
            <Navigation2 size={16} />
            <span>Brújula del dispositivo</span>
          </div>
        </div>

        <button className="ar-btn-activar" onClick={iniciarAR}>
          <Camera size={18} />
          Activar realidad aumentada
        </button>

        <p className="ar-inicio-nota">Funciona mejor en exteriores del campus</p>
      </div>
    </div>
  );

  // ── Cargando permisos ──
  if (estado === 'permisos') return (
    <div className="ar-estado-pantalla">
      <div className="ar-spinner-ring" />
      <p>Solicitando permisos…</p>
    </div>
  );

  // ── Error ──
  if (estado === 'error') return (
    <div className="ar-estado-pantalla ar-estado-pantalla--error">
      <button className="ar-back" onClick={() => navigate(-1)}><X size={20} /></button>
      <AlertCircle size={44} />
      <h2>No se pudo activar</h2>
      <p>{errorMsg}</p>
      <p className="ar-error-hint">
        En iOS: Ajustes → Safari → Acceso al movimiento y orientación → activar.<br />
        Luego recarga la página e intenta de nuevo.
      </p>
      <button className="ar-btn-volver" onClick={() => setEstado('inicio')}>Volver</button>
    </div>
  );

  // ── Vista AR principal ────────────────────────────────────────
  const abiertoDetalle = detalle ? estaAbierto(detalle.horarios) : null;

  return (
    <div className="ar-viewport">
      {/* Cámara */}
      <video ref={videoRef} className="ar-video" autoPlay playsInline muted />

      {/* HUD top */}
      <div className="ar-hud">
        <button className="ar-hud-back" onClick={() => navigate(-1)}>
          <X size={18} />
        </button>
        <div className="ar-hud-badges">
          <span className={`ar-hud-badge ${posicion ? 'ar-hud-badge--ok' : 'ar-hud-badge--wait'}`}>
            <MapPin size={11} />
            {posicion ? 'GPS activo' : 'Localizando…'}
          </span>
          <span className="ar-hud-badge">
            <Navigation2 size={11} />
            {Math.round(heading)}°
          </span>
        </div>
      </div>

      {/* Etiquetas AR */}
      {posicion && visible.map(p => {
        const xPct   = ((p.diff / AR_FOV) + 0.5) * 100;
        const escala = Math.max(0.65, 1 - p.dist / MAX_DIST * 0.5);
        const op     = Math.max(0.75, 1 - p.dist / MAX_DIST * 0.35);
        return (
          <div
            key={p._id}
            className="ar-etiqueta"
            style={{ left: `${xPct}%`, transform: `translateX(-50%) scale(${escala})`, opacity: op }}
            onClick={() => setDetalle(p)}
          >
            <div className="ar-etiqueta-icono">
              <CatIcon categoria={p.categoria} size={22} />
            </div>
            <div className="ar-etiqueta-cuerpo">
              <span className="ar-etiqueta-nombre">{p.nombre}</span>
              <span className="ar-etiqueta-dist">{formatDist(p.dist)}</span>
            </div>
            <ChevronDown size={12} className="ar-etiqueta-chevron" />
          </div>
        );
      })}

      {/* Sin puntos */}
      {posicion && visible.length === 0 && (
        <div className="ar-sin-puntos">Gira lentamente para ver los edificios</div>
      )}

      {/* Panel de detalle */}
      {detalle && (
        <div className="ar-panel-overlay" onClick={() => setDetalle(null)}>
          <div className="ar-panel" onClick={e => e.stopPropagation()}>
            <div className="ar-panel-drag" />
            <button className="ar-panel-close" onClick={() => setDetalle(null)}><X size={17} /></button>

            <div className="ar-panel-header">
              <div className="ar-panel-icono">
                <CatIcon categoria={detalle.categoria} size={24} />
              </div>
              <div>
                <h2 className="ar-panel-nombre">{detalle.nombre}</h2>
                <span className="ar-panel-cat">{detalle.categoria.charAt(0).toUpperCase() + detalle.categoria.slice(1)}</span>
              </div>
            </div>

            <div className="ar-panel-fila">
              <MapPin size={15} />
              <span>{formatDist(detalle.dist)} de distancia</span>
            </div>

            {abiertoDetalle !== null && (
              <div className={`ar-panel-estado ${abiertoDetalle ? 'ar-panel-estado--abierto' : 'ar-panel-estado--cerrado'}`}>
                <span className="ar-panel-estado-dot" />
                {abiertoDetalle ? 'Abierto ahora' : 'Cerrado ahora'}
              </div>
            )}

            {detalle.descripcion && (
              <p className="ar-panel-desc">{detalle.descripcion}</p>
            )}

            {detalle.horarios?.length > 0 && (
              <div className="ar-panel-horarios">
                <div className="ar-panel-horarios-titulo">
                  <Clock size={14} /> Horarios de atención
                </div>
                {detalle.horarios.map((h, i) => (
                  <div key={i} className="ar-horario">
                    <span className="ar-horario-dia">{h.turno}</span>
                    <span className="ar-horario-horas">{h.apertura} – {h.cierre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaAR;
