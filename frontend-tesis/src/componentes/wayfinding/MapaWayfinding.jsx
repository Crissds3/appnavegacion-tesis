import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
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

const MapBounds = () => {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds(CAMPUS_BOUNDS);
    map.fitBounds(CAMPUS_BOUNDS);
  }, [map]);
  
  return null;
};

// Componente para manejar el cálculo de rutas
const RoutingMachine = ({ origen, destino, onRutaCalculada }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Limpiar ruta anterior si existe
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Si hay origen y destino, crear la ruta
    if (origen && destino) {
      // GeoJSON: [lng, lat] -> Leaflet: [lat, lng]
      const origenLat = origen.ubicacion.coordinates[1];
      const origenLng = origen.ubicacion.coordinates[0];
      const destinoLat = destino.ubicacion.coordinates[1];
      const destinoLng = destino.ubicacion.coordinates[0];

      console.log('🚶 Calculando ruta:');
      console.log(`   📍 Origen: [${origenLat}, ${origenLng}]`);
      console.log(`   🎯 Destino: [${destinoLat}, ${destinoLng}]`);

      // Configurar Leaflet Routing Machine con perfil de caminata
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(origenLat, origenLng),
          L.latLng(destinoLat, destinoLng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot', // Perfil de caminata/peatonal
          language: 'es',
          timeout: 30 * 1000
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        show: false, // Ocultar panel de instrucciones pero mostrar línea
        lineOptions: {
          styles: [
            { color: '#2196F3', opacity: 0.8, weight: 6 }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        createMarker: function() { return null; }, // No crear marcadores predeterminados
        plan: L.Routing.plan(
          [
            L.latLng(origenLat, origenLng),
            L.latLng(destinoLat, destinoLng)
          ],
          {
            createMarker: function() { return null; },
            draggableWaypoints: false,
            addWaypoints: false
          }
        )
      }).addTo(map);

      // Ocultar el contenedor de instrucciones después de agregar
      setTimeout(() => {
        const container = document.querySelector('.leaflet-routing-container');
        if (container) {
          container.style.display = 'none';
        }
      }, 100);

      // Evento cuando la ruta se calcula
      routingControlRef.current.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        console.log('✅ Ruta calculada:');
        console.log(`   📏 Distancia: ${(summary.totalDistance / 1000).toFixed(2)} km`);
        console.log(`   ⏱️ Tiempo: ${Math.round(summary.totalTime / 60)} min`);
        console.log(`   📋 Instrucciones: ${routes[0].instructions?.length || 0} pasos`);
        
        if (onRutaCalculada) {
          onRutaCalculada({
            distancia: (summary.totalDistance / 1000).toFixed(2), // en km
            tiempo: Math.round(summary.totalTime / 60), // en minutos
            instrucciones: routes[0].instructions
          });
        }
      });

      // Manejo de errores
      routingControlRef.current.on('routingerror', function(e) {
        console.error('❌ Error al calcular la ruta:', e);
        if (onRutaCalculada) {
          onRutaCalculada(null);
        }
      });
    }

    // Cleanup al desmontar
    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, origen, destino, onRutaCalculada]);

  return null;
};

const MapaWayfinding = ({ origen, destino, ubicacionUsuario, onRutaCalculada, modoViaje = false }) => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const mapRef = useRef(null);

  // Componente para centrar el mapa en la ubicación del usuario en modo viaje
  const MapCenter = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
      if (center && modoViaje) {
        map.setView(center, zoom, {
          animate: true,
          duration: 1
        });
      }
    }, [center, zoom, map]);
    
    return null;
  };

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
        html: `<div style="background-color: #4CAF50; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });
    }

    if (esDestino) {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #E53935; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">🎯</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
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
          ref={mapRef}
        >
          <MapBounds />
          
          {/* Centrar en usuario si está en modo viaje */}
          {modoViaje && ubicacionUsuario && (
            <MapCenter 
              center={[ubicacionUsuario.lat, ubicacionUsuario.lng]} 
              zoom={18} 
            />
          )}
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
            maxNativeZoom={19}
          />

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
                    <h4>{ubicacion.nombre}</h4>
                    <p className="popup-tipo">
                      <strong>Tipo:</strong> {ubicacion.tipo}
                    </p>
                    {ubicacion.descripcion && (
                      <p className="popup-descripcion">{ubicacion.descripcion}</p>
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
                  <h4>📍 Origen</h4>
                  <p>{origen.nombre}</p>
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
                  <h4>🎯 Destino</h4>
                  <p>{destino.nombre}</p>
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
                  <h4>Tu ubicación</h4>
                  <p>📱 Ubicación actual</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Motor de Rutas en el Cliente con Leaflet Routing Machine */}
          <RoutingMachine 
            origen={origen}
            destino={destino}
            onRutaCalculada={onRutaCalculada}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaWayfinding;
