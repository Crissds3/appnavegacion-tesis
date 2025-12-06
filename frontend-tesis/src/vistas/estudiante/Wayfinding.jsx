import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  Smartphone, 
  Compass, 
  Square, 
  Route, 
  Ruler, 
  Clock, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Loader, 
  RefreshCw, 
  X, 
  Target,
  Building,
  Coffee,
  Car
} from 'lucide-react';
import Navbar from '../../componentes/compartidos/Navbar';
import MapaWayfinding from '../../componentes/wayfinding/MapaWayfinding';
import useGeolocation from '../../hooks/useGeolocation';
import api from '../../servicios/api';
import './Wayfinding.css';

const Wayfinding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(null); // 'origen' o 'destino'
  const [infoRuta, setInfoRuta] = useState(null);
  const [modoViaje, setModoViaje] = useState(false); // Nuevo: modo navegación activa
  const [usarUbicacionSimulada, setUsarUbicacionSimulada] = useState(false);
  const [notificacionRecalculo, setNotificacionRecalculo] = useState(false);

  // Custom Hook para geolocalización reactiva
  const { ubicacion: ubicacionUsuario, error: errorGeo, cargando: cargandoGeo, permisosConcedidos } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  });

  // Ubicación simulada dentro del campus (entrada principal)
  const ubicacionSimulada = {
    lat: -35.002607,
    lng: -71.230519,
    accuracy: 10
  };

  // Usar ubicación simulada si está activada, sino la real
  const ubicacionActual = usarUbicacionSimulada ? ubicacionSimulada : ubicacionUsuario;

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  // Efecto para manejar navegación desde otras vistas (ej: Carreras)
  useEffect(() => {
    if (ubicaciones.length > 0 && location.state?.destinoId) {
      const destinoEncontrado = ubicaciones.find(u => u._id === location.state.destinoId);
      if (destinoEncontrado) {
        setDestino(destinoEncontrado);
        // Limpiar el estado para evitar re-selección si se navega internamente
        window.history.replaceState({}, document.title);
      }
    }
  }, [ubicaciones, location.state]);

  const cargarUbicaciones = async () => {
    try {
      const response = await api.get('/ubicaciones/publicas?visible=true');
      setUbicaciones(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
    }
  };

  const buscarUbicaciones = (texto) => {
    setBusqueda(texto);
    if (texto.trim().length > 2) {
      const resultados = ubicaciones.filter(ub =>
        ub.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        ub.descripcion?.toLowerCase().includes(texto.toLowerCase())
      );
      setResultadosBusqueda(resultados);
    } else {
      setResultadosBusqueda([]);
    }
  };

  const seleccionarUbicacion = (ubicacion) => {
    if (modoSeleccion === 'origen') {
      setOrigen(ubicacion);
      setModoSeleccion(null);
    } else if (modoSeleccion === 'destino') {
      setDestino(ubicacion);
      setModoSeleccion(null);
    }
    setBusqueda('');
    setResultadosBusqueda([]);
  };

  const limpiarRuta = () => {
    setOrigen(null);
    setDestino(null);
    setModoSeleccion(null);
    setInfoRuta(null);
    setModoViaje(false); // Detener modo viaje
  };

  const usarMiUbicacion = () => {
    const ubicacion = ubicacionActual;
    if (ubicacion) {
      setOrigen({
        _id: 'mi-ubicacion',
        nombre: usarUbicacionSimulada ? 'Mi Ubicación (Simulada - Campus)' : 'Mi Ubicación',
        ubicacion: {
          coordinates: [ubicacion.lng, ubicacion.lat]
        }
      });
    } else if (errorGeo) {
      alert(`No se pudo obtener tu ubicación: ${errorGeo}`);
    } else if (cargandoGeo) {
      alert('Esperando permisos de geolocalización...');
    }
  };

  const toggleUbicacionSimulada = () => {
    setUsarUbicacionSimulada(!usarUbicacionSimulada);
    // Si ya hay un origen seleccionado, actualizarlo
    if (origen && origen._id === 'mi-ubicacion') {
      const ubicacion = !usarUbicacionSimulada ? ubicacionSimulada : ubicacionUsuario;
      if (ubicacion) {
        setOrigen({
          _id: 'mi-ubicacion',
          nombre: !usarUbicacionSimulada ? 'Mi Ubicación (Simulada - Campus)' : 'Mi Ubicación',
          ubicacion: {
            coordinates: [ubicacion.lng, ubicacion.lat]
          }
        });
      }
    }
  };

  const handleRutaCalculada = (ruta) => {
    setInfoRuta(ruta);
  };

  const recalcularRuta = (nuevaUbicacion) => {
    if (!destino) return;
    
    console.log('🔄 Recalculando ruta desde posición actual...');
    
    // Mostrar notificación
    setNotificacionRecalculo(true);
    setTimeout(() => setNotificacionRecalculo(false), 3000);
    
    // Actualizar origen a la posición actual del usuario
    setOrigen({
      _id: 'ubicacion-actual-recalculada',
      nombre: 'Tu ubicación actual',
      ubicacion: {
        coordinates: [nuevaUbicacion.lng, nuevaUbicacion.lat]
      }
    });
  };

  const iniciarViaje = () => {
    if (!ubicacionActual) {
      alert('No se puede iniciar el viaje sin tu ubicación');
      return;
    }
    if (!destino) {
      alert('Selecciona un destino primero');
      return;
    }
    
    // Verificar que origen ya está establecido
    if (!origen) {
      alert('Por favor, selecciona un punto de origen primero');
      return;
    }
    
    console.log('🚀 Iniciando viaje...');
    console.log('Origen:', origen);
    console.log('Destino:', destino);
    console.log('Ubicación actual:', ubicacionActual);
    
    setModoViaje(true);
  };

  const detenerViaje = () => {
    setModoViaje(false);
  };

  const getIconoPorTipo = (tipo) => {
    switch(tipo?.toLowerCase()) {
      case 'edificio': return <Building size={18} />;
      case 'servicio': return <Coffee size={18} />;
      case 'estacionamiento': return <Car size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  return (
    <div className="wayfinding-container">
      <Navbar brandName="Módulo de navegación">
        <div className="navbar-buttons">
          <button onClick={() => navigate('/estudiante')} className="btn-noticias">
            Noticias
          </button>
          <button onClick={() => navigate('/')} className="btn-inicio">
            Inicio
          </button>
        </div>
      </Navbar>

      <main className="wayfinding-main">
        <div className="wayfinding-header">
          <h1>Sistema de Navegación Wayfinding</h1>
          <p className="subtitle">Encuentra tu camino en el Campus Curicó - Universidad de Talca</p>
        </div>

        <div className="wayfinding-content">
          <div className="wayfinding-map">
            <MapaWayfinding 
              origen={origen}
              destino={destino}
              ubicacionUsuario={ubicacionActual}
              onRutaCalculada={handleRutaCalculada}
              modoViaje={modoViaje}
              onRecalcularRuta={recalcularRuta}
            />
          </div>

          <div className="wayfinding-sidebar">
            {/* Selector de Ruta */}
            <div className="ruta-section">
              <h3>Planificar Ruta</h3>
              
              <div className="ruta-selector">
                <div className="punto-ruta">
                  <label><MapPin size={18} /> Origen:</label>
                  {origen ? (
                    <div className="ubicacion-seleccionada">
                      <span>{origen.nombre}</span>
                      <button onClick={() => setOrigen(null)} className="btn-limpiar"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="btn-group">
                      <button 
                        onClick={() => setModoSeleccion('origen')}
                        className={`btn-seleccionar ${modoSeleccion === 'origen' ? 'activo' : ''}`}
                      >
                        Seleccionar origen
                      </button>
                      <button onClick={usarMiUbicacion} className="btn-mi-ubicacion">
                        <Smartphone size={16} /> {usarUbicacionSimulada ? 'Ubicación Simulada' : 'Mi ubicación'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="punto-ruta">
                  <label><Navigation size={18} /> Destino:</label>
                  {destino ? (
                    <div className="ubicacion-seleccionada">
                      <span>{destino.nombre}</span>
                      <button onClick={() => setDestino(null)} className="btn-limpiar"><X size={16} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setModoSeleccion('destino')}
                      className={`btn-seleccionar ${modoSeleccion === 'destino' ? 'activo' : ''}`}
                    >
                      Seleccionar destino
                    </button>
                  )}
                </div>

                {(origen && destino) && (
                  <div className="ruta-acciones">
                    {!modoViaje ? (
                      <>
                        <button onClick={iniciarViaje} className="btn-iniciar-viaje">
                          <Compass size={20} /> Navegar
                        </button>
                        <button onClick={limpiarRuta} className="btn-limpiar-ruta">
                          Limpiar
                        </button>
                      </>
                    ) : (
                      <button onClick={detenerViaje} className="btn-detener-viaje">
                        <Square size={20} fill="currentColor" /> Detener Navegación
                      </button>
                    )}
                  </div>
                )}

                {/* Información de la Ruta Calculada */}
                {infoRuta && (
                  <div className="info-ruta-calculada">
                    <h4><Route size={18} /> Detalles del Recorrido</h4>
                    <div className="info-ruta-detalle">
                      <div className="info-item">
                        <div className="info-item-label"><Ruler size={14} /> Distancia</div>
                        <div className="info-item-value">{infoRuta.distancia} <span style={{fontSize: '18px'}}>km</span></div>
                      </div>
                      <div className="info-item">
                        <div className="info-item-label"><Clock size={14} /> Tiempo</div>
                        <div className="info-item-value">{infoRuta.tiempo} <span style={{fontSize: '18px'}}>min</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buscador */}
            {modoSeleccion && (
              <div className="search-section-modern">
                <div className="search-header-modern">
                  <h3>{modoSeleccion === 'origen' ? '¿Desde dónde partes?' : '¿A dónde quieres ir?'}</h3>
                  <button onClick={() => setModoSeleccion(null)} className="btn-close-search">
                    <X size={20} />
                  </button>
                </div>

                <div className="busqueda-container-modern">
                  <div className="input-wrapper-modern">
                    <Search className="search-icon-modern" size={20} />
                    <input 
                      type="text" 
                      placeholder={modoSeleccion === 'origen' ? "Buscar punto de partida..." : "Buscar destino..."}
                      value={busqueda}
                      onChange={(e) => buscarUbicaciones(e.target.value)}
                      autoFocus
                      className="search-input-modern"
                    />
                    {busqueda && (
                      <button onClick={() => {setBusqueda(''); setResultadosBusqueda([]);}} className="btn-clear-search">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="resultados-scroll-area">
                  {resultadosBusqueda.length > 0 ? (
                    <div className="resultados-busqueda-modern">
                      {resultadosBusqueda.map(ub => (
                        <div 
                          key={ub._id}
                          className="resultado-item-modern"
                          onClick={() => seleccionarUbicacion(ub)}
                        >
                          <div className={`resultado-icon-wrapper type-${ub.tipo?.toLowerCase() || 'default'}`}>
                            {getIconoPorTipo(ub.tipo)}
                          </div>
                          <div className="resultado-info">
                            <span className="resultado-nombre">{ub.nombre}</span>
                            <span className="resultado-tipo">{ub.tipo}</span>
                          </div>
                          <div className="resultado-arrow">
                            <Navigation size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : busqueda.length > 0 ? (
                    <div className="sin-resultados-modern">
                      <Search size={48} strokeWidth={1.5} />
                      <p>No encontramos "{busqueda}"</p>
                      <span>Intenta buscar por nombre de edificio o servicio</span>
                    </div>
                  ) : (
                    <div className="sugerencias-busqueda">
                      <p className="sugerencias-titulo">Lugares sugeridos</p>
                      {ubicaciones.slice(0, 4).map(ub => (
                        <div 
                          key={ub._id}
                          className="resultado-item-modern sugerencia"
                          onClick={() => seleccionarUbicacion(ub)}
                        >
                          <div className={`resultado-icon-wrapper type-${ub.tipo?.toLowerCase() || 'default'}`}>
                            {getIconoPorTipo(ub.tipo)}
                          </div>
                          <div className="resultado-info">
                            <span className="resultado-nombre">{ub.nombre}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información */}
            <div className="info-section">
              <h3>Información</h3>
              
              {/* Toggle para ubicación simulada */}
              <div className="info-card simulation">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={usarUbicacionSimulada}
                    onChange={toggleUbicacionSimulada}
                    style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong><Target size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Simular ubicación en campus</strong><br />
                    <small>Útil para pruebas cuando no estás en el campus</small>
                  </div>
                </label>
              </div>

              {ubicacionActual && (
                <div className="info-card success">
                  <p>
                    <strong><CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> {usarUbicacionSimulada ? 'Ubicación simulada activa' : 'Geolocalización activa'}</strong><br />
                    {usarUbicacionSimulada 
                      ? 'Ubicación de prueba dentro del campus'
                      : 'Tu ubicación está siendo rastreada en tiempo real'}
                  </p>
                </div>
              )}
              {errorGeo && !usarUbicacionSimulada && (
                <div className="info-card error">
                  <p>
                    <strong><AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Error de geolocalización</strong><br />
                    {errorGeo}
                  </p>
                </div>
              )}
              {cargandoGeo && !ubicacionUsuario && !usarUbicacionSimulada && (
                <div className="info-card">
                  <p>
                    <strong><Loader size={16} className="spin" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Obteniendo ubicación...</strong><br />
                    Esperando permisos del dispositivo
                  </p>
                </div>
              )}
              
              {/* Notificación de recalculación de ruta */}
              {notificacionRecalculo && (
                <div className="info-card recalculo">
                  <p>
                    <strong><RefreshCw size={16} className="spin" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Recalculando ruta...</strong><br />
                    Te desviaste del camino
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wayfinding;
