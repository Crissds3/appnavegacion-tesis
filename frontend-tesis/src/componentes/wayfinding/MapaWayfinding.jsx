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

// Componente para centrar el mapa en la ubicación del usuario y detectar desviaciones
const MapAutoCenter = ({ ubicacionUsuario, modoViaje, coordenadasRuta, onRecalcularRuta }) => {
  const map = useMap();
  const prevUbicacionRef = useRef(null);
  const ultimaRecalculacionRef = useRef(null);
  const UMBRAL_DESVIACION = 25; // 25 metros de desviación antes de recalcular
  const TIEMPO_MIN_RECALCULO = 10000; // 10 segundos mínimo entre recálculos

  useEffect(() => {
    if (!modoViaje || !ubicacionUsuario) return;

    // Verificar si el usuario se desvió de la ruta
    if (coordenadasRuta && coordenadasRuta.length > 1) {
      const ubicacionActual = [ubicacionUsuario.lat, ubicacionUsuario.lng];
      
      // Calcular distancia mínima a cualquier punto de la ruta
      let distanciaMinima = Infinity;
      for (let i = 0; i < coordenadasRuta.length; i++) {
        const distancia = map.distance(ubicacionActual, coordenadasRuta[i]);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
        }
      }
      
      // Si se desvió más del umbral, recalcular
      const ahora = Date.now();
      const tiempoDesdeUltimoRecalculo = ultimaRecalculacionRef.current 
        ? ahora - ultimaRecalculacionRef.current 
        : Infinity;
      
      if (distanciaMinima > UMBRAL_DESVIACION && tiempoDesdeUltimoRecalculo > TIEMPO_MIN_RECALCULO) {
        console.log(`⚠️ Desviación detectada: ${distanciaMinima.toFixed(0)}m de la ruta`);
        console.log('🔄 Recalculando ruta desde posición actual...');
        ultimaRecalculacionRef.current = ahora;
        
        // Llamar función de recálculo
        if (onRecalcularRuta) {
          onRecalcularRuta(ubicacionUsuario);
        }
      }
    }

    // Solo actualizar si la ubicación cambió significativamente (más de 5 metros)
    if (prevUbicacionRef.current) {
      const distancia = map.distance(
        [prevUbicacionRef.current.lat, prevUbicacionRef.current.lng],
        [ubicacionUsuario.lat, ubicacionUsuario.lng]
      );
      
      if (distancia < 5) {
        return; // No actualizar si el movimiento es muy pequeño
      }
    }

    prevUbicacionRef.current = ubicacionUsuario;
    
    console.log('📍 Centrando mapa en ubicación del usuario');
    map.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 18, {
      animate: true,
      duration: 0.5
    });
  }, [map, ubicacionUsuario, modoViaje]);

  return null;
};

const MapaWayfinding = ({ origen, destino, ubicacionUsuario, onRutaCalculada, modoViaje = false, onRecalcularRuta }) => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [coordenadasRuta, setCoordenadasRuta] = useState([]);
  const destinoOriginalRef = useRef(null);

  // ── Motor de rutas offline (A* sobre grafoCampus.json) ──────────────────
  useEffect(() => {
    // Limpiar ruta anterior si falta origen o destino
    if (!origen || !destino) {
      setCoordenadasRuta([]);
      if (onRutaCalculada) onRutaCalculada(null);
      return;
    }

    // GeoJSON almacena [lng, lat]; Leaflet/Haversine necesita (lat, lng)
    const origenLat  = origen.ubicacion.coordinates[1];
    const origenLng  = origen.ubicacion.coordinates[0];
    const destinoLat = destino.ubicacion.coordinates[1];
    const destinoLng = destino.ubicacion.coordinates[0];

    console.log('🚶 [Motor offline] Calculando ruta A*...');
    console.log(`   📍 Origen:  ${origen.nombre}  [${origenLat}, ${origenLng}]`);
    console.log(`   🎯 Destino: ${destino.nombre} [${destinoLat}, ${destinoLng}]`);

    const resultado = calcularRuta(
      origenLat, origenLng,
      destinoLat, destinoLng,
      grafoCampus
    );

    if (!resultado) {
      console.warn('⚠️ Motor offline: no existe ruta entre los nodos seleccionados.');
      setCoordenadasRuta([]);
      if (onRutaCalculada) onRutaCalculada(null);
      return;
    }

    const distanciaKm = (resultado.summary.totalDistance / 1000).toFixed(2);
    const tiempoMin   = Math.max(1, Math.round(resultado.summary.totalTime / 60));

    console.log(`✅ Ruta calculada: ${distanciaKm} km | ${tiempoMin} min | ${resultado.coordenadas.length} puntos`);

    setCoordenadasRuta(resultado.coordenadas);

    if (onRutaCalculada) {
      onRutaCalculada({
        distancia: distanciaKm,
        tiempo:    tiempoMin,
        coordenadas: resultado.coordenadas,
      });
    }
  }, [origen, destino]); // Se recalcula solo cuando cambian origen o destino

  // Guardar destino original al iniciar viaje
  useEffect(() => {
    if (destino && modoViaje && !destinoOriginalRef.current) {
      destinoOriginalRef.current = destino;
      console.log('🎯 Destino original guardado:', destino.nombre);
    }
    if (!modoViaje) {
      destinoOriginalRef.current = null;
    }
  }, [destino, modoViaje]);

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setCargando(true);
      const response = await fetch('http://localhost:5000/api/ubicaciones/publicas?visible=true');
      
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
          <MapAutoCenter 
            ubicacionUsuario={ubicacionUsuario} 
            modoViaje={modoViaje}
            coordenadasRuta={coordenadasRuta}
            onRecalcularRuta={onRecalcularRuta}
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

          {/* Marcador de Ubicación del Usuario */}
          {ubicacionUsuario && (
            <Marker
              position={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
              icon={L.divIcon({
                className: 'custom-marker-usuario',
                html: `<div style="background-color: #2196F3; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(33, 150, 243, 0.8), 0 0 20px rgba(33, 150, 243, 0.4);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
              })}
            >
              <Popup>
                <div className="marker-popup usuario">
                  <div className="popup-header" style={{ background: '#2196F3' }}>
                    Tu ubicación
                  </div>
                  <div className="popup-body">
                    <p>📱 Estás aquí</p>
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
