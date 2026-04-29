import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { calcularRuta } from '../../utils/calculadorRutas';
import grafoCampus from '../../data/grafoCampus.json';
import { getIconoPorCategoria, CATEGORIA_CONFIG, CATEGORIAS } from '../../utils/iconosMapa';
import './MapaWayfinding.css';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Coordenadas del Campus Curicó - Universidad de Talca 
const CAMPUS_CENTER = [-35.002607, -71.230519]; 
const CAMPUS_BOUNDS = [
  [-35.004500, -71.232500], 
  [-35.000700, -71.228500]  
];

// ─── Motor de rutas offline ────────────────────────────────────────────────
// calcularRuta() y grafoCampus se importan en la cabecera del archivo.
// El antiguo sistema de CAMINOS_CAMPUS y las funciones de routing manual
// han sido eliminados. El algoritmo A* en calculadorRutas.js los reemplaza.
// ───────────────────────────────────────────────────────────────────────────

const MapBounds = () => {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(CAMPUS_BOUNDS);
    map.fitBounds(CAMPUS_BOUNDS);
  }, [map]);
  return null;
};

// RoutingMachine eliminado. El cálculo de rutas ahora se realiza directamente
// dentro de MapaWayfinding usando el motor offline calcularRuta() + grafoCampus.
// Ver el useEffect de routing más abajo en el componente principal.

// ─── Controlador de Navegación en Tiempo Real ─────────────────────────────
// Este componente vive DENTRO de <MapContainer>, por lo que puede usar useMap().
// Es el único responsable de:
//   1. Seguir al usuario con panTo cuando isNavigating === true
//   2. Recalcular la ruta A* cada vez que la posición del usuario cambia
//   3. Detectar desviaciones y emitir una advertencia visual
const NavigationController = ({
  ubicacionUsuario,
  isNavigating,
  destino,
  coordenadasRuta,
  onRutaActualizada,  // callback: ({ coordenadas, distancia, tiempo })
}) => {
  const map = useMap();
  const prevLatLngRef          = useRef(null);
  const ultimoRecalculoRef     = useRef(0);
  const UMBRAL_MOV_M           = 5;      // mínimo movimiento para disparar lógica
  const UMBRAL_DESVIACION_M    = 25;     // desviación máxima antes de recalcular
  const INTERVALO_MIN_RECALC   = 8000;  // ms mínimos entre recálculos A*
  const ZOOM_NAVEGACION        = 19;

  useEffect(() => {
    if (!isNavigating || !ubicacionUsuario) return;

    const nuevaPos = [ubicacionUsuario.lat, ubicacionUsuario.lng];

    // ── 1. Filtrar micro-movimientos (GPS jitter) ──────────────────────────
    if (prevLatLngRef.current) {
      const mov = map.distance(prevLatLngRef.current, nuevaPos);
      if (mov < UMBRAL_MOV_M) return;
    }
    prevLatLngRef.current = nuevaPos;

    // ── 2. Seguir al usuario suavemente (panTo) ────────────────────────────
    map.panTo(nuevaPos, { animate: true, duration: 0.6, easeLinearity: 0.5 });
    // Mantener zoom de navegación si el usuario no lo cambió manualmente
    if (map.getZoom() < ZOOM_NAVEGACION - 1) {
      map.setZoom(ZOOM_NAVEGACION, { animate: true });
    }

    // ── 3. Verificar desviación y recalcular si es necesario ───────────────
    if (!destino || !coordenadasRuta || coordenadasRuta.length < 2) return;

    // Distancia mínima del usuario a cualquier punto de la polilínea actual
    let distMinRuta = Infinity;
    for (const punto of coordenadasRuta) {
      const d = map.distance(nuevaPos, punto);
      if (d < distMinRuta) distMinRuta = d;
    }

    const ahora = Date.now();
    const tiempoDesdeUltimoRecalc = ahora - ultimoRecalculoRef.current;

    if (distMinRuta > UMBRAL_DESVIACION_M && tiempoDesdeUltimoRecalc > INTERVALO_MIN_RECALC) {
      ultimoRecalculoRef.current = ahora;
      console.log(`🔄 Desviación ${distMinRuta.toFixed(0)}m → recalculando A*...`);

      const destinoLat = destino.ubicacion.coordinates[1];
      const destinoLng = destino.ubicacion.coordinates[0];

      const resultado = calcularRuta(
        ubicacionUsuario.lat, ubicacionUsuario.lng,
        destinoLat, destinoLng,
        grafoCampus
      );

      if (resultado && onRutaActualizada) {
        const distanciaKm = (resultado.summary.totalDistance / 1000).toFixed(2);
        const tiempoMin   = Math.max(1, Math.round(resultado.summary.totalTime / 60));
        console.log(`✅ Ruta recalculada: ${distanciaKm} km | ${tiempoMin} min`);
        onRutaActualizada({
          coordenadas: resultado.coordenadas,
          distancia:   distanciaKm,
          tiempo:      tiempoMin,
        });
      }
    }
  // ubicacionUsuario cambia cada vez que el GPS emite una nueva posición
  }, [map, ubicacionUsuario, isNavigating, destino, coordenadasRuta]);

  return null;
};

