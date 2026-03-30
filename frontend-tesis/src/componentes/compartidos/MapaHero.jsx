import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AnimatedFly = ({ center, zoom }) => {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    setTimeout(() => {
      map.flyTo(center, zoom, { animate: true, duration: 2.8, easeLinearity: 0.12 });
    }, 350);
  }, [map, center, zoom]);

  return null;
};

const CAMPUS_CENTER = [-35.002607, -71.2293];
const CAMPUS_ZOOM  = 17;

const MapaHero = () => (
  <div style={{ position: 'relative', width: '100%', borderRadius: '20px' }}>
    {/* Glow rojo detrás del mapa */}
    <div style={{
      position: 'absolute',
      inset: '-6px',
      borderRadius: '26px',
      background: 'radial-gradient(ellipse at center, rgba(229,57,53,0.18) 0%, transparent 70%)',
      zIndex: 0,
      pointerEvents: 'none',
    }} />

    <MapContainer
      center={CAMPUS_CENTER}
      zoom={13}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
      keyboard={false}
      touchZoom={false}
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '380px',
        borderRadius: '20px',
        border: '2px solid rgba(229,57,53,0.5)',
        boxShadow:
          '0 0 0 4px rgba(229,57,53,0.08), 0 12px 40px rgba(0,0,0,0.12)',
      }}
    >
      {/* CartoDB Voyager — colorido y moderno */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={20}
      />
      <AnimatedFly center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} />
    </MapContainer>

    {/* Badge flotante */}
    <div style={{
      position: 'absolute',
      bottom: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      padding: '6px 16px',
      background: 'rgba(255,255,255,0.97)',
      border: '1.5px solid rgba(229,57,53,0.3)',
      borderRadius: '50px',
      fontSize: '0.78rem',
      fontWeight: '700',
      color: '#E53935',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
      pointerEvents: 'none',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{
        width: '7px', height: '7px',
        borderRadius: '50%',
        background: '#E53935',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      Campus Curicó · UTalca
    </div>
  </div>
);

export default MapaHero;
