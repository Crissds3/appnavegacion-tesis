import { useState, useEffect, useRef } from 'react';
import { noticiasService, ubicacionesService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import {
  Plus, Search, Edit2, Trash2, X, Image as ImageIcon,
  Calendar, MapPin, Star, Eye, EyeOff, Upload, Newspaper,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './GestionNoticias.css';

// Fix: sin esto Leaflet intenta cargar imágenes desde rutas que no existen en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CAMPUS_CENTER = [-35.002607, -71.230519];
const CAMPUS_BOUNDS = [[-35.007000, -71.235500], [-34.998000, -71.225500]];

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({ click(e) { onLocationSelect([e.latlng.lat, e.latlng.lng]); } });
  return null;
};

const TIPOS     = ['Noticia', 'Evento', 'Anuncio'];
const CATEGORIAS = ['Académico','Cultural','Deportivo','Investigación','Extensión','Administrativo','Otro'];
const TIPO_COLOR = { Noticia:'#1565C0', Evento:'#E53935', Anuncio:'#E65100' };
const PAGE_SIZE = 6;

const GestionNoticias = () => {
  const [noticias,      setNoticias]      = useState([]);
  const [ubicaciones,   setUbicaciones]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingNoticia,setEditingNoticia]= useState(null);
  const [noticiaOriginal,setNoticiaOriginal]=useState(null);
  const [filtros,       setFiltros]       = useState({ tipo: '', categoria: '' });
  const [busqueda,      setBusqueda]      = useState('');
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenFile,    setImagenFile]    = useState(null);
  const [eliminarImagenFlag,setEliminarImagenFlag]=useState(false);
  const [modoUbicacion, setModoUbicacion] = useState('existente');
  const [coordsEvento,  setCoordsEvento]  = useState(null);
  const [pagina,        setPagina]        = useState(1);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    titulo:'', descripcion:'', contenido:'', tipo:'Noticia',
    categoria:'Académico', fechaEvento:'', ubicacionEvento:'',
    ubicacionWayfinding:'', destacado:false, activo:true,
  });

  useEffect(() => { cargarNoticias(); cargarUbicaciones(); }, []);

  const cargarUbicaciones = async () => {
    try {
      const res = await ubicacionesService.getUbicacionesPublicas();
      if (res.success) setUbicaciones(res.data);
    } catch {}
  };

  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const res = await noticiasService.getAllNoticias();
      if (res.success) setNoticias(res.data);
    } catch { showError('Error al cargar noticias'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showError('La imagen no debe superar 10 MB'); return; }
    if (!file.type.startsWith('image/')) { showError('Solo se permiten imágenes'); return; }
    setImagenFile(file);
    setEliminarImagenFlag(false);
    setImagenPreview(URL.createObjectURL(file));
  };

  const eliminarImagen = () => {
    setImagenFile(null); setImagenPreview(null); setEliminarImagenFlag(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasChanges = () => {
    if (!editingNoticia) return true;
    if (!noticiaOriginal) return false;
    if (imagenFile || eliminarImagenFlag) return true;
    const cur = { titulo:formData.titulo,descripcion:formData.descripcion,contenido:formData.contenido,tipo:formData.tipo,categoria:formData.categoria,fechaEvento:formData.fechaEvento,ubicacionEvento:formData.ubicacionEvento,ubicacionWayfinding:formData.ubicacionWayfinding,destacado:formData.destacado,activo:formData.activo };
    const orig = { titulo:noticiaOriginal.titulo,descripcion:noticiaOriginal.descripcion,contenido:noticiaOriginal.contenido,tipo:noticiaOriginal.tipo,categoria:noticiaOriginal.categoria,fechaEvento:noticiaOriginal.fechaEvento?noticiaOriginal.fechaEvento.split('T')[0]:'',ubicacionEvento:noticiaOriginal.ubicacionEvento||'',ubicacionWayfinding:noticiaOriginal.ubicacionWayfinding?(noticiaOriginal.ubicacionWayfinding._id||noticiaOriginal.ubicacionWayfinding):'',destacado:noticiaOriginal.destacado,activo:noticiaOriginal.activo };
    return JSON.stringify(cur) !== JSON.stringify(orig);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let ubicacionWayfindingId = formData.ubicacionWayfinding;
      if (formData.tipo === 'Evento' && modoUbicacion === 'mapa' && coordsEvento) {
        const r = await ubicacionesService.createUbicacion({ nombre:formData.titulo,tipo:'evento',categoria:'evento',latitud:coordsEvento[0],longitud:coordsEvento[1],metadatos:{fechaEvento:formData.fechaEvento} });
        if (r.success) ubicacionWayfindingId = r.data._id;
      }
      const fd = new FormData();
      fd.append('titulo',formData.titulo); fd.append('descripcion',formData.descripcion);
      fd.append('contenido',formData.contenido); fd.append('tipo',formData.tipo);
      fd.append('categoria',formData.categoria); fd.append('destacado',formData.destacado);
      fd.append('activo',formData.activo);
      if (formData.fechaEvento) fd.append('fechaEvento',formData.fechaEvento);
      if (formData.ubicacionEvento) fd.append('ubicacionEvento',formData.ubicacionEvento);
      fd.append('ubicacionWayfinding', ubicacionWayfindingId || '');
      if (imagenFile) fd.append('imagen', imagenFile);
      if (eliminarImagenFlag) fd.append('eliminarImagen','true');

      if (editingNoticia) {
        const res = await noticiasService.updateNoticia(editingNoticia._id, fd);
        if (res.success) { showSuccess('Noticia actualizada'); cargarNoticias(); cerrarModal(); }
      } else {
        const res = await noticiasService.createNoticia(fd);
        if (res.success) { showSuccess('Noticia creada'); cargarNoticias(); cerrarModal(); }
      }
    } catch (err) { showError(err.message || 'Error al guardar noticia'); }
  };

  const handleEditar = (n) => {
    setEditingNoticia(n); setNoticiaOriginal(n);
    setFormData({ titulo:n.titulo,descripcion:n.descripcion,contenido:n.contenido,tipo:n.tipo,categoria:n.categoria,fechaEvento:n.fechaEvento?n.fechaEvento.split('T')[0]:'',ubicacionEvento:n.ubicacionEvento||'',ubicacionWayfinding:n.ubicacionWayfinding?(n.ubicacionWayfinding._id||n.ubicacionWayfinding):'',destacado:n.destacado,activo:n.activo });
    setImagenFile(null); setEliminarImagenFlag(false);
    setImagenPreview(n.imagenUrl || null);
    setModoUbicacion('existente'); setCoordsEvento(null);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    const ok = await showConfirm({ title:'¿Eliminar noticia?', text:'Esta acción no se puede deshacer.', confirmText:'Sí, eliminar', cancelText:'Cancelar' });
    if (!ok) return;
    try {
      const res = await noticiasService.deleteNoticia(id);
      if (res.success) { showSuccess('Noticia eliminada'); cargarNoticias(); }
    } catch { showError('Error al eliminar'); }
  };

  const toggleDestacado = async (n) => {
    try {
      const fd = new FormData();
      Object.entries({ titulo:n.titulo,descripcion:n.descripcion,contenido:n.contenido,tipo:n.tipo,categoria:n.categoria,destacado:!n.destacado,activo:n.activo }).forEach(([k,v]) => fd.append(k,v));
      await noticiasService.updateNoticia(n._id, fd);
      cargarNoticias();
    } catch { showError('Error al actualizar'); }
  };

  const cerrarModal = () => {
    setShowModal(false); setEditingNoticia(null); setNoticiaOriginal(null);
    setImagenPreview(null); setImagenFile(null); setEliminarImagenFlag(false);
    setModoUbicacion('existente'); setCoordsEvento(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData({ titulo:'',descripcion:'',contenido:'',tipo:'Noticia',categoria:'Académico',fechaEvento:'',ubicacionEvento:'',ubicacionWayfinding:'',destacado:false,activo:true });
  };

  const noticiasFiltradas = noticias.filter(n => {
    if (filtros.tipo && n.tipo !== filtros.tipo) return false;
    if (filtros.categoria && n.categoria !== filtros.categoria) return false;
    if (busqueda && !n.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(noticiasFiltradas.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const noticiasPaginadas = noticiasFiltradas.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  useEffect(() => { setPagina(1); }, [busqueda, filtros]);

  const formatFecha = (d) => new Date(d).toLocaleDateString('es-CL', { day:'numeric', month:'short', year:'numeric' });

  return (
    <div className="gn-wrap">

      {/* ── Cabecera ── */}
      <div className="gn-header">
        <p className="gn-subtitle">{noticias.length} publicaciones registradas</p>
        <div className="gn-header-right">
          {/* Buscador */}
          <div className="gn-search">
            <Search size={15} />
            <input type="text" placeholder="Buscar noticia…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {busqueda && <button onClick={() => setBusqueda('')}><X size={13} /></button>}
          </div>
          {/* Filtros */}
          <select className="gn-select" value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value }))}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="gn-select" value={filtros.categoria} onChange={e => setFiltros(p => ({ ...p, categoria: e.target.value }))}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Botón nueva */}
          <button className="gn-btn-add" onClick={() => setShowModal(true)}>
            <Plus size={17} /> Nueva noticia
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <div className="gn-skeleton">
          {[1,2,3,4].map(i => <div key={i} className="gn-skeleton-row" style={{ opacity: 1 - i * 0.15 }} />)}
        </div>
      ) : noticiasFiltradas.length === 0 ? (
        <div className="gn-state">
          <Newspaper size={36} opacity={.25} />
          <p>{busqueda || filtros.tipo || filtros.categoria ? 'Sin resultados para este filtro' : 'Aún no hay noticias publicadas'}</p>
        </div>
      ) : (
        <div className="gn-list">
          {noticiasPaginadas.map(n => (
            <div key={n._id} className="gn-card">
              {/* Thumbnail */}
              <div className="gn-card-thumb">
                {n.imagenUrl ? (
                  <img src={n.imagenUrl} alt={n.titulo} />
                ) : (
                  <div className="gn-card-thumb-empty"><ImageIcon size={20} /></div>
                )}
              </div>

              {/* Info */}
              <div className="gn-card-info">
                <div className="gn-card-top">
                  <span className="gn-badge-tipo" style={{ background:(TIPO_COLOR[n.tipo]||'#666')+'15', color:TIPO_COLOR[n.tipo]||'#666' }}>{n.tipo}</span>
                  <span className="gn-badge-cat">{n.categoria}</span>
                  {!n.activo && <span className="gn-badge-inactive">Inactivo</span>}
                </div>
                <h4 className="gn-card-title">{n.titulo}</h4>
                <p className="gn-card-desc">{n.descripcion}</p>
                <span className="gn-card-date"><Calendar size={12} /> {formatFecha(n.createdAt)}</span>
              </div>

              {/* Acciones */}
              <div className="gn-card-actions">
                <button
                  className={`gn-btn-star ${n.destacado ? 'gn-btn-star--on' : ''}`}
                  onClick={() => toggleDestacado(n)}
                  title={n.destacado ? 'Quitar destacado' : 'Destacar'}
                >
                  <Star size={16} fill={n.destacado ? 'currentColor' : 'none'} />
                </button>
                <button className="gn-btn-icon gn-btn-edit" onClick={() => handleEditar(n)} title="Editar">
                  <Edit2 size={15} />
                </button>
                <button className="gn-btn-icon gn-btn-delete" onClick={() => handleEliminar(n._id)} title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Paginador ── */}
      {!loading && totalPaginas > 1 && (
        <div className="gn-paginador">
          <button
            className="gn-pag-btn"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="gn-pag-pages">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`gn-pag-num ${n === paginaSegura ? 'gn-pag-num--active' : ''}`}
                onClick={() => setPagina(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            className="gn-pag-btn"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura === totalPaginas}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {showModal && (
        <div className="gu-modal-overlay">
          <div className="gu-modal gn-modal" onClick={e => e.stopPropagation()}>

            <div className="gu-modal-header">
              <div className="gu-modal-title-row">
                <div className="gu-modal-icon">{editingNoticia ? <Edit2 size={20}/> : <Plus size={20}/>}</div>
                <h3>{editingNoticia ? 'Editar noticia' : 'Nueva noticia'}</h3>
              </div>
              <button className="gu-modal-close" onClick={cerrarModal}><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="gu-form">

              {/* Título */}
              <div className="gu-field gu-field--full">
                <label>Título *</label>
                <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} required placeholder="Título de la noticia" />
              </div>

              {/* Tipo + Categoría */}
              <div className="gu-row">
                <div className="gu-field">
                  <label>Tipo *</label>
                  <select name="tipo" value={formData.tipo} onChange={handleInputChange} required>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="gu-field">
                  <label>Categoría *</label>
                  <select name="categoria" value={formData.categoria} onChange={handleInputChange} required>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div className="gu-field gu-field--full">
                <label>Descripción breve *</label>
                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={2} required placeholder="Resumen corto para la vista previa" />
              </div>

              {/* Contenido */}
              <div className="gu-field gu-field--full">
                <label>Contenido completo *</label>
                <textarea name="contenido" value={formData.contenido} onChange={handleInputChange} rows={5} required placeholder="Texto completo de la noticia" />
              </div>

              {/* Imagen */}
              <div className="gu-field gu-field--full">
                <label>Imagen de portada</label>
                <div className="gn-file-zone" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display:'none' }} />
                  {imagenPreview ? (
                    <div className="gn-file-preview">
                      <img src={imagenPreview} alt="Preview" />
                      <div className="gn-file-overlay">
                        <Upload size={18} /> Cambiar imagen
                      </div>
                    </div>
                  ) : (
                    <div className="gn-file-empty">
                      <Upload size={22} /><span>Haz clic para subir imagen</span><small>Máx. 10 MB · JPG, PNG, WebP</small>
                    </div>
                  )}
                </div>
                {imagenPreview && (
                  <button type="button" className="gn-btn-remove-img" onClick={e => { e.stopPropagation(); eliminarImagen(); }}>
                    <Trash2 size={13} /> Eliminar imagen
                  </button>
                )}
              </div>

              {/* Campos de Evento */}
              {formData.tipo === 'Evento' && (
                <div className="gu-field--full gn-evento-fields">
                  <div className="gu-row">
                    <div className="gu-field">
                      <label><Calendar size={13} /> Fecha del evento</label>
                      <input type="date" name="fechaEvento" value={formData.fechaEvento} onChange={handleInputChange} />
                    </div>
                    <div className="gu-field">
                      <label><MapPin size={13} /> Ubicación (texto)</label>
                      <input type="text" name="ubicacionEvento" value={formData.ubicacionEvento} onChange={handleInputChange} placeholder="Ej: Auditorio Campus" />
                    </div>
                  </div>

                  <div className="gu-field">
                    <label><MapPin size={13} /> Ubicación Wayfinding</label>
                    <div className="gn-radio-group">
                      <label><input type="radio" checked={modoUbicacion==='existente'} onChange={() => setModoUbicacion('existente')} /> Ubicación existente</label>
                      <label><input type="radio" checked={modoUbicacion==='mapa'} onChange={() => setModoUbicacion('mapa')} /> Fijar en el mapa</label>
                    </div>
                    {modoUbicacion === 'existente' ? (
                      <select name="ubicacionWayfinding" value={formData.ubicacionWayfinding||''} onChange={handleInputChange}>
                        <option value="">Seleccionar ubicación…</option>
                        {ubicaciones.map(ub => <option key={ub._id} value={ub._id}>{ub.nombre}</option>)}
                      </select>
                    ) : (
                      <div className="gn-mapa-picker">
                        <MapContainer center={CAMPUS_CENTER} zoom={16} minZoom={15} maxZoom={18} maxBounds={CAMPUS_BOUNDS} zoomControl={false} style={{ height:'100%',width:'100%' }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <LocationPicker onLocationSelect={setCoordsEvento} />
                          {coordsEvento && <Marker position={coordsEvento} />}
                        </MapContainer>
                        <p className="gn-mapa-hint">{coordsEvento ? '✓ Ubicación fijada' : 'Haz clic en el mapa para fijar la ubicación'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="gn-toggles gu-field--full">
                <button type="button" className={`gn-toggle ${formData.destacado ? 'gn-toggle--on' : ''}`} onClick={() => setFormData(p => ({ ...p, destacado: !p.destacado }))}>
                  <Star size={15} fill={formData.destacado ? 'currentColor' : 'none'} /> {formData.destacado ? 'Destacada' : 'Sin destacar'}
                </button>
                <button type="button" className={`gn-toggle ${formData.activo ? 'gn-toggle--active' : ''}`} onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}>
                  {formData.activo ? <Eye size={15} /> : <EyeOff size={15} />} {formData.activo ? 'Visible al público' : 'Oculto'}
                </button>
              </div>

              {/* Acciones */}
              <div className="gu-form-actions">
                <button type="button" className="gu-btn-cancel" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="gu-btn-save" disabled={!hasChanges()}>
                  {editingNoticia ? 'Guardar cambios' : 'Crear noticia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionNoticias;
