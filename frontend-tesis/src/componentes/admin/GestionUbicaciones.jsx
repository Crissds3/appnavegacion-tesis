import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../servicios/api';
import { showSuccess, showError, showConfirm, showToast } from '../../utils/sweetAlert';
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
const CAMPUS_BOUNDS = [
  [-35.015, -71.245], // Suroeste
  [-34.990, -71.215]  // Noreste
];

const MapClickHandler = ({ onLocationSelect, isSelecting }) => {
  useMapEvents({
    click: (e) => {
      if (isSelecting) {
        onLocationSelect(e.latlng);
      }
    },
  });
  return null;
};

const GestionUbicaciones = () => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  const [formularioOriginal, setFormularioOriginal] = useState(null);

  const [coordenadaSeleccionada, setCoordenadaseleccionada] = useState(null);
  const [seleccionandoUbicacion, setSeleccionandoUbicacion] = useState(false);

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
      showError('Error al cargar ubicaciones');
      console.error(error);
    } finally {
      setCargando(false);
    }
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
    
    if (seleccionandoUbicacion) {
      setSeleccionandoUbicacion(false);
      setShowModal(true);
      showToast({ title: 'Ubicación capturada', icon: 'success' });
    } else if (!showModal) {
      showToast({ title: 'Coordenadas seleccionadas', icon: 'info' });
    }
  };

  const abrirModal = (ubicacion = null) => {
    if (ubicacion) {
      const [lng, lat] = ubicacion.ubicacion.coordinates;
      setUbicacionActual(ubicacion);
      setModoEdicion(true);
      const initialData = {
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
      };
      setFormulario(initialData);
      setFormularioOriginal(initialData);
      setCoordenadaseleccionada({ lat, lng });
    } else {
      resetFormulario();
      setModoEdicion(false);
      setFormularioOriginal(null);
      // Si ya hay una coordenada seleccionada en el mapa, usarla
      if (coordenadaSeleccionada) {
        setFormulario(prev => ({
          ...prev,
          latitud: coordenadaSeleccionada.lat.toFixed(6),
          longitud: coordenadaSeleccionada.lng.toFixed(6)
        }));
      }
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    if (!modoEdicion) {
      resetFormulario();
    }
  };

  const hasChanges = () => {
    if (!modoEdicion) return true; // Siempre permitir guardar si es nuevo
    if (!formularioOriginal) return true;
    return JSON.stringify(formulario) !== JSON.stringify(formularioOriginal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.nombre || !formulario.latitud || !formulario.longitud) {
      showError('Nombre y coordenadas son obligatorios');
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
        showSuccess('Ubicación actualizada exitosamente');
      } else {
        await api.post('/ubicaciones', datos);
        showSuccess('Ubicación creada exitosamente');
      }

      cerrarModal();
      cargarUbicaciones();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al guardar ubicación');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const eliminarUbicacion = async (id) => {
    const confirmado = await showConfirm({
      title: '¿Eliminar ubicación?',
      text: '¿Estás seguro de eliminar esta ubicación?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmado) return;

    try {
      setCargando(true);
      await api.delete(`/ubicaciones/${id}`);
      showSuccess('Ubicación eliminada exitosamente');
      cargarUbicaciones();
    } catch (error) {
      showError('Error al eliminar ubicación');
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
      <div className="gestion-main-card">
        <div className="gestion-header">
          <div className="header-title">
            <h2>Gestión de ubicaciones</h2>
            <p className="header-subtitle">Administra los puntos de interés en el mapa del campus</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-create-modern" 
              onClick={() => abrirModal()}
            >
              <Plus size={18} />
              <span>Nueva Ubicación</span>
            </button>
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
          {/* Columna Izquierda: Mapa */}
          <div className="left-column">
            <div className="mapa-card full-height">
              <div className="card-header">
                <h3><MapPin size={20} /> Mapa del Campus</h3>
                <p className="card-subtitle">Haz clic en el mapa para seleccionar coordenadas o ver detalles</p>
              </div>
              <div className="mapa-container full-height-map">
                {seleccionandoUbicacion && (
                  <div className="selection-banner">
                    <div className="selection-text">
                      <MapPin size={20} />
                      <span>Haga clic en el mapa para seleccionar la ubicación</span>
                    </div>
                    <button 
                      className="btn-cancel-selection"
                      onClick={() => {
                        setSeleccionandoUbicacion(false);
                        setShowModal(true);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <MapContainer
                  center={CAMPUS_CENTER}
                  zoom={16}
                  minZoom={16}
                  maxZoom={18}
                  maxBounds={CAMPUS_BOUNDS}
                  maxBoundsViscosity={1.0}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapClickHandler onLocationSelect={handleMapClick} isSelecting={seleccionandoUbicacion} />
                  
                  {/* Marcador de selección actual */}
                  {coordenadaSeleccionada && (
                    <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} opacity={1.0} />
                  )}

                  {/* Marcadores existentes */}
                  {ubicaciones.map(ubi => (
                    <Marker 
                      key={ubi._id} 
                      position={[ubi.ubicacion.coordinates[1], ubi.ubicacion.coordinates[0]]}
                      opacity={0.8}
                    >
                      <Popup>
                        <div className="popup-content">
                          <strong>{ubi.nombre}</strong>
                          <span className={`badge badge-${ubi.tipo}`}>{ubi.tipo}</span>
                          <div className="popup-actions">
                            <button onClick={() => abrirModal(ubi)}>Editar</button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Lista */}
          <div className="right-column">
            <div className="lista-card full-height">
              <div className="card-header">
                <h3><Building size={20} /> Ubicaciones ({ubicacionesFiltradas.length})</h3>
              </div>
              
              <div className="lista-scroll">
                {cargando && ubicaciones.length === 0 ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando...</p>
                  </div>
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
                            onClick={() => abrirModal(ubicacion)}
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

      {/* Modal Formulario */}
      {showModal && (
        <div className="modal-overlay-modern">
          <div className="modal-content-modern modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div className="modal-title-wrapper">
                <div className="modal-icon-bg">
                  {modoEdicion ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <h3>{modoEdicion ? 'Editar ubicación' : 'Nueva ubicación'}</h3>
              </div>
              <button className="btn-close-modal" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form-modern">
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

                <div className="form-group full-width">
                  <label>Ubicación *</label>
                  <div className="coords-selector">
                    <div className="coords-inputs">
                      <input
                        type="number"
                        name="latitud"
                        value={formulario.latitud}
                        onChange={handleInputChange}
                        step="0.000001"
                        required
                        className="input-modern"
                        readOnly
                        placeholder="Latitud"
                      />
                      <input
                        type="number"
                        name="longitud"
                        value={formulario.longitud}
                        onChange={handleInputChange}
                        step="0.000001"
                        required
                        className="input-modern"
                        readOnly
                        placeholder="Longitud"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-pick-map" 
                      onClick={() => { 
                        setSeleccionandoUbicacion(true); 
                        setShowModal(false); 
                      }}
                    >
                      <MapPin size={16} /> Seleccionar en el mapa
                    </button>
                  </div>
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
                <h4 className="meta-title"><Info size={16} /> Información adicional</h4>
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

              <div className="modal-footer-modern">
                <button 
                  type="button"
                  onClick={cerrarModal} 
                  className="btn-cancel-modern"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-submit-modern"
                  disabled={cargando || !hasChanges()}
                  style={{ opacity: (cargando || !hasChanges()) ? 0.5 : 1, cursor: (cargando || !hasChanges()) ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={18} /> {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUbicaciones;
