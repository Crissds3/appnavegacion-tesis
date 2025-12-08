import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Caminos y vías principales del campus para routing interno
// Estos puntos forman una red de caminos transitables basada en la topología real
const CAMINOS_CAMPUS = [
  // Entrada principal y zona norte
  { id: 'entrada', lat: -35.001000, lng: -71.230900, conexiones: ['edificio_minas', 'cam_norte'] },
  { id: 'edificio_minas', lat: -35.001369, lng: -71.230949, conexiones: ['entrada', 'cam_central_norte'] },
  
  // Camino central norte-sur (calle principal)
  { id: 'cam_norte', lat: -35.001200, lng: -71.231100, conexiones: ['entrada', 'cam_central_norte'] },
  { id: 'cam_central_norte', lat: -35.001800, lng: -71.230900, conexiones: ['edificio_minas', 'cam_norte', 'servicios_multiples', 'cam_central'] },
  { id: 'cam_central', lat: -35.002200, lng: -71.230700, conexiones: ['cam_central_norte', 'cam_sur', 'estacionamiento'] },
  { id: 'cam_sur', lat: -35.002600, lng: -71.230500, conexiones: ['cam_central', 'multicancha'] },
  
  // Servicios múltiples (zona central)
  { id: 'servicios_multiples', lat: -35.002195, lng: -71.230251, conexiones: ['cam_central_norte', 'estacionamiento'] },
  
  // Zona estacionamiento
  { id: 'estacionamiento', lat: -35.002400, lng: -71.230400, conexiones: ['cam_central', 'servicios_multiples', 'cam_sur'] },
  
  // Zona deportiva sur
  { id: 'multicancha', lat: -35.003000, lng: -71.230300, conexiones: ['cam_sur'] },
];

// Función para calcular distancia euclidiana entre dos puntos
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
}

// Función para encontrar el camino más cercano a un punto
function encontrarCaminoCercano(lat, lng) {
  let minDist = Infinity;
  let caminoCercano = CAMINOS_CAMPUS[0];
  
  CAMINOS_CAMPUS.forEach(camino => {
    const dist = calcularDistancia(lat, lng, camino.lat, camino.lng);
    if (dist < minDist) {
      minDist = dist;
      caminoCercano = camino;
    }
  });
  
  console.log(`   🔍 Camino cercano encontrado: ${caminoCercano.id} (${minDist.toFixed(0)}m de distancia)`);
  return caminoCercano;
}

// Algoritmo A* para encontrar la ruta más corta entre caminos
function encontrarRutaEntreCaminos(caminoInicio, caminoFin) {
  const visitados = new Set();
  const cola = [[caminoInicio]];
  const costos = new Map();
  costos.set(caminoInicio.id, 0);
  
  while (cola.length > 0) {
    // Ordenar por costo + heurística (distancia al objetivo)
    cola.sort((a, b) => {
      const ultimoA = a[a.length - 1];
      const ultimoB = b[b.length - 1];
      const costoA = costos.get(ultimoA.id) + calcularDistancia(ultimoA.lat, ultimoA.lng, caminoFin.lat, caminoFin.lng);
      const costoB = costos.get(ultimoB.id) + calcularDistancia(ultimoB.lat, ultimoB.lng, caminoFin.lat, caminoFin.lng);
      return costoA - costoB;
    });
    
    const ruta = cola.shift();
    const actual = ruta[ruta.length - 1];
    
    if (actual.id === caminoFin.id) {
      console.log(`   🛣️ Ruta encontrada: ${ruta.map(c => c.id).join(' → ')}`);
      return ruta;
    }
    
    if (visitados.has(actual.id)) {
      continue;
    }
    
    visitados.add(actual.id);
    
    actual.conexiones.forEach(conexionId => {
      const siguiente = CAMINOS_CAMPUS.find(c => c.id === conexionId);
      if (siguiente && !visitados.has(siguiente.id)) {
        const nuevoCosto = costos.get(actual.id) + calcularDistancia(actual.lat, actual.lng, siguiente.lat, siguiente.lng);
        
        if (!costos.has(siguiente.id) || nuevoCosto < costos.get(siguiente.id)) {
          costos.set(siguiente.id, nuevoCosto);
          cola.push([...ruta, siguiente]);
        }
      }
    });
  }
  
  console.log('   ⚠️ No se encontró ruta, usando línea directa');
  return [caminoInicio, caminoFin]; // Fallback: línea directa
}

