import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../servicios/api';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Eye, 
  EyeOff,
  Navigation,
  Building,
  Info
} from 'lucide-react';
import './GestionUbicaciones.css';

// Fix Leaflet icon issue
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
  const [filtro, setFiltro] = useState('');
  
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
    // mostrarMensaje('info', `Coordenadas seleccionadas: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
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
    
    // Scroll to form
    document.querySelector('.formulario-seccion')?.scrollIntoView({ behavior: 'smooth' });
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

  const ubicacionesFiltradas = ubicaciones.filter(u => 
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.tipo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="gestion-ubicaciones">
      {mensaje.texto && (
        <div className={`mensaje mensaje-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="gestion-main-card">
        <div className="gestion-header">
          <div className="header-title">
            <h2>Gestión de Ubicaciones</h2>
            <p className="header-subtitle">Administra los puntos de interés en el mapa del campus</p>
          </div>
          <div className="header-actions">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar ubicación..." 
                className="search-input"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="gestion-body-grid">
          {/* Columna Izquierda: Mapa y Formulario */}
          <div className="left-column">
            <div className="mapa-card">
              <div className="card-header">
                <h3><MapPin size={20} /> Selector de Ubicación</h3>
                <p className="card-subtitle">Haz clic en el mapa para obtener coordenadas</p>
              </div>
              <div className="mapa-container">
                <MapContainer
                  center={CAMPUS_CENTER}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  
                  {/* Marcador de selección actual */}
                  {coordenadaSeleccionada && (
                    <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} opacity={1.0}>
                      <Popup>Nueva selección</Popup>
                    </Marker>
                  )}

                  {/* Marcadores existentes */}
                  {ubicaciones.map(ubi => (
                    <Marker 
                      key={ubi._id} 
                      position={[ubi.ubicacion.coordinates[1], ubi.ubicacion.coordinates[0]]}
                      opacity={0.6}
                    >
                      <Popup>
                        <strong>{ubi.nombre}</strong><br/>
                        {ubi.tipo}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="formulario-seccion">
              <div className="card-header">
                <h3>{modoEdicion ? <Edit2 size={20} /> : <Plus size={20} />} {modoEdicion ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="form-ubicacion">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formulario.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Edificio de Ingeniería"
                      className="input-modern"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      name="tipo"
                      value={formulario.tipo}
                      onChange={handleInputChange}
                      required
                      className="select-modern"
                    >
                      <option value="edificio">Edificio</option>
                      <option value="servicio">Servicio</option>
                      <option value="entrada">Entrada</option>
                      <option value="estacionamiento">Estacionamiento</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Visibilidad</label>
                    <label className={`checkbox-card-small ${formulario.visible ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        name="visible"
                        checked={formulario.visible}
                        onChange={handleInputChange}
                      />
                      <div className="checkbox-content-small">
                        {formulario.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                        <span>{formulario.visible ? 'Visible en mapa' : 'Oculto'}</span>
                      </div>
                    </label>
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
                      className="input-modern"
                      readOnly
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
                      className="input-modern"
                      readOnly
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formulario.descripcion}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Descripción breve..."
                      className="textarea-modern"
                    />
                  </div>
                </div>

                <div className="metadatos-container">
                  <h4 className="meta-title"><Info size={16} /> Información Adicional</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Horario</label>
                      <input
                        type="text"
                        name="metadatos.horario"
                        value={formulario.metadatos.horario}
                        onChange={handleInputChange}
                        placeholder="Ej: 08:00 - 18:00"
                        className="input-modern"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contacto</label>
                      <input
                        type="text"
                        name="metadatos.contacto"
                        value={formulario.metadatos.contacto}
                        onChange={handleInputChange}
                        placeholder="Email o anexo"
                        className="input-modern"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  {modoEdicion && (
                    <button 
                      type="button"
                      onClick={resetFormulario} 
                      className="btn-cancel-modern"
                    >
                      <X size={18} /> Cancelar
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn-submit-modern"
                    disabled={cargando}
                  >
                    <Save size={18} /> {modoEdicion ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Lista */}
          <div className="right-column">
            <div className="lista-card">
              <div className="card-header">
                <h3><Building size={20} /> Ubicaciones ({ubicacionesFiltradas.length})</h3>
              </div>
              
              <div className="lista-scroll">
                {cargando && ubicaciones.length === 0 ? (
                  <div className="loading-state">Cargando...</div>
                ) : ubicacionesFiltradas.length === 0 ? (
                  <div className="empty-state">No se encontraron ubicaciones</div>
                ) : (
                  <div className="ubicaciones-list">
                    {ubicacionesFiltradas.map(ubicacion => (
                      <div key={ubicacion._id} className={`ubicacion-item ${ubicacionActual?._id === ubicacion._id ? 'selected' : ''}`}>
                        <div className="ubicacion-icon">
                          <MapPin size={24} color="#E53935" />
                        </div>
                        <div className="ubicacion-details">
                          <div className="ubicacion-header-item">
                            <h4>{ubicacion.nombre}</h4>
                            <span className={`badge badge-${ubicacion.tipo}`}>
                              {ubicacion.tipo}
                            </span>
                          </div>
                          <p className="coords-text">
                            {ubicacion.ubicacion.coordinates[1].toFixed(5)}, {ubicacion.ubicacion.coordinates[0].toFixed(5)}
                          </p>
                        </div>
                        <div className="ubicacion-actions">
                          <button 
                            onClick={() => editarUbicacion(ubicacion)}
                            className="btn-icon-action edit"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => eliminarUbicacion(ubicacion._id)}
                            className="btn-icon-action delete"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionUbicaciones;
