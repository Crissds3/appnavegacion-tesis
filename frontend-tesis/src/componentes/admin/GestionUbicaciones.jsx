import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../servicios/api';
import { showSuccess, showError, showConfirm, showToast } from '../../utils/sweetAlert';
import { getIconoPorCategoria, CATEGORIAS, CATEGORIA_CONFIG } from '../../utils/iconosMapa';
import {
  MapPin, Plus, Edit2, Trash2, Save, X, Search,
  Eye, EyeOff, Navigation, Info,
} from 'lucide-react';
import './GestionUbicaciones.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMPUS_CENTER = [-35.002607, -71.230519];
const CAMPUS_BOUNDS = [[-35.015, -71.245], [-34.990, -71.215]];

const MapClickHandler = ({ onLocationSelect, isSelecting }) => {
  useMapEvents({ click: (e) => { if (isSelecting) onLocationSelect(e.latlng); } });
  return null;
};

// ─── Chips de filtro (igual que wayfinding público) ─────────────────────────
const CHIPS_FILTRO = [
  { value: 'todos', label: 'Todos' },
  ...CATEGORIAS.map(c => ({ value: c.value, label: c.label, color: c.color })),
];

const GestionUbicaciones = () => {
  const [ubicaciones,     setUbicaciones]     = useState([]);
  const [cargando,        setCargando]         = useState(false);
  const [showModal,       setShowModal]        = useState(false);
  const [modoEdicion,     setModoEdicion]      = useState(false);
  const [ubicacionActual, setUbicacionActual]  = useState(null);
  const [filtro,          setFiltro]           = useState('');
  const [filtroCategoria, setFiltroCategoria]  = useState('todos');

  const [formulario, setFormulario] = useState({
    nombre: '', tipo: 'edificio', categoria: 'edificio', descripcion: '',
    latitud: '', longitud: '', icono: 'marker', visible: true,
    metadatos: { piso: '', capacidad: '', horario: '', contacto: '', url: '' },
  });
  const [formularioOriginal, setFormularioOriginal] = useState(null);
  const [coordenadaSeleccionada, setCoordenadaseleccionada] = useState(null);
  const [seleccionandoUbicacion, setSeleccionandoUbicacion] = useState(false);

  useEffect(() => { cargarUbicaciones(); }, []);

  const cargarUbicaciones = async () => {
    try {
      setCargando(true);
      const res = await api.get('/ubicaciones');
      if (res.data.success) setUbicaciones(res.data.data);
    } catch { showError('Error al cargar ubicaciones'); }
    finally { setCargando(false); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('metadatos.')) {
      const k = name.split('.')[1];
      setFormulario(p => ({ ...p, metadatos: { ...p.metadatos, [k]: value } }));
    } else {
      setFormulario(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleMapClick = (latlng) => {
    setCoordenadaseleccionada(latlng);
    setFormulario(p => ({ ...p, latitud: latlng.lat.toFixed(6), longitud: latlng.lng.toFixed(6) }));
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
      const d = {
        nombre: ubicacion.nombre, tipo: ubicacion.tipo,
        categoria: ubicacion.categoria || 'edificio',
        descripcion: ubicacion.descripcion || '',
        latitud: lat.toString(), longitud: lng.toString(),
        icono: ubicacion.icono || 'marker', visible: ubicacion.visible,
        metadatos: ubicacion.metadatos || { piso:'',capacidad:'',horario:'',contacto:'',url:'' },
      };
      setFormulario(d); setFormularioOriginal(d);
      setCoordenadaseleccionada({ lat, lng });
      setShowModal(true);
    } else {
      resetFormulario(); setModoEdicion(false); setFormularioOriginal(null);
      if (coordenadaSeleccionada) {
        setFormulario(p => ({ ...p, latitud: coordenadaSeleccionada.lat.toFixed(6), longitud: coordenadaSeleccionada.lng.toFixed(6) }));
        setShowModal(true);
      } else {
        setSeleccionandoUbicacion(true);
        showToast({ title: 'Primero selecciona la ubicación en el mapa', icon: 'info' });
      }
    }
  };

  const cerrarModal = () => { setShowModal(false); if (!modoEdicion) resetFormulario(); };
  const hasChanges = () => !modoEdicion || !formularioOriginal || JSON.stringify(formulario) !== JSON.stringify(formularioOriginal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.nombre || !formulario.latitud || !formulario.longitud) {
      showError('Nombre y coordenadas son obligatorios'); return;
    }
    try {
      setCargando(true);
      const datos = {
        nombre: formulario.nombre, tipo: formulario.tipo, categoria: formulario.categoria,
        descripcion: formulario.descripcion, latitud: parseFloat(formulario.latitud),
        longitud: parseFloat(formulario.longitud), icono: formulario.icono,
        visible: formulario.visible, metadatos: formulario.metadatos,
      };
      if (modoEdicion && ubicacionActual) {
        await api.put(`/ubicaciones/${ubicacionActual._id}`, datos);
        showSuccess('Ubicación actualizada exitosamente');
      } else {
        await api.post('/ubicaciones', datos);
        showSuccess('Ubicación creada exitosamente');
      }
      cerrarModal(); cargarUbicaciones();
    } catch (err) {
      showError(err.response?.data?.message || 'Error al guardar ubicación');
    } finally { setCargando(false); }
  };

  const eliminarUbicacion = async (id) => {
    const ok = await showConfirm({ title: '¿Eliminar ubicación?', text: 'Esta acción no se puede deshacer.', confirmText: 'Sí, eliminar', cancelText: 'Cancelar' });
    if (!ok) return;
    try {
      setCargando(true);
      await api.delete(`/ubicaciones/${id}`);
      showSuccess('Ubicación eliminada'); cargarUbicaciones();
    } catch { showError('Error al eliminar ubicación'); }
    finally { setCargando(false); }
  };

  const resetFormulario = () => {
    setFormulario({ nombre:'',tipo:'edificio',categoria:'edificio',descripcion:'',latitud:'',longitud:'',icono:'marker',visible:true,metadatos:{piso:'',capacidad:'',horario:'',contacto:'',url:''} });
    setCoordenadaseleccionada(null); setModoEdicion(false); setUbicacionActual(null);
  };

  const ubicacionesFiltradas = ubicaciones.filter(u => {
    const txt = (u.nombre + ' ' + u.tipo).toLowerCase().includes(filtro.toLowerCase());
    const cat = filtroCategoria === 'todos' || (u.categoria || u.tipo) === filtroCategoria;
    return txt && cat;
  });

  return (
    <div className="gu-wrap">

      {/* ── Cabecera ── */}
      <div className="gu-header">
        <p className="gu-subtitle">{ubicaciones.length} ubicaciones registradas en el campus</p>
        <div className="gu-header-right">
          <div className="gu-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar ubicación…"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            {filtro && <button onClick={() => setFiltro('')}><X size={14} /></button>}
          </div>
          <button className="gu-btn-add" onClick={() => abrirModal()}>
            <Plus size={17} /> Nueva ubicación
          </button>
        </div>
      </div>

      {/* ── Chips de filtro ── */}
      <div className="gu-chips">
        {CHIPS_FILTRO.map(c => {
          const isActive = filtroCategoria === c.value;
          const activeColor = c.color || '#E53935';
          const cnt = c.value === 'todos'
            ? ubicaciones.filter(u => (u.tipo||u.categoria) !== 'evento').length
            : ubicaciones.filter(u => (u.categoria||u.tipo) === c.value).length;
          return (
            <button
              key={c.value}
              className={`gu-chip ${isActive ? 'gu-chip--active' : ''}`}
              style={isActive ? { background: activeColor, borderColor: activeColor } : {}}
              onClick={() => setFiltroCategoria(p => p === c.value ? 'todos' : c.value)}
            >
              {c.value !== 'todos' && (
                <span className="gu-chip-dot" style={{ background: isActive ? '#fff' : c.color }} />
              )}
              {c.label}
              {cnt > 0 && <span className="gu-chip-cnt">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Grid: mapa | lista ── */}
      <div className="gu-grid">

        {/* Mapa */}
        <div className="gu-map-panel">
          {seleccionandoUbicacion && (
            <div className="gu-selection-banner">
              <MapPin size={17} />
              <span>Haz clic en el mapa para seleccionar la ubicación</span>
              <button onClick={() => { setSeleccionandoUbicacion(false); setShowModal(true); }}>Cancelar</button>
            </div>
          )}
          <MapContainer
            center={CAMPUS_CENTER} zoom={16} minZoom={15} maxZoom={18}
            maxBounds={CAMPUS_BOUNDS} maxBoundsViscosity={1.0}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <MapClickHandler onLocationSelect={handleMapClick} isSelecting={seleccionandoUbicacion} />

            {coordenadaSeleccionada && (
              <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} icon={getIconoPorCategoria(formulario.categoria)} />
            )}

            {ubicacionesFiltradas.map(ubi => {
              const cfg = CATEGORIA_CONFIG[ubi.categoria||ubi.tipo] || CATEGORIA_CONFIG.otro;
              return (
                <Marker key={ubi._id}
                  position={[ubi.ubicacion.coordinates[1], ubi.ubicacion.coordinates[0]]}
                  icon={getIconoPorCategoria(ubi.categoria || ubi.tipo)}
                >
                  <Popup autoPan={false}>
                    <div className="gu-popup">
                      <div className="gu-popup-head">
                        <span className="gu-popup-dot" style={{ background: cfg.color }} />
                        <span className="gu-popup-name">{ubi.nombre}</span>
                      </div>
                      <div className="gu-popup-foot">
                        <span className="gu-popup-badge" style={{ background: cfg.color + '18', color: cfg.color }}>{cfg.label}</span>
                        <button className="gu-popup-edit" onClick={() => abrirModal(ubi)}>
                          <Edit2 size={13} /> Editar
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Lista */}
        <div className="gu-list-panel">
          <div className="gu-list-header">
            <span className="gu-list-count">{ubicacionesFiltradas.length} ubicaciones</span>
          </div>

          {cargando && ubicaciones.length === 0 ? (
            <div className="gu-state"><div className="gu-spinner" /><p>Cargando…</p></div>
          ) : ubicacionesFiltradas.length === 0 ? (
            <div className="gu-state"><MapPin size={32} opacity={.3} /><p>Sin resultados</p></div>
          ) : (
            <div className="gu-list">
              {ubicacionesFiltradas.map(u => {
                const cfg = CATEGORIA_CONFIG[u.categoria||u.tipo] || CATEGORIA_CONFIG.otro;
                return (
                  <div key={u._id} className={`gu-item ${ubicacionActual?._id === u._id ? 'gu-item--selected' : ''}`}>
                    <div className="gu-item-ic" style={{ background: cfg.color + '18', color: cfg.color }}>
                      <MapPin size={16} />
                    </div>

                    <div className="gu-item-info">
                      <div className="gu-item-top">
                        <span className="gu-item-name">{u.nombre}</span>
                        {!u.visible && <span className="gu-item-hidden"><EyeOff size={10} /> Oculto</span>}
                      </div>
                      <div className="gu-item-meta">
                        <span className="gu-item-badge" style={{ background: cfg.color + '18', color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="gu-item-coords">
                          {u.ubicacion.coordinates[1].toFixed(4)}, {u.ubicacion.coordinates[0].toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="gu-item-actions">
                      <button className="gu-btn-icon gu-btn-edit" title="Editar" onClick={() => abrirModal(u)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="gu-btn-icon gu-btn-delete" title="Eliminar" onClick={() => eliminarUbicacion(u._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal editar / crear ── */}
      {showModal && (
        <div className="gu-modal-overlay" onClick={cerrarModal}>
          <div className="gu-modal" onClick={e => e.stopPropagation()}>

            <div className="gu-modal-header">
              <div className="gu-modal-title-row">
                <div className="gu-modal-icon">{modoEdicion ? <Edit2 size={20} /> : <Plus size={20} />}</div>
                <h3>{modoEdicion ? 'Editar ubicación' : 'Nueva ubicación'}</h3>
              </div>
              <button className="gu-modal-close" onClick={cerrarModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="gu-form">

              {/* Nombre */}
              <div className="gu-field gu-field--full">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={formulario.nombre} onChange={handleInputChange}
                  required placeholder="Ej: Edificio de Ingeniería" />
              </div>

              {/* Tipo + Visible */}
              <div className="gu-row">
                <div className="gu-field">
                  <label>Tipo *</label>
                  <select name="tipo" value={formulario.tipo} onChange={handleInputChange} required>
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="gu-field">
                  <label>Visibilidad</label>
                  <button
                    type="button"
                    className={`gu-toggle ${formulario.visible ? 'gu-toggle--on' : ''}`}
                    onClick={() => setFormulario(p => ({ ...p, visible: !p.visible }))}
                  >
                    {formulario.visible ? <><Eye size={15} /> Visible</> : <><EyeOff size={15} /> Oculto</>}
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div className="gu-field gu-field--full">
                <label>Categoría (ícono en el mapa)</label>
                <div className="gu-cat-chips">
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value} type="button"
                      className={`gu-cat-chip ${formulario.categoria === c.value ? 'gu-cat-chip--active' : ''}`}
                      style={formulario.categoria === c.value ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color + '50' }}
                      onClick={() => setFormulario(p => ({ ...p, categoria: c.value }))}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: formulario.categoria === c.value ? '#fff' : c.color, display:'inline-block', flexShrink:0 }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordenadas */}
              <div className="gu-field gu-field--full">
                <label>Ubicación *</label>
                <div className="gu-coords">
                  <input type="number" name="latitud" value={formulario.latitud} onChange={handleInputChange}
                    step="0.000001" required readOnly placeholder="Latitud" />
                  <input type="number" name="longitud" value={formulario.longitud} onChange={handleInputChange}
                    step="0.000001" required readOnly placeholder="Longitud" />
                  <button type="button" className="gu-btn-map"
                    onClick={() => { setSeleccionandoUbicacion(true); setShowModal(false); }}>
                    <MapPin size={15} /> Seleccionar en mapa
                  </button>
                </div>
              </div>

              {/* Descripción */}
              <div className="gu-field gu-field--full">
                <label>Descripción</label>
                <textarea name="descripcion" value={formulario.descripcion} onChange={handleInputChange}
                  rows={2} placeholder="Descripción breve del lugar…" />
              </div>

              {/* Metadatos */}
              <div className="gu-meta-section">
                <p className="gu-meta-title"><Info size={14} /> Información adicional</p>
                <div className="gu-row">
                  <div className="gu-field">
                    <label>Horario</label>
                    <input type="text" name="metadatos.horario" value={formulario.metadatos.horario}
                      onChange={handleInputChange} placeholder="Ej: 08:00 - 18:00" />
                  </div>
                  <div className="gu-field">
                    <label>Contacto</label>
                    <input type="text" name="metadatos.contacto" value={formulario.metadatos.contacto}
                      onChange={handleInputChange} placeholder="Email o anexo" />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="gu-form-actions">
                <button type="button" className="gu-btn-cancel" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="gu-btn-save" disabled={cargando || !hasChanges()}>
                  <Save size={16} /> {modoEdicion ? 'Guardar cambios' : 'Crear ubicación'}
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
