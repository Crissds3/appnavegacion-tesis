import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { puntosARService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import {
  Plus, Edit2, Trash2, X, MapPin, Clock, Eye, EyeOff,
  BookOpen, UtensilsCrossed, FlaskConical, GraduationCap,
  Building2, Activity,
} from 'lucide-react';

const CAT_ICONS = {
  biblioteca: BookOpen, casino: UtensilsCrossed, laboratorio: FlaskConical,
  aula: GraduationCap, administrativo: Building2, deportivo: Activity, otro: MapPin,
};
function CatIcon({ categoria, size = 18 }) {
  const Icon = CAT_ICONS[categoria] || MapPin;
  return <Icon size={size} />;
}
import './AdminPuntosAR.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CAMPUS_CENTER = [-35.002607, -71.230519];
const CATEGORIAS = ['biblioteca', 'casino', 'laboratorio', 'aula', 'administrativo', 'deportivo', 'otro'];
const DIAS_PRESET = ['Lunes a Viernes', 'Lunes a Sábado', 'Lunes a Domingo', 'Sábado', 'Domingo'];

const FORM_EMPTY = {
  nombre: '', descripcion: '', categoria: 'otro',
  latitud: '', longitud: '', horarios: [], activo: true,
};

const MapClickHandler = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
};