// Función para generar ruta con geometría detallada siguiendo caminos
function generarRutaCampus(origenLat, origenLng, destinoLat, destinoLng) {
  console.log(`   🎯 Generando ruta desde [${origenLat.toFixed(6)}, ${origenLng.toFixed(6)}]`);
  console.log(`      hasta [${destinoLat.toFixed(6)}, ${destinoLng.toFixed(6)}]`);
  
  // Encontrar caminos más cercanos al origen y destino
  const caminoOrigen = encontrarCaminoCercano(origenLat, origenLng);
  const caminoDestino = encontrarCaminoCercano(destinoLat, destinoLng);
  
  // Si origen y destino están en el mismo camino o muy cerca
  if (caminoOrigen.id === caminoDestino.id) {
    console.log('   ℹ️ Origen y destino en el mismo nodo, ruta directa');
    return [
      [origenLat, origenLng],
      [destinoLat, destinoLng]
    ];
  }
  
  // Encontrar ruta entre los caminos usando A*
  const rutaCaminos = encontrarRutaEntreCaminos(caminoOrigen, caminoDestino);
  
  // Construir array de coordenadas
  const coordenadas = [
    [origenLat, origenLng], // Punto de inicio real
    ...rutaCaminos.map(camino => [camino.lat, camino.lng]), // Caminos intermedios
    [destinoLat, destinoLng] // Punto de destino real
  ];
  
  return coordenadas;
}

const MapBounds = () => {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds(CAMPUS_BOUNDS);
    map.fitBounds(CAMPUS_BOUNDS);
  }, [map]);
  
  return null;
};

