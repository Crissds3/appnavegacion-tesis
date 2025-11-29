import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../servicios/api';
import './GestionUbicaciones.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMPUS_CENTER = [-35.002607, -71.230519];

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const GestionUbicaciones = () => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipo: 'edificio',
    descripcion: '',
    latitud: '',
    longitud: '',
    icono: 'marker',
    visible: true,
    metadatos: {
      piso: '',
      capacidad: '',
      horario: '',
      contacto: '',
      url: ''
    }
  });

  const [coordenadaSeleccionada, setCoordenadaseleccionada] = useState(null);

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setCargando(true);
      const response = await api.get('/ubicaciones');
      if (response.data.success) {
        setUbicaciones(response.data.data);
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar ubicaciones');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('metadatos.')) {
      const metadataKey = name.split('.')[1];
      setFormulario(prev => ({
        ...prev,
        metadatos: {
          ...prev.metadatos,
          [metadataKey]: value
        }
      }));
    } else {
      setFormulario(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleMapClick = (latlng) => {
    setCoordenadaseleccionada(latlng);
    setFormulario(prev => ({
      ...prev,
      latitud: latlng.lat.toFixed(6),
      longitud: latlng.lng.toFixed(6)
    }));
    mostrarMensaje('info', `Coordenadas seleccionadas: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.nombre || !formulario.latitud || !formulario.longitud) {
      mostrarMensaje('error', 'Nombre y coordenadas son obligatorios');
      return;
    }

    try {
      setCargando(true);
      
      const datos = {
        nombre: formulario.nombre,
        tipo: formulario.tipo,
        descripcion: formulario.descripcion,
        latitud: parseFloat(formulario.latitud),
        longitud: parseFloat(formulario.longitud),
        icono: formulario.icono,
        visible: formulario.visible,
        metadatos: formulario.metadatos
      };

      if (modoEdicion && ubicacionActual) {
        await api.put(`/ubicaciones/${ubicacionActual._id}`, datos);
        mostrarMensaje('success', 'Ubicación actualizada exitosamente');
      } else {
        await api.post('/ubicaciones', datos);
        mostrarMensaje('success', 'Ubicación creada exitosamente');
      }

      resetFormulario();
      cargarUbicaciones();
    } catch (error) {
      mostrarMensaje('error', error.response?.data?.message || 'Error al guardar ubicación');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const editarUbicacion = (ubicacion) => {
    const [lng, lat] = ubicacion.ubicacion.coordinates;
    
    setUbicacionActual(ubicacion);
    setModoEdicion(true);
    setFormulario({
      nombre: ubicacion.nombre,
      tipo: ubicacion.tipo,
      descripcion: ubicacion.descripcion || '',
      latitud: lat.toString(),
      longitud: lng.toString(),
      icono: ubicacion.icono || 'marker',
      visible: ubicacion.visible,
      metadatos: ubicacion.metadatos || {
        piso: '',
        capacidad: '',
        horario: '',
        contacto: '',
        url: ''
      }
    });
    setCoordenadaseleccionada({ lat, lng });
  };

  const eliminarUbicacion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ubicación?')) {
      return;
    }

    try {
      setCargando(true);
      await api.delete(`/ubicaciones/${id}`);
      mostrarMensaje('success', 'Ubicación eliminada exitosamente');
      cargarUbicaciones();
    } catch (error) {
      mostrarMensaje('error', 'Error al eliminar ubicación');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const resetFormulario = () => {
    setFormulario({
      nombre: '',
      tipo: 'edificio',
      descripcion: '',
      latitud: '',
      longitud: '',
      icono: 'marker',
      visible: true,
      metadatos: {
        piso: '',
        capacidad: '',
        horario: '',
        contacto: '',
        url: ''
      }
    });
    setCoordenadaseleccionada(null);
    setModoEdicion(false);
    setUbicacionActual(null);
  };

  return (
    <div className="gestion-ubicaciones">
      <div className="gestion-header">
        <h2>{modoEdicion ? 'Editar Ubicación' : 'Gestión de Ubicaciones'}</h2>
      </div>

      {mensaje.texto && (
        <div className={`mensaje mensaje-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="gestion-contenido">
        <div className="formulario-seccion">
          <h3>Seleccionar Ubicación en el Mapa</h3>
          <p className="ayuda-texto">Haz clic en el mapa para seleccionar las coordenadas</p>
          
          <div className="mapa-selector">
            <MapContainer
              center={coordenadaSeleccionada || CAMPUS_CENTER}
              zoom={16}
              style={{ height: '300px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {coordenadaSeleccionada && (
                <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} />
              )}
            </MapContainer>
          </div>

          <form onSubmit={handleSubmit} className="form-ubicacion">
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Edificio A"
                />
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <select
                  name="tipo"
                  value={formulario.tipo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="edificio">Edificio</option>
                  <option value="servicio">Servicio</option>
                  <option value="entrada">Entrada</option>
                  <option value="estacionamiento">Estacionamiento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Latitud *</label>
                <input
                  type="number"
                  name="latitud"
                  value={formulario.latitud}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  placeholder="-35.4264"
                />
              </div>

              <div className="form-group">
                <label>Longitud *</label>
                <input
                  type="number"
                  name="longitud"
                  value={formulario.longitud}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  placeholder="-71.6554"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción de la ubicación..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="visible"
                  checked={formulario.visible}
                  onChange={handleInputChange}
                />
                Visible en el mapa
              </label>
            </div>

            <details className="metadatos-seccion">
              <summary>Metadatos Opcionales</summary>
              <div className="form-grid">
                <div className="form-group">
                  <label>Horario</label>
                  <input
                    type="text"
                    name="metadatos.horario"
                    value={formulario.metadatos.horario}
                    onChange={handleInputChange}
                    placeholder="Lun-Vie 8:00-18:00"
                  />
                </div>
                <div className="form-group">
                  <label>Contacto</label>
                  <input
                    type="text"
                    name="metadatos.contacto"
                    value={formulario.metadatos.contacto}
                    onChange={handleInputChange}
                    placeholder="Email o teléfono"
                  />
                </div>
              </div>
            </details>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : modoEdicion ? 'Actualizar Ubicación' : 'Crear Ubicación'}
            </button>
            
            {modoEdicion && (
              <button 
                type="button"
                onClick={resetFormulario} 
                className="btn-cancelar"
              >
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        <div className="lista-ubicaciones">
          <h3>Ubicaciones Registradas ({ubicaciones.length})</h3>
          
          {cargando && ubicaciones.length === 0 ? (
            <p>Cargando...</p>
          ) : (
            <div className="ubicaciones-grid">
              {ubicaciones.map(ubicacion => (
                <div key={ubicacion._id} className="ubicacion-card">
                  <div className="ubicacion-info">
                    <h4>{ubicacion.nombre}</h4>
                    <span className={`badge badge-${ubicacion.tipo}`}>
                      {ubicacion.tipo}
                    </span>
                    {!ubicacion.visible && (
                      <span className="badge badge-oculto">Oculto</span>
                    )}
                    <p className="ubicacion-descripcion">
                      {ubicacion.descripcion || 'Sin descripción'}
                    </p>
                    <p className="ubicacion-coords">
                      {ubicacion.ubicacion.coordinates[1].toFixed(6)}, {ubicacion.ubicacion.coordinates[0].toFixed(6)}
                    </p>
                  </div>
                  <div className="ubicacion-acciones">
                    <button 
                      onClick={() => editarUbicacion(ubicacion)}
                      className="btn-editar"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarUbicacion(ubicacion._id)}
                      className="btn-eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionUbicaciones;