const AdminPuntosAR = () => {
  const [puntos, setPuntos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editando, setEditando]         = useState(null);
  const [form, setForm]                 = useState(FORM_EMPTY);
  const [marcadorMapa, setMarcadorMapa] = useState(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await puntosARService.getTodosPuntos();
      if (res.success) setPuntos(res.data);
    } catch { showError('Error al cargar puntos AR'); }
    finally { setLoading(false); }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_EMPTY);
    setMarcadorMapa(null);
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      nombre: p.nombre, descripcion: p.descripcion || '',
      categoria: p.categoria, latitud: p.latitud, longitud: p.longitud,
      horarios: p.horarios || [], activo: p.activo,
    });
    setMarcadorMapa({ lat: p.latitud, lng: p.longitud });
    setShowModal(true);
  };

  const handleMapPick = ({ lat, lng }) => {
    setMarcadorMapa({ lat, lng });
    setForm(f => ({ ...f, latitud: lat.toFixed(7), longitud: lng.toFixed(7) }));
  };

  const addHorario = () => {
    setForm(f => ({ ...f, horarios: [...f.horarios, { turno: 'Lunes a Viernes', apertura: '08:00', cierre: '18:00' }] }));
  };

  const updateHorario = (i, field, value) => {
    setForm(f => {
      const h = [...f.horarios];
      h[i] = { ...h[i], [field]: value };
      return { ...f, horarios: h };
    });
  };

  const removeHorario = (i) => {
    setForm(f => ({ ...f, horarios: f.horarios.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitud || !form.longitud) return showError('Selecciona una ubicación en el mapa');
    setSaving(true);
    try {
      const payload = { ...form, latitud: parseFloat(form.latitud), longitud: parseFloat(form.longitud) };
      if (editando) {
        await puntosARService.updatePunto(editando._id, payload);
        showSuccess('Punto AR actualizado');
      } else {
        await puntosARService.createPunto(payload);
        showSuccess('Punto AR creado');
      }
      cargar();
      setShowModal(false);
    } catch (err) {
      showError(err.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    const ok = await showConfirm({ title: '¿Eliminar punto AR?', text: 'Esta acción no se puede deshacer', confirmText: 'Sí, eliminar' });
    if (!ok) return;
    try {
      await puntosARService.deletePunto(id);
      showSuccess('Punto eliminado');
      cargar();
    } catch { showError('Error al eliminar'); }
  };

  const toggleActivo = async (p) => {
    try {
      await puntosARService.updatePunto(p._id, { ...p, activo: !p.activo });
      cargar();
    } catch { showError('Error al actualizar'); }
  };

  return (
    <div className="par-container">
      <div className="par-header">
        <div>
          <h2 className="par-title">Puntos de Realidad Aumentada</h2>
          <p className="par-subtitle">
            Define los edificios y lugares que aparecen en la vista AR del campus cuando el estudiante apunta su cámara.
          </p>
        </div>
        <button className="par-btn-add" onClick={abrirCrear}>
          <Plus size={18} /> Nuevo punto AR
        </button>
      </div>

      {loading ? (
        <div className="par-loading"><div className="par-spinner" /></div>
      ) : puntos.length === 0 ? (
        <div className="par-empty">
          <MapPin size={40} opacity={0.3} />
          <p>No hay puntos AR definidos.<br/>Agrega el primero para que aparezca en la vista de cámara.</p>
        </div>
      ) : (
        <div className="par-grid">
          {puntos.map((p) => (
            <div key={p._id} className={`par-card ${!p.activo ? 'par-card--inactivo' : ''}`}>
              <div className="par-card-top">
                <span className="par-cat-icon"><CatIcon categoria={p.categoria} /></span>
                <div className="par-card-info">
                  <h3>{p.nombre}</h3>
                  <span className="par-cat-label">{p.categoria}</span>
                </div>
                <div className="par-card-actions">
                  <button title={p.activo ? 'Desactivar' : 'Activar'} onClick={() => toggleActivo(p)}>
                    {p.activo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button title="Editar" onClick={() => abrirEditar(p)}><Edit2 size={16} /></button>
                  <button title="Eliminar" className="par-btn-delete" onClick={() => handleEliminar(p._id)}><Trash2 size={16} /></button>
                </div>
              </div>
              {p.descripcion && <p className="par-card-desc">{p.descripcion}</p>}
              <div className="par-card-meta">
                <span><MapPin size={12} /> {parseFloat(p.latitud).toFixed(5)}, {parseFloat(p.longitud).toFixed(5)}</span>
                {p.horarios?.length > 0 && <span><Clock size={12} /> {p.horarios.length} horario{p.horarios.length > 1 ? 's' : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="par-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="par-modal" onClick={(e) => e.stopPropagation()}>
            <div className="par-modal-header">
              <h3>{editando ? 'Editar punto AR' : 'Nuevo punto AR'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="par-form">
              <div className="par-form-row">
                <div className="par-field">
                  <label>Nombre del lugar *</label>
                  <input
                    type="text" required value={form.nombre}
                    onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Biblioteca Central"
                  />
                </div>
                <div className="par-field par-field--sm">
                  <label>Categoría</label>
                  <select value={form.categoria} onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="par-field">
                <label>Descripción breve</label>
                <textarea
                  rows={2} value={form.descripcion}
                  onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Préstamo de libros, sala de estudio, acceso a internet..."
                />
              </div>

              {/* Mapa para seleccionar ubicación */}
              <div className="par-field">
                <label>Ubicación en el campus * <span className="par-hint">— haz click en el mapa para marcar</span></label>
                <div className="par-map-wrap">
                  <MapContainer center={CAMPUS_CENTER} zoom={17} style={{ height: 280, width: '100%', borderRadius: 12 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickHandler onPick={handleMapPick} />
                    {marcadorMapa && (
                      <Marker position={[marcadorMapa.lat, marcadorMapa.lng]}>
                        <Popup>{form.nombre || 'Punto AR'}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {form.latitud && (
                  <p className="par-coords">📍 {parseFloat(form.latitud).toFixed(6)}, {parseFloat(form.longitud).toFixed(6)}</p>
                )}
              </div>

              {/* Horarios */}
              <div className="par-field">
                <div className="par-horarios-header">
                  <label>Horarios de atención</label>
                  <button type="button" className="par-btn-add-horario" onClick={addHorario}><Plus size={14} /> Agregar</button>
                </div>
                {form.horarios.map((h, i) => (
                  <div key={i} className="par-horario-row">
                    <select value={h.turno} onChange={(e) => updateHorario(i, 'turno', e.target.value)}>
                      {DIAS_PRESET.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={h.apertura} onChange={(e) => updateHorario(i, 'apertura', e.target.value)} />
                    <span>–</span>
                    <input type="time" value={h.cierre} onChange={(e) => updateHorario(i, 'cierre', e.target.value)} />
                    <button type="button" onClick={() => removeHorario(i)}><X size={14} /></button>
                  </div>
                ))}
                {form.horarios.length === 0 && <p className="par-hint">Sin horarios definidos</p>}
              </div>

              <div className="par-field par-field--check">
                <label>
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))} />
                  Punto activo (visible en la app)
                </label>
              </div>

              <div className="par-form-actions">
                <button type="button" className="par-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="par-btn-save" disabled={saving}>
                  {saving ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear punto AR')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPuntosAR;