// Componente para manejar el cálculo de rutas con Leaflet Routing Machine
// y extraer las coordenadas para dibujarlas manualmente
const RoutingMachine = ({ origen, destino, onRutaCalculada, setCoordenadasRuta }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const prevOrigenRef = useRef(null);
  const prevDestinoRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Verificar si origen o destino han cambiado realmente
    const origenCambiado = JSON.stringify(origen) !== JSON.stringify(prevOrigenRef.current);
    const destinoCambiado = JSON.stringify(destino) !== JSON.stringify(prevDestinoRef.current);

    if (!origenCambiado && !destinoCambiado) {
      return; // No hacer nada si no hay cambios
    }

    // Actualizar referencias
    prevOrigenRef.current = origen;
    prevDestinoRef.current = destino;

    // Limpiar control anterior si existe
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        // Ignorar errores
      }
      routingControlRef.current = null;
    }

    // Limpiar coordenadas de ruta
    if (setCoordenadasRuta) {
      setCoordenadasRuta([]);
    }

    // Solo crear ruta si hay origen Y destino
    if (!origen || !destino) {
      if (onRutaCalculada) {
        onRutaCalculada(null);
      }
      return;
    }

    // Obtener coordenadas
    const origenLat = origen.ubicacion.coordinates[1];
    const origenLng = origen.ubicacion.coordinates[0];
    const destinoLat = destino.ubicacion.coordinates[1];
    const destinoLng = destino.ubicacion.coordinates[0];

    console.log('🚶 Calculando ruta con Leaflet Routing Machine');
    console.log(`   📍 Origen: ${origen.nombre} [${origenLat}, ${origenLng}]`);
    console.log(`   🎯 Destino: ${destino.nombre} [${destinoLat}, ${destinoLng}]`);

    // Crear el control de routing (SOLO para cálculo, sin dibujar líneas)
    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(origenLat, origenLng),
          L.latLng(destinoLat, destinoLng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot',
          language: 'es',
          // CRÍTICO: Solicitar geometría completa para que la ruta siga las calles
          useHints: false,
          suppressDemoServerWarning: true
        }),
        lineOptions: {
          styles: [{ opacity: 0 }] // Línea invisible - usaremos Polyline
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false, // No ajustar automáticamente
        showAlternatives: false,
        createMarker: function() { return null; }
      });

      // NO agregar al mapa aún - esperar a que calcule la ruta
      
      console.log('🔧 Control de routing creado (sin agregar al mapa)');

      // Evento: ruta calculada exitosamente
      routingControlRef.current.on('routesfound', function(e) {
        const routes = e.routes;
        const route = routes[0];
        const summary = route.summary;
        
        const distanciaKm = (summary.totalDistance / 1000).toFixed(2);
        const tiempoMin = Math.max(1, Math.round(summary.totalTime / 60));
        
        console.log('✅ Ruta encontrada por Leaflet Routing Machine:');
        console.log(`   📏 ${distanciaKm} km (${summary.totalDistance.toFixed(0)}m)`);
        console.log(`   ⏱️ ${tiempoMin} min`);
        
        // IMPORTANTE: Obtener la geometría completa de la ruta
        // route.coordinates contiene TODOS los puntos de la ruta real
        let coordsArray = [];
        
        if (route.coordinates && route.coordinates.length > 0) {
          // Usar coordenadas detalladas de la ruta
          coordsArray = route.coordinates.map(coord => [coord.lat, coord.lng]);
          console.log(`   🗺️ Coordenadas de ruta detallada: ${coordsArray.length} puntos`);
        } else if (route.waypointIndices && route.inputWaypoints) {
          // Fallback: usar waypoints si no hay coordinates
          coordsArray = route.inputWaypoints.map(wp => [wp.latLng.lat, wp.latLng.lng]);
          console.log(`   ⚠️ Usando waypoints (${coordsArray.length} puntos) - geometría simplificada`);
        } else {
          console.warn('⚠️ No se encontró geometría de ruta');
          coordsArray = [
            [origenLat, origenLng],
            [destinoLat, destinoLng]
          ];
        }
        
        // Pasar coordenadas al estado para que Polyline las dibuje
        if (setCoordenadasRuta) {
          setCoordenadasRuta(coordsArray);
        }
        
        if (onRutaCalculada) {
          onRutaCalculada({
            distancia: distanciaKm,
            tiempo: tiempoMin,
            instrucciones: route.instructions,
            coordenadas: coordsArray
          });
        }
      });

      // Evento: error al calcular ruta
      routingControlRef.current.on('routingerror', function(e) {
        console.error('❌ Error de OSRM (esperado para campus privado):', e.error);
        console.log('🔄 Usando algoritmo de routing interno del campus...');
        
        // Usar algoritmo interno del campus que sigue caminos conocidos
        const rutaCampus = generarRutaCampus(origenLat, origenLng, destinoLat, destinoLng);
        
        console.log(`✅ Ruta generada con algoritmo interno: ${rutaCampus.length} puntos`);
        
        if (setCoordenadasRuta) {
          setCoordenadasRuta(rutaCampus);
        }
        
        // Calcular distancia aproximada
        let distanciaTotal = 0;
        for (let i = 0; i < rutaCampus.length - 1; i++) {
          const dist = map.distance(rutaCampus[i], rutaCampus[i + 1]);
          distanciaTotal += dist;
        }
        
        if (onRutaCalculada) {
          onRutaCalculada({
            distancia: (distanciaTotal / 1000).toFixed(2),
            tiempo: Math.max(1, Math.round(distanciaTotal / 80)), // ~80m/min caminando
            coordenadas: rutaCampus,
            usaAlgoritmoInterno: true
          });
        }
      });

      // Iniciar el cálculo de la ruta sin agregar al mapa
      routingControlRef.current.route();

    } catch (error) {
      console.error('❌ Error al crear routing control:', error);
    }

    // Cleanup
    return () => {
      if (routingControlRef.current) {
        try {
          // Simplemente limpiar la referencia sin intentar remover del mapa
          routingControlRef.current = null;
        } catch (e) {
          // Ignorar errores
        }
      }
    };
  }, [map, origen, destino, onRutaCalculada, setCoordenadasRuta]);

  return null;
};

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
  const [coordenadasRuta, setCoordenadasRuta] = useState([]); // Estado para las coordenadas de la ruta
  const destinoOriginalRef = useRef(null);

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

          {/* Sistema de Rutas con Leaflet Routing Machine */}
          <RoutingMachine 
            origen={origen}
            destino={destino}
            onRutaCalculada={onRutaCalculada}
            setCoordenadasRuta={setCoordenadasRuta}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaWayfinding;
