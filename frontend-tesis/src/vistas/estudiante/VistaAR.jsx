import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { puntosARService } from '../../servicios/api';
import { X, Navigation, MapPin, Clock, ChevronDown, AlertCircle, Loader } from 'lucide-react';
import './VistaAR.css';

// ─── Constantes ───────────────────────────────────────────────
const AR_FOV    = 70;   // ángulo horizontal del campo visual (grados)
const MAX_DIST  = 300;  // metros — puntos más lejos no se muestran
const SMOOTH    = 0.12; // factor de suavizado del compás (0=rígido, 1=sin suavizado)

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

function formatDistancia(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ─── Detectar si está abierto ahora ─────────────────────────

const DIA_MAP = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

function estaAbierto(horarios) {
  if (!horarios?.length) return null;
  const now  = new Date();
  const dia  = DIA_MAP[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();

  for (const h of horarios) {
    const turno = h.turno.toLowerCase()
      .replace('lunes a viernes', 'lunes-viernes')
      .replace('lunes a sábado', 'lunes-sabado')
      .replace('lunes a sabado', 'lunes-sabado')
      .replace('lunes a domingo', 'lunes-domingo');

    let aplica = false;
    if (turno.includes('lunes-domingo')) aplica = true;
    else if (turno.includes('lunes-sabado') && dia !== 'domingo') aplica = true;
    else if (turno.includes('lunes-viernes') && !['sabado', 'domingo'].includes(dia)) aplica = true;
    else if (turno === dia) aplica = true;

    if (aplica) {
      const [ah, am] = h.apertura.split(':').map(Number);
      const [ch, cm] = h.cierre.split(':').map(Number);
      const aMin = ah * 60 + am;
      const cMin = ch * 60 + cm;
      return mins >= aMin && mins <= cMin;
    }
  }
  return null;
}

// ─── Íconos por categoría ────────────────────────────────────
const CAT_ICON  = { biblioteca: '📚', casino: '🍽️', laboratorio: '🔬', aula: '🏫', administrativo: '🏛️', deportivo: '⚽', otro: '📍' };
const CAT_COLOR = { biblioteca: '#1565C0', casino: '#E65100', laboratorio: '#1B5E20', aula: '#4A148C', administrativo: '#BF360C', deportivo: '#006064', otro: '#C62828' };

// ─── Componente principal ─────────────────────────────────────

const VistaAR = () => {
  const navigate = useNavigate();
  const videoRef    = useRef(null);
  const headingRef  = useRef(null); // valor suavizado del compás
  const rafRef      = useRef(null);

  const [estado, setEstado] = useState('inicio'); // inicio | permisos | listo | sin-brujula | error
  const [errorMsg, setErrorMsg] = useState('');
  const [posicion, setPosicion] = useState(null);
  const [heading, setHeading]   = useState(0);
  const [puntos, setPuntos]     = useState([]);
  const [visible, setVisible]   = useState([]);
  const [detalle, setDetalle]   = useState(null);
  const [iosPermiso, setIosPermiso] = useState(false);

  // Detectar si iOS necesita permiso para el sensor
  const necesitaPermiso = typeof DeviceOrientationEvent !== 'undefined' &&
                          typeof DeviceOrientationEvent.requestPermission === 'function';

  // ── Cargar puntos AR desde la API ──
  useEffect(() => {
    puntosARService.getPuntosPublicos()
      .then(res => { if (res.success) setPuntos(res.data); })
      .catch(() => {});
  }, []);

  // ── Iniciar la sesión AR ──
  const iniciarAR = useCallback(async () => {
    setEstado('permisos');
    try {
      // 1. Cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Permiso sensor iOS
      if (necesitaPermiso && !iosPermiso) {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') throw new Error('Permiso de orientación denegado');
        setIosPermiso(true);
      }

      setEstado('listo');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo acceder a la cámara o sensores.');
      setEstado('error');
    }
  }, [necesitaPermiso, iosPermiso]);

  // ── GPS ──
  useEffect(() => {
    if (estado !== 'listo') return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => setPosicion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [estado]);

  // ── Brújula ──
  useEffect(() => {
    if (estado !== 'listo') return;

    const onOrientation = (e) => {
      let raw = null;
      if (e.webkitCompassHeading != null) {
        raw = e.webkitCompassHeading; // iOS
      } else if (e.absolute && e.alpha != null) {
        raw = (360 - e.alpha) % 360;  // Android absolute
      } else if (e.alpha != null) {
        raw = (360 - e.alpha) % 360;  // fallback
      }
      if (raw === null) return;

      // Suavizado circular
      if (headingRef.current === null) {
        headingRef.current = raw;
      } else {
        let diff = raw - headingRef.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        headingRef.current = headingRef.current + diff * SMOOTH;
        headingRef.current = ((headingRef.current % 360) + 360) % 360;
      }
      setHeading(headingRef.current);
    };

    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [estado]);

  // ── Calcular puntos visibles en FOV (rAF loop) ──
  useEffect(() => {
    if (estado !== 'listo' || !posicion) return;

    const calcular = () => {
      const h = headingRef.current ?? 0;
      const result = puntos
        .map((p) => {
          const dist    = calcDistancia(posicion.lat, posicion.lon, p.latitud, p.longitud);
          const bearing = calcBearing(posicion.lat, posicion.lon, p.latitud, p.longitud);
          const diff    = diffAngulo(h, bearing);
          return { ...p, dist, bearing, diff };
        })
        .filter((p) => p.dist <= MAX_DIST && Math.abs(p.diff) <= AR_FOV / 2)
        .sort((a, b) => a.dist - b.dist);

      setVisible(result);
      rafRef.current = requestAnimationFrame(calcular);
    };

    rafRef.current = requestAnimationFrame(calcular);
    return () => cancelAnimationFrame(rafRef.current);
  }, [estado, posicion, puntos, heading]);

  // ── Detener stream al desmontar ──
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ── Pantalla de inicio ──
  if (estado === 'inicio') {
    return (
      <div className="ar-screen ar-screen--inicio">
        <button className="ar-back-btn" onClick={() => navigate(-1)}><X size={22} /></button>
        <div className="ar-intro-card">
          <div className="ar-intro-icon">📡</div>
          <h1>Información del Campus en Vivo</h1>
          <p>Apunta la cámara de tu celular hacia los edificios del campus y verás información en tiempo real sobre cada lugar: nombre, horarios y más.</p>
          <ul className="ar-intro-permisos">
            <li>📷 Acceso a la cámara trasera</li>
            <li>📍 Ubicación GPS</li>
            <li>🧭 Brújula del dispositivo</li>
          </ul>
          <button className="ar-btn-iniciar" onClick={iniciarAR}>
            <Navigation size={20} /> Activar realidad aumentada
          </button>
          <p className="ar-intro-nota">Funciona mejor en exteriores del campus</p>
        </div>
      </div>
    );
  }

  // ── Solicitando permisos ──
  if (estado === 'permisos') {
    return (
      <div className="ar-screen ar-screen--loading">
        <Loader size={40} className="ar-loader-spin" />
        <p>Solicitando permisos…</p>
      </div>
    );
  }

  // ── Error ──
  if (estado === 'error') {
    return (
      <div className="ar-screen ar-screen--error">
        <button className="ar-back-btn" onClick={() => navigate(-1)}><X size={22} /></button>
        <AlertCircle size={48} color="#E53935" />
        <h2>No se pudo activar la AR</h2>
        <p>{errorMsg}</p>
        <p className="ar-error-hint">Asegúrate de dar permisos de cámara y ubicación en tu navegador, luego recarga la página.</p>
        <button className="ar-btn-reintentar" onClick={() => setEstado('inicio')}>Volver</button>
      </div>
    );
  }

  // ── Vista principal AR ──
  const abierto = detalle ? estaAbierto(detalle.horarios) : null;

  return (
    <div className="ar-viewport">
      {/* Video de la cámara */}
      <video ref={videoRef} className="ar-video" autoPlay playsInline muted />

      {/* HUD superior */}
      <div className="ar-hud-top">
        <button className="ar-close-btn" onClick={() => navigate(-1)}><X size={20} /></button>
        <div className="ar-hud-info">
          {posicion
            ? <span className="ar-gps-ok">📍 GPS activo</span>
            : <span className="ar-gps-wait">⏳ Esperando GPS…</span>
          }
          <span className="ar-compass">🧭 {Math.round(heading)}°</span>
        </div>
      </div>

      {/* Overlays AR */}
      {posicion && visible.map((p) => {
        const xPercent = ((p.diff / AR_FOV) + 0.5) * 100;
        const scale = Math.max(0.6, 1 - p.dist / MAX_DIST);
        const opacity = Math.max(0.7, 1 - p.dist / MAX_DIST * 0.5);
        const color = CAT_COLOR[p.categoria] || '#C62828';

        return (
          <div
            key={p._id}
            className="ar-label"
            style={{
              left: `${xPercent}%`,
              transform: `translateX(-50%) scale(${scale})`,
              opacity,
              '--accent': color,
            }}
            onClick={() => setDetalle(p)}
          >
            <div className="ar-label-icon" style={{ background: color }}>
              {CAT_ICON[p.categoria] || '📍'}
            </div>
            <div className="ar-label-body">
              <span className="ar-label-name">{p.nombre}</span>
              <span className="ar-label-dist">{formatDistancia(p.dist)}</span>
            </div>
            <ChevronDown size={14} className="ar-label-arrow" />
          </div>
        );
      })}

      {/* Sin puntos en FOV */}
      {posicion && visible.length === 0 && (
        <div className="ar-no-puntos">
          <span>Gira lentamente para ver los edificios</span>
        </div>
      )}

      {/* Panel de detalle (bottom sheet) */}
      {detalle && (
        <div className="ar-detalle-overlay" onClick={() => setDetalle(null)}>
          <div className="ar-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="ar-detalle-drag" />
            <button className="ar-detalle-close" onClick={() => setDetalle(null)}><X size={18} /></button>

            <div className="ar-detalle-header">
              <span className="ar-detalle-icon" style={{ background: CAT_COLOR[detalle.categoria] || '#C62828' }}>
                {CAT_ICON[detalle.categoria] || '📍'}
              </span>
              <div>
                <h2 className="ar-detalle-nombre">{detalle.nombre}</h2>
                <span className="ar-detalle-cat">{detalle.categoria}</span>
              </div>
            </div>

            {/* Distancia */}
            <div className="ar-detalle-row">
              <MapPin size={16} />
              <span>{formatDistancia(detalle.dist)} de distancia</span>
            </div>

            {/* Estado abierto/cerrado */}
            {abierto !== null && (
              <div className={`ar-detalle-estado ${abierto ? 'ar-abierto' : 'ar-cerrado'}`}>
                {abierto ? '🟢 Abierto ahora' : '🔴 Cerrado ahora'}
              </div>
            )}

            {/* Descripción */}
            {detalle.descripcion && (
              <p className="ar-detalle-desc">{detalle.descripcion}</p>
            )}

            {/* Horarios */}
            {detalle.horarios?.length > 0 && (
              <div className="ar-detalle-horarios">
                <div className="ar-detalle-horarios-title"><Clock size={15} /> Horarios de atención</div>
                {detalle.horarios.map((h, i) => (
                  <div key={i} className="ar-horario-item">
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