// ─── prop isNavigating reemplaza modoViaje ────────────────────────────────
const MapaWayfinding = ({ origen, destino, ubicacionUsuario, onRutaCalculada, isNavigating = false, heading = null }) => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [coordenadasRuta, setCoordenadasRuta] = useState([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);

  // ── Callback que NavigationController usa para actualizar la ruta en vivo ─
  const handleRutaActualizada = ({ coordenadas, distancia, tiempo }) => {
    setCoordenadasRuta(coordenadas);
    if (onRutaCalculada) onRutaCalculada({ distancia, tiempo, coordenadas });
  };

  // ── Motor de rutas offline A* ────────────────────────────────────────────
  // Se dispara cuando:
  //   a) El usuario selecciona un nuevo origen/destino (planificación estática)
  //   b) isNavigating se activa por primera vez (calcula la ruta inicial)
  // El recálculo en tiempo real lo gestiona NavigationController.
  useEffect(() => {
    if (!destino) {
      setCoordenadasRuta([]);
      if (onRutaCalculada) onRutaCalculada(null);
      return;
    }

    // En modo navegación usamos ubicacionUsuario como origen dinámico
    const origenLat = isNavigating && ubicacionUsuario
      ? ubicacionUsuario.lat
      : origen?.ubicacion.coordinates[1];
    const origenLng = isNavigating && ubicacionUsuario
      ? ubicacionUsuario.lng
      : origen?.ubicacion.coordinates[0];

    if (origenLat == null || origenLng == null) return;

    const destinoLat = destino.ubicacion.coordinates[1];
    const destinoLng = destino.ubicacion.coordinates[0];

    console.log(`🚶 [Motor A*] ${isNavigating ? 'Nav. inicial' : 'Planificación'}: [${origenLat.toFixed(5)},${origenLng.toFixed(5)}] → [${destinoLat.toFixed(5)},${destinoLng.toFixed(5)}]`);

    const resultado = calcularRuta(origenLat, origenLng, destinoLat, destinoLng, grafoCampus);

    if (!resultado) {
      console.warn('⚠️ Motor A*: sin ruta entre los nodos seleccionados.');
      setCoordenadasRuta([]);
      if (onRutaCalculada) onRutaCalculada(null);
      return;
    }

    const distanciaKm = (resultado.summary.totalDistance / 1000).toFixed(2);
    const tiempoMin   = Math.max(1, Math.round(resultado.summary.totalTime / 60));
    console.log(`✅ Ruta calculada: ${distanciaKm} km | ${tiempoMin} min | ${resultado.coordenadas.length} pts`);

    setCoordenadasRuta(resultado.coordenadas);
    if (onRutaCalculada) onRutaCalculada({ distancia: distanciaKm, tiempo: tiempoMin, coordenadas: resultado.coordenadas });
  // isNavigating entra en las deps para disparar la ruta inicial al presionar "Navegar"
  }, [origen, destino, isNavigating]);

  // (destinoOriginalRef eliminado — NavigationController maneja el recálculo directamente)

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setCargando(true);
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/ubicaciones/publicas?visible=true`);
      
      if (!response.ok) {
        throw new Error('Error al cargar ubicaciones');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🗺️ Ubicaciones cargadas:', data.data.length);
        data.data.forEach(ub => {
          console.log(`📍 ${ub.nombre}:`);
          console.log(`   - GeoJSON [lng, lat]: [${ub.ubicacion.coordinates[0]}, ${ub.ubicacion.coordinates[1]}]`);
          console.log(`   - Leaflet [lat, lng]: [${ub.ubicacion.coordinates[1]}, ${ub.ubicacion.coordinates[0]}]`);
        });
        setUbicaciones(data.data);
      } else {
        throw new Error(data.message || 'Error al cargar ubicaciones');
      }
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar por tipo Y ocultar origen/destino del listado general
  const idsEspeciales = new Set([
    origen?._id,
    destino?._id,
  ].filter(Boolean));

  const ubicacionesFiltradas = ubicaciones.filter(ub => {
    if (idsEspeciales.has(ub._id)) return false; // ya tienen marcador especial
    if (filtroTipo === 'todos') return true;
    return (ub.categoria || ub.tipo) === filtroTipo;
  });

  // Construir botones de filtro desde CATEGORIAS (siempre completo)
  const categoriasFiltro = [{ value: 'todos', label: 'Todos', color: '#E53935' }, ...CATEGORIAS];

  const obtenerIcono = (tipo, esOrigen = false, esDestino = false) => {
    // Iconos especiales para origen y destino
    if (esOrigen) {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: #10b981; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.3); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    }

    if (esDestino) {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: #ef4444; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 3px 8px rgba(0,0,0,0.3); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16], // Centrado
        popupAnchor: [0, -16]
      });
    }

    // Para ubicaciones regulares: usar icono por categoría
    return getIconoPorCategoria(tipo || 'otro');
  };

  // ── Ícono del usuario estilo Google Maps ─────────────────────────────────
  // Sector azul con degradado: ancho ±40°, radio 80px, fading toward tip.
  // viewBox 120×120, centro en (60,60). Puntos del sector (±40° desde arriba):
  //   Left : 60 + 80·sin(−40°) = 8.6  |  60 − 80·cos(40°) = −1.3  → ~(8.6, −1.3)
  //   Right: 60 + 80·sin( 40°) = 111.4 |  mismo Y
  //   Arc  : r=80, large-arc=0, sweep=1
  const crearIconoUsuario = (headingDeg) => {
    const tieneRumbo = headingDeg !== null && headingDeg !== undefined;

    const conoSVG = tieneRumbo ? `
      <div class="usuario-heading-cone" style="transform:rotate(${headingDeg}deg);">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120" height="120"
          viewBox="0 0 120 120"
          style="overflow:visible; display:block;"
        >
          <defs>
            <!-- Degradado radial: opaco en el centro (userloc), transparente en el tip -->
            <radialGradient id="hdg-grad" cx="50%" cy="100%" r="80%" fx="50%" fy="100%">
              <stop offset="0%"   stop-color="#4285F4" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="#4285F4" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <!-- Sector ±40° apuntando hacia arriba -->
          <path
            d="M 60 60 L 8.6 -1.3 A 80 80 0 0 1 111.4 -1.3 Z"
            fill="url(#hdg-grad)"
            stroke="rgba(66,133,244,0.3)"
            stroke-width="0.5"
          />
        </svg>
      </div>` : '';

    return L.divIcon({
      className: '',
      html: `
        <div class="usuario-dot-wrapper">
          ${conoSVG}
          <div class="usuario-dot-pulse"></div>
          <div class="usuario-dot-core"></div>
        </div>
      `,
      iconSize:   [120, 120],
      iconAnchor: [60, 60],
    });
  };

  if (cargando) {
    return (
      <div className="mapa-wayfinding-container">
        <div className="mapa-loading">
          <p>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mapa-wayfinding-container">
        <div className="mapa-error">
          <p>Error: {error}</p>
          <button onClick={cargarUbicaciones}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mapa-wayfinding-container">
      {!isNavigating && (
        <div className="mapa-controles">
          <h3>Filtrar por tipo:</h3>
          <div className="filtro-tipos">
            {categoriasFiltro.map(cat => (
              <button
                key={cat.value}
                className={`filtro-btn ${filtroTipo === cat.value ? 'activo' : ''}`}
                style={filtroTipo === cat.value ? { background: cat.color, borderColor: cat.color } : {}}
                onClick={() => setFiltroTipo(cat.value)}
              >
                {cat.value !== 'todos' && (
                  <span style={{
                    display: 'inline-block', width: 8, height: 8,
                    borderRadius: '50%', background: cat.color,
                    marginRight: 5, flexShrink: 0
                  }} />
                )}
                {cat.label}
              </button>
            ))}
          </div>
          <div className="mapa-info">
            <p>Ubicaciones visibles: {ubicacionesFiltradas.length}</p>
          </div>
        </div>
      )}

      {/* Tarjeta flotante de ubicación seleccionada */}
      <div className="mapa-contenedor" style={{ position: 'relative' }}>
        {ubicacionSeleccionada && (() => {
          const cat = ubicacionSeleccionada.categoria || ubicacionSeleccionada.tipo || 'otro';
          const cfg = CATEGORIA_CONFIG[cat] || CATEGORIA_CONFIG.otro;
          return (
            <div className="info-card-flotante">
              <div className="info-card-head">
                <div className="info-card-icon" style={{ color: cfg.color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <div className="info-card-nombre">{ubicacionSeleccionada.nombre}</div>
                  <span className="info-card-badge" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                </div>
                <button className="info-card-close" onClick={() => setUbicacionSeleccionada(null)}>&#x2715;</button>
              </div>
              {(ubicacionSeleccionada.descripcion || ubicacionSeleccionada.metadatos?.horario) && (
                <div className="info-card-meta">
                  {ubicacionSeleccionada.descripcion && <p>{ubicacionSeleccionada.descripcion}</p>}
                  {ubicacionSeleccionada.metadatos?.horario && <p><strong>Horario:</strong> {ubicacionSeleccionada.metadatos.horario}</p>}
                  {ubicacionSeleccionada.metadatos?.contacto && <p><strong>Contacto:</strong> {ubicacionSeleccionada.metadatos.contacto}</p>}
                </div>
              )}
            </div>
          );
        })()}
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={16}
          minZoom={15}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
        >
          <MapBounds />
          {/* Controlador de navegación en tiempo real */}
          <NavigationController
            ubicacionUsuario={ubicacionUsuario}
            isNavigating={isNavigating}
            destino={destino}
            coordenadasRuta={coordenadasRuta}
            onRutaActualizada={handleRutaActualizada}
          />

          {/* Polyline dual: halo debajo + línea sólida encima — efecto Google Maps */}
          {coordenadasRuta.length > 0 && (
            <>
              {/* Halo semi-transparente */}
              <Polyline
                positions={coordenadasRuta}
                pathOptions={{
                  color: '#93c5fd',
                  weight: 14,
                  opacity: 0.45,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Línea principal sólida */}
              <Polyline
                positions={coordenadasRuta}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 6,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
            maxNativeZoom={19}
          />

          {/* Marcadores de ubicaciones (excluye origen/destino para evitar superposición) */}
          {ubicacionesFiltradas.map((ubicacion) => {
            const lng = ubicacion.ubicacion.coordinates[0];
            const lat = ubicacion.ubicacion.coordinates[1];
            const position = [lat, lng];

            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

            return (
              <Marker
                key={ubicacion._id}
                position={position}
                icon={obtenerIcono(ubicacion.categoria || ubicacion.tipo)}
                eventHandlers={{
                  click: () => setUbicacionSeleccionada(ubicacion),
                }}
              />
            );
          })}

          {/* Marcador de Origen — sin Popup, la tarjeta flotante lo reemplaza */}
          {origen && (
            <Marker
              position={[
                origen.ubicacion.coordinates[1],
                origen.ubicacion.coordinates[0]
              ]}
              icon={obtenerIcono(null, true, false)}
              eventHandlers={{ click: () => setUbicacionSeleccionada({ ...origen, _override: 'Origen' }) }}
            />
          )}

          {/* Marcador de Destino */}
          {destino && (
            <Marker
              position={[
                destino.ubicacion.coordinates[1],
                destino.ubicacion.coordinates[0]
              ]}
              icon={obtenerIcono(null, false, true)}
              eventHandlers={{ click: () => setUbicacionSeleccionada({ ...destino, _override: 'Destino' }) }}
            />
          )}

          {/* Marcador del usuario con cono de rumbo */}
          {ubicacionUsuario && (
            <Marker
              position={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
              zIndexOffset={1000}
              icon={crearIconoUsuario(heading)}
            />
          )}

          {/* Motor de rutas offline — el cálculo ocurre en el useEffect de arriba */}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaWayfinding;
