import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import MapaWayfinding from '../../componentes/wayfinding/MapaWayfinding';
import useGeolocation from '../../hooks/useGeolocation';
import api from '../../servicios/api';
import './Wayfinding.css';

const Wayfinding = () => {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(null); // 'origen' o 'destino'
  const [infoRuta, setInfoRuta] = useState(null);
  const [modoViaje, setModoViaje] = useState(false); // Nuevo: modo navegación activa

  // Custom Hook para geolocalización reactiva
  const { ubicacion: ubicacionUsuario, error: errorGeo, cargando: cargandoGeo, permisosConcedidos } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  });

  useEffect(() => {
    cargarUbicaciones();
  }, []);

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
    if (ubicacionUsuario) {
      setOrigen({
        _id: 'mi-ubicacion',
        nombre: 'Mi Ubicación',
        ubicacion: {
          coordinates: [ubicacionUsuario.lng, ubicacionUsuario.lat]
        }
      });
    } else if (errorGeo) {
      alert(`No se pudo obtener tu ubicación: ${errorGeo}`);
    } else if (cargandoGeo) {
      alert('Esperando permisos de geolocalización...');
    }
  };

  const handleRutaCalculada = (ruta) => {
    setInfoRuta(ruta);
  };

  const iniciarViaje = () => {
    if (!ubicacionUsuario) {
      alert('No se puede iniciar el viaje sin tu ubicación');
      return;
    }
    if (!destino) {
      alert('Selecciona un destino primero');
      return;
    }
    // Establecer origen como ubicación actual
    setOrigen({
      _id: 'mi-ubicacion',
      nombre: 'Mi Ubicación',
      ubicacion: {
        coordinates: [ubicacionUsuario.lng, ubicacionUsuario.lat]
      }
    });
    setModoViaje(true);
  };

  const detenerViaje = () => {
    setModoViaje(false);
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
          <p className="subtitle">Encuentra tu camino en el Campus</p>
        </div>

        <div className="wayfinding-content">
          <div className="wayfinding-map">
            <MapaWayfinding 
              origen={origen}
              destino={destino}
              ubicacionUsuario={ubicacionUsuario}
              onRutaCalculada={handleRutaCalculada}
              modoViaje={modoViaje}
            />
          </div>

          <div className="wayfinding-sidebar">
            {/* Selector de Ruta */}
            <div className="ruta-section">
              <h3>🗺️ Calcular Ruta</h3>
              
              <div className="ruta-selector">
                <div className="punto-ruta">
                  <label>📍 Origen:</label>
                  {origen ? (
                    <div className="ubicacion-seleccionada">
                      <span>{origen.nombre}</span>
                      <button onClick={() => setOrigen(null)} className="btn-limpiar">✕</button>
                    </div>
                  ) : (
                    <div className="btn-group">
                      <button 
                        onClick={() => setModoSeleccion('origen')}
                        className={`btn-seleccionar ${modoSeleccion === 'origen' ? 'activo' : ''}`}
                      >
                        Seleccionar origen
                      </button>
                      {ubicacionUsuario && (
                        <button onClick={usarMiUbicacion} className="btn-mi-ubicacion">
                          📱 Mi ubicación
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="punto-ruta">
                  <label>🎯 Destino:</label>
                  {destino ? (
                    <div className="ubicacion-seleccionada">
                      <span>{destino.nombre}</span>
                      <button onClick={() => setDestino(null)} className="btn-limpiar">✕</button>
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
                          🧭 Iniciar Viaje
                        </button>
                        <button onClick={limpiarRuta} className="btn-limpiar-ruta">
                          Limpiar
                        </button>
                      </>
                    ) : (
                      <button onClick={detenerViaje} className="btn-detener-viaje">
                        ⏹️ Detener Navegación
                      </button>
                    )}
                  </div>
                )}

                {/* Información de la Ruta Calculada */}
                {infoRuta && (
                  <div className="info-ruta-calculada">
                    <h4>📊 Información de la Ruta</h4>
                    <div className="ruta-detalles">
                      <div className="detalle-item">
                        <span className="icono">📏</span>
                        <div>
                          <strong>Distancia:</strong>
                          <p>{infoRuta.distancia} km</p>
                        </div>
                      </div>
                      <div className="detalle-item">
                        <span className="icono">⏱️</span>
                        <div>
                          <strong>Tiempo estimado:</strong>
                          <p>{infoRuta.tiempo} minutos caminando</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buscador */}
            {modoSeleccion && (
              <div className="search-section">
                <h3>Buscar Ubicación</h3>
                <input 
                  type="text" 
                  placeholder="Edificio, sala, oficina..."
                  className="search-input"
                  value={busqueda}
                  onChange={(e) => buscarUbicaciones(e.target.value)}
                  autoFocus
                />
                
                {resultadosBusqueda.length > 0 && (
                  <div className="resultados-busqueda">
                    {resultadosBusqueda.map(ub => (
                      <div 
                        key={ub._id}
                        className="resultado-item"
                        onClick={() => seleccionarUbicacion(ub)}
                      >
                        <span className="resultado-nombre">{ub.nombre}</span>
                        <span className="resultado-tipo">{ub.tipo}</span>
                      </div>
                    ))}
                  </div>
                )}

                {busqueda.length > 2 && resultadosBusqueda.length === 0 && (
                  <p className="sin-resultados">No se encontraron ubicaciones</p>
                )}
              </div>
            )}

            {/* Acceso Rápido */}
            {!modoSeleccion && (
              <div className="quick-access">
                <h3>Acceso Rápido</h3>
                <div className="quick-buttons">
                  {ubicaciones.filter(ub => ub.tipo === 'servicio').slice(0, 6).map(ub => (
                    <button 
                      key={ub._id}
                      className="quick-btn"
                      onClick={() => setDestino(ub)}
                    >
                      <span className="icon">📍</span>
                      <span className="text">{ub.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Información */}
            <div className="info-section">
              <h3>Información</h3>
              <div className="info-card">
                <p>
                  <strong>📍 Navegación en tiempo real</strong><br />
                  Encuentra la ruta más rápida a tu destino
                </p>
              </div>
              {ubicacionUsuario && (
                <div className="info-card success">
                  <p>
                    <strong>✓ Geolocalización activa</strong><br />
                    Tu ubicación está siendo rastreada en tiempo real
                  </p>
                </div>
              )}
              {errorGeo && (
                <div className="info-card error">
                  <p>
                    <strong>⚠ Error de geolocalización</strong><br />
                    {errorGeo}
                  </p>
                </div>
              )}
              {cargandoGeo && !ubicacionUsuario && (
                <div className="info-card">
                  <p>
                    <strong>⏳ Obteniendo ubicación...</strong><br />
                    Esperando permisos del dispositivo
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
