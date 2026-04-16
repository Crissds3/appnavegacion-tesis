import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { calcularRuta } from '../../utils/calculadorRutas';
import grafoCampus from '../../data/grafoCampus.json';
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
const MapaWayfinding = ({ origen, destino, ubicacionUsuario, onRutaCalculada, isNavigating = false }) => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [coordenadasRuta, setCoordenadasRuta] = useState([]);

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

  const ubicacionesFiltradas = filtroTipo === 'todos' 
    ? ubicaciones 
    : ubicaciones.filter(ub => ub.tipo === filtroTipo);

  const tiposUnicos = ['todos', ...new Set(ubicaciones.map(ub => ub.tipo))];

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

    // Iconos por tipo de ubicación
    const colores = {
      edificio: '#E53935',
      servicio: '#E53935',
      entrada: '#E53935',
      estacionamiento: '#E53935',
      otro: '#E53935'
    };
    
    const color = colores[tipo] || colores.otro;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [25, 25],
      iconAnchor: [12.5, 12.5],
      popupAnchor: [0, -12.5]
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
      <div className="mapa-controles">
        <h3>Filtrar por tipo:</h3>
        <div className="filtro-tipos">
          {tiposUnicos.map(tipo => (
            <button
              key={tipo}
              className={`filtro-btn ${filtroTipo === tipo ? 'activo' : ''}`}
              onClick={() => setFiltroTipo(tipo)}
            >
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </div>
        <div className="mapa-info">
          <p>Ubicaciones visibles: {ubicacionesFiltradas.length}</p>
        </div>
      </div>

      <div className="mapa-contenedor">
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
          
          {/* Polyline para dibujar la ruta visualmente */}
          {coordenadasRuta.length > 0 && (
            <Polyline
              positions={coordenadasRuta}
              pathOptions={{
                color: '#2563eb',
                weight: 8,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
          )}
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
            maxNativeZoom={19}
          />

          {/* Marcadores de ubicaciones */}
          {ubicacionesFiltradas.map((ubicacion) => {
            // GeoJSON usa [lng, lat], Leaflet usa [lat, lng]
            // Siempre invertir: coordinates[0]=lng, coordinates[1]=lat
            const lng = ubicacion.ubicacion.coordinates[0];
            const lat = ubicacion.ubicacion.coordinates[1];
            const position = [lat, lng]; // Formato Leaflet: [lat, lng]
            
            // Validar que las coordenadas estén en rangos válidos
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
              console.warn(`⚠️ Coordenadas inválidas para ${ubicacion.nombre}: [${lat}, ${lng}]`);
              return null;
            }
            
            return (
              <Marker
                key={ubicacion._id}
                position={position}
                icon={obtenerIcono(ubicacion.tipo)}
              >
                <Popup>
                  <div className="marker-popup">
                    <div className="popup-header">
                      {ubicacion.nombre}
                    </div>
                    <div className="popup-body">
                      <p><strong>Tipo:</strong> {ubicacion.tipo.charAt(0).toUpperCase() + ubicacion.tipo.slice(1)}</p>
                      {ubicacion.descripcion && (
                        <p>{ubicacion.descripcion}</p>
                      )}
                      {ubicacion.metadatos && (
                        <div className="popup-metadatos">
                          {ubicacion.metadatos.horario && (
                            <p><strong>Horario:</strong> {ubicacion.metadatos.horario}</p>
                          )}
                          {ubicacion.metadatos.contacto && (
                            <p><strong>Contacto:</strong> {ubicacion.metadatos.contacto}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador de Origen */}
          {origen && (
            <Marker
              position={[
                origen.ubicacion.coordinates[1], // lat
                origen.ubicacion.coordinates[0]  // lng
              ]}
              icon={obtenerIcono(null, true, false)}
            >
              <Popup>
                <div className="marker-popup origen">
                  <div className="popup-header" style={{ background: '#4CAF50' }}>
                    📍 Origen
                  </div>
                  <div className="popup-body">
                    <p><strong>{origen.nombre}</strong></p>
                    <p>Punto de partida</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador de Destino */}
          {destino && (
            <Marker
              position={[
                destino.ubicacion.coordinates[1], // lat
                destino.ubicacion.coordinates[0]  // lng
              ]}
              icon={obtenerIcono(null, false, true)}
            >
              <Popup>
                <div className="marker-popup destino">
                  <div className="popup-header">
                    🎯 Destino
                  </div>
                  <div className="popup-body">
                    <p><strong>{destino.nombre}</strong></p>
                    <p>Punto de llegada</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcador del usuario — punto azul pulsante */}
          {ubicacionUsuario && (
            <Marker
              position={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
              zIndexOffset={1000}
              icon={L.divIcon({
                className: '',   // Sin clase base para no interferir con Leaflet default
                html: `
                  <div class="usuario-dot-wrapper">
                    <div class="usuario-dot-pulse"></div>
                    <div class="usuario-dot-core"></div>
                  </div>
                `,
                iconSize:   [36, 36],
                iconAnchor: [18, 18],
                popupAnchor:[0, -18]
              })}
            >
              <Popup>
                <div className="marker-popup usuario">
                  <div className="popup-header" style={{ background: '#2563eb' }}>
                    📍 Tu ubicación
                  </div>
                  <div className="popup-body">
                    <p style={{ margin: 0, fontSize: 12 }}>
                      {ubicacionUsuario.precision
                        ? `Precisión: ~${Math.round(ubicacionUsuario.precision)} m`
                        : 'GPS activo'}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Motor de rutas offline — el cálculo ocurre en el useEffect de arriba */}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaWayfinding;
