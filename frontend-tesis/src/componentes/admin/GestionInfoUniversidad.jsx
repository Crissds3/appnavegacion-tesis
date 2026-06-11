import { useState, useEffect } from 'react';
import { infoService, carrerasService, ubicacionesService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import {
  BookOpen, GraduationCap, Plus, Edit2, Trash2, X, Save,
  Link, MapPin, Clock, Target, Eye, EyeOff, Star, Phone,
  Building2, Search,
} from 'lucide-react';
import './GestionInfoUniversidad.css';

const iconMap = {
  BookOpen: <BookOpen size={20} />, Target: <Target size={20} />,
  Eye: <Eye size={20} />, Star: <Star size={20} />, Phone: <Phone size={20} />,
  Building2: <Building2 size={20} />, GraduationCap: <GraduationCap size={20} />,
  MapPin: <MapPin size={20} />, Clock: <Clock size={20} />,
};
const iconLabels = {
  BookOpen:'Libro / Historia', Target:'Objetivo / Misión', Eye:'Visión',
  Star:'Valores', Phone:'Contacto', Building2:'Edificio',
  GraduationCap:'Educación', MapPin:'Ubicación', Clock:'Horario',
};
const SECCIONES     = ['Historia','Misión','Visión','Valores','Contacto'];
const MODALIDADES   = ['Presencial','Semi-presencial','Online'];
const ICONOS        = Object.keys(iconMap);

const renderIcon = (name) => iconMap[name] || <span>{name}</span>;

const GestionInfoUniversidad = () => {
  const [activeTab,    setActiveTab]    = useState('info');
  const [loading,      setLoading]      = useState(true);
  const [secciones,    setSecciones]    = useState([]);
  const [carreras,     setCarreras]     = useState([]);
  const [ubicaciones,  setUbicaciones]  = useState([]);
  const [busqueda,     setBusqueda]     = useState('');

  const [showInfoModal,    setShowInfoModal]    = useState(false);
  const [editingSeccion,   setEditingSeccion]   = useState(null);
  const [infoFormOriginal, setInfoFormOriginal] = useState(null);
  const [infoForm, setInfoForm] = useState({
    seccion:'Historia', titulo:'', contenido:'', icono:'BookOpen', orden:0, activo:true,
  });

  const [showCarreraModal,    setShowCarreraModal]    = useState(false);
  const [editingCarrera,      setEditingCarrera]      = useState(null);
  const [carreraFormOriginal, setCarreraFormOriginal] = useState(null);
  const [carreraForm, setCarreraForm] = useState({
    nombre:'', descripcion:'', duracion:'', modalidad:'Presencial',
    enlaceOficial:'', ubicacion:'', orden:0, activo:true,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([cargarSecciones(), cargarCarreras(), cargarUbicaciones()]);
      setLoading(false);
    })();
  }, []);

  const cargarSecciones  = async () => { try { const r=await infoService.getAllSecciones(); if(r.success) setSecciones(r.data); } catch { showError('Error al cargar secciones'); } };
  const cargarCarreras   = async () => { try { const r=await carrerasService.getAllCarreras(); if(r.success) setCarreras(r.data); } catch { showError('Error al cargar carreras'); } };
  const cargarUbicaciones= async () => { try { const r=await ubicacionesService.getUbicacionesPublicas(); if(r.success) setUbicaciones(r.data); } catch {} };

  // ── Info general ─────────────────────────────────────────────
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await infoService.updateInfo(infoForm);
      if (r.success) { showSuccess(editingSeccion ? 'Sección actualizada' : 'Sección creada'); cargarSecciones(); cerrarInfoModal(); }
    } catch (err) { showError(err.message || 'Error al guardar sección'); }
  };
  const abrirInfoModal = (s=null) => {
    if (s) {
      const d = { seccion:s.seccion,titulo:s.titulo,contenido:s.contenido,icono:s.icono||'BookOpen',orden:s.orden,activo:s.activo };
      setEditingSeccion(s); setInfoForm(d); setInfoFormOriginal(d);
    } else {
      setEditingSeccion(null); setInfoFormOriginal(null);
      setInfoForm({ seccion:'Historia',titulo:'',contenido:'',icono:'BookOpen',orden:0,activo:true });
    }
    setShowInfoModal(true);
  };
  const cerrarInfoModal    = () => { setShowInfoModal(false); setEditingSeccion(null); };
  const hasInfoChanges     = () => !editingSeccion || !infoFormOriginal || JSON.stringify(infoForm) !== JSON.stringify(infoFormOriginal);

  // ── Carreras ──────────────────────────────────────────────────
  const handleCarreraSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCarrera) {
        const r = await carrerasService.updateCarrera(editingCarrera._id, carreraForm);
        if (r.success) { showSuccess('Carrera actualizada'); cargarCarreras(); cerrarCarreraModal(); }
      } else {
        const r = await carrerasService.createCarrera(carreraForm);
        if (r.success) { showSuccess('Carrera creada'); cargarCarreras(); cerrarCarreraModal(); }
      }
    } catch (err) { showError(err.message || 'Error al guardar carrera'); }
  };
  const abrirCarreraModal = (c=null) => {
    if (c) {
      const d = { nombre:c.nombre,descripcion:c.descripcion,duracion:c.duracion,modalidad:c.modalidad,enlaceOficial:c.enlaceOficial||'',ubicacion:c.ubicacion?._id||c.ubicacion||'',orden:c.orden,activo:c.activo };
      setEditingCarrera(c); setCarreraForm(d); setCarreraFormOriginal(d);
    } else {
      setEditingCarrera(null); setCarreraFormOriginal(null);
      setCarreraForm({ nombre:'',descripcion:'',duracion:'',modalidad:'Presencial',enlaceOficial:'',ubicacion:'',orden:0,activo:true });
    }
    setShowCarreraModal(true);
  };
  const cerrarCarreraModal  = () => { setShowCarreraModal(false); setEditingCarrera(null); };
  const hasCarreraChanges   = () => !editingCarrera || !carreraFormOriginal || JSON.stringify(carreraForm) !== JSON.stringify(carreraFormOriginal);

  const handleEliminarCarrera = async (id) => {
    const ok = await showConfirm({ title:'¿Eliminar carrera?', text:'Esta acción no se puede deshacer.', confirmText:'Sí, eliminar', cancelText:'Cancelar' });
    if (!ok) return;
    try {
      const r = await carrerasService.deleteCarrera(id);
      if (r.success) { showSuccess('Carrera eliminada'); cargarCarreras(); }
    } catch (err) { showError(err.message || 'Error al eliminar'); }
  };

  const carrerasFiltradas = carreras.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  // ── Skeleton ──────────────────────────────────────────────────
  const Skeleton = ({ n=3, h=100 }) => (
    <div className="gi-skeleton">
      {Array.from({length:n}).map((_,i) => (
        <div key={i} className="gi-skeleton-item" style={{ height:h, opacity:1-i*.18 }} />
      ))}
    </div>
  );

  return (
    <div className="gi-wrap">

      {/* ── Cabecera con tabs ── */}
      <div className="gi-header">
        <div className="gi-tabs">
          <button className={`gi-tab ${activeTab==='info' ? 'gi-tab--active':''}`} onClick={() => setActiveTab('info')}>
            <BookOpen size={16} /> Información General
          </button>
          <button className={`gi-tab ${activeTab==='carreras' ? 'gi-tab--active':''}`} onClick={() => setActiveTab('carreras')}>
            <GraduationCap size={16} /> Carreras
          </button>
        </div>
        <div className="gi-header-right">
          {activeTab === 'carreras' && (
            <div className="gn-search">
              <Search size={15} />
              <input type="text" placeholder="Buscar carrera…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              {busqueda && <button onClick={() => setBusqueda('')}><X size={13}/></button>}
            </div>
          )}
          <button className="gn-btn-add" onClick={() => activeTab==='info' ? abrirInfoModal() : abrirCarreraModal()}>
            <Plus size={17}/> {activeTab==='info' ? 'Nueva sección' : 'Nueva carrera'}
          </button>
        </div>
      </div>

      {/* ── Tab: Información General ── */}
      {activeTab === 'info' && (
        loading ? <Skeleton n={4} h={130} /> : (
          <div className="gi-secciones-grid">
            {secciones.length === 0 ? (
              <div className="gi-empty"><BookOpen size={32} opacity={.25}/><p>No hay secciones creadas</p></div>
            ) : secciones.map(s => (
              <div key={s._id} className="gi-seccion-card">
                <div className="gi-seccion-card-top">
                  <div className="gi-seccion-ic">{renderIcon(s.icono)}</div>
                  <div className="gi-seccion-meta">
                    <span className={`gi-status ${s.activo ? 'gi-status--on':'gi-status--off'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button className="gn-btn-icon gn-btn-edit" onClick={() => abrirInfoModal(s)} title="Editar">
                    <Edit2 size={14}/>
                  </button>
                </div>
                <h4 className="gi-seccion-title">{s.titulo}</h4>
                <p className="gi-seccion-content">
                  {s.contenido.length > 130 ? s.contenido.slice(0,130)+'…' : s.contenido}
                </p>
                <div className="gi-seccion-footer">
                  <span className="gi-seccion-type">{s.seccion}</span>
                  <span className="gi-seccion-orden">Orden {s.orden}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Carreras ── */}
      {activeTab === 'carreras' && (
        loading ? <Skeleton n={4} h={110} /> : (
          <div className="gi-carreras-list">
            {carrerasFiltradas.length === 0 ? (
              <div className="gi-empty"><GraduationCap size={32} opacity={.25}/><p>{busqueda ? 'Sin resultados' : 'No hay carreras creadas'}</p></div>
            ) : carrerasFiltradas.map(c => (
              <div key={c._id} className="gi-carrera-card">
                <div className="gi-carrera-ic"><GraduationCap size={22}/></div>
                <div className="gi-carrera-info">
                  <div className="gi-carrera-top">
                    <h4 className="gi-carrera-name">{c.nombre}</h4>
                    <span className={`gi-status ${c.activo ? 'gi-status--on':'gi-status--off'}`}>{c.activo ? 'Activa':'Inactiva'}</span>
                  </div>
                  <div className="gi-carrera-meta">
                    {c.duracion && <span><Clock size={12}/> {c.duracion}</span>}
                    <span><MapPin size={12}/> {c.modalidad}</span>
                    {c.ubicacion?.nombre && <span><Building2 size={12}/> {c.ubicacion.nombre}</span>}
                  </div>
                </div>
                <div className="gi-carrera-actions">
                  {c.enlaceOficial && (
                    <a href={c.enlaceOficial} target="_blank" rel="noopener noreferrer" className="gn-btn-icon" title="Ver enlace oficial" style={{ color:'#1565C0' }}>
                      <Link size={14}/>
                    </a>
                  )}
                  <button className="gn-btn-icon gn-btn-edit" onClick={() => abrirCarreraModal(c)} title="Editar"><Edit2 size={14}/></button>
                  <button className="gn-btn-icon gn-btn-delete" onClick={() => handleEliminarCarrera(c._id)} title="Eliminar"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Modal Información General ── */}
      {showInfoModal && (
        <div className="gu-modal-overlay">
          <div className="gu-modal" onClick={e => e.stopPropagation()}>
            <div className="gu-modal-header">
              <div className="gu-modal-title-row">
                <div className="gu-modal-icon">{editingSeccion ? <Edit2 size={20}/> : <Plus size={20}/>}</div>
                <h3>{editingSeccion ? 'Editar sección' : 'Nueva sección'}</h3>
              </div>
              <button className="gu-modal-close" onClick={cerrarInfoModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleInfoSubmit} className="gu-form">
              <div className="gu-row">
                <div className="gu-field">
                  <label>Tipo de sección</label>
                  <select name="seccion" value={infoForm.seccion} onChange={e => setInfoForm(p=>({...p,seccion:e.target.value}))} required disabled={!!editingSeccion}>
                    {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="gu-field">
                  <label>Ícono</label>
                  <div className="gi-icon-row">
                    <select name="icono" value={infoForm.icono} onChange={e => setInfoForm(p=>({...p,icono:e.target.value}))}>
                      {ICONOS.map(ic => <option key={ic} value={ic}>{iconLabels[ic]||ic}</option>)}
                    </select>
                    <div className="gi-icon-preview">{renderIcon(infoForm.icono)}</div>
                  </div>
                </div>
              </div>
              <div className="gu-field gu-field--full">
                <label>Título *</label>
                <input type="text" name="titulo" value={infoForm.titulo} onChange={e => setInfoForm(p=>({...p,titulo:e.target.value}))} required placeholder="Título de la sección" />
              </div>
              <div className="gu-field gu-field--full">
                <label>Contenido *</label>
                <textarea name="contenido" value={infoForm.contenido} onChange={e => setInfoForm(p=>({...p,contenido:e.target.value}))} rows={5} required placeholder="Contenido de la sección…" />
              </div>
              <div className="gu-row">
                <div className="gu-field">
                  <label>Orden</label>
                  <input type="number" name="orden" value={infoForm.orden} onChange={e => setInfoForm(p=>({...p,orden:+e.target.value}))} />
                </div>
                <div className="gu-field">
                  <label>Visibilidad</label>
                  <button type="button" className={`gu-toggle ${infoForm.activo ? 'gu-toggle--on':''}`} onClick={() => setInfoForm(p=>({...p,activo:!p.activo}))}>
                    {infoForm.activo ? <><Eye size={15}/> Visible</> : <><EyeOff size={15}/> Oculto</>}
                  </button>
                </div>
              </div>
              <div className="gu-form-actions">
                <button type="button" className="gu-btn-cancel" onClick={cerrarInfoModal}>Cancelar</button>
                <button type="submit" className="gu-btn-save" disabled={!hasInfoChanges()}>
                  <Save size={15}/> {editingSeccion ? 'Guardar cambios' : 'Crear sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Carrera ── */}
      {showCarreraModal && (
        <div className="gu-modal-overlay">
          <div className="gu-modal" onClick={e => e.stopPropagation()}>
            <div className="gu-modal-header">
              <div className="gu-modal-title-row">
                <div className="gu-modal-icon"><GraduationCap size={20}/></div>
                <h3>{editingCarrera ? 'Editar carrera' : 'Nueva carrera'}</h3>
              </div>
              <button className="gu-modal-close" onClick={cerrarCarreraModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleCarreraSubmit} className="gu-form">
              <div className="gu-field gu-field--full">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={carreraForm.nombre} onChange={e => setCarreraForm(p=>({...p,nombre:e.target.value}))} required placeholder="Ej: Ingeniería Civil en Computación" />
              </div>
              <div className="gu-field gu-field--full">
                <label>Descripción *</label>
                <textarea name="descripcion" value={carreraForm.descripcion} onChange={e => setCarreraForm(p=>({...p,descripcion:e.target.value}))} rows={3} required placeholder="Perfil de egreso, objetivos…" />
              </div>
              <div className="gu-row">
                <div className="gu-field">
                  <label>Duración *</label>
                  <input type="text" value={carreraForm.duracion} onChange={e => setCarreraForm(p=>({...p,duracion:e.target.value}))} required placeholder="Ej: 10 semestres" />
                </div>
                <div className="gu-field">
                  <label>Modalidad *</label>
                  <select value={carreraForm.modalidad} onChange={e => setCarreraForm(p=>({...p,modalidad:e.target.value}))} required>
                    {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="gu-field gu-field--full">
                <label>Enlace oficial *</label>
                <input type="url" value={carreraForm.enlaceOficial} onChange={e => setCarreraForm(p=>({...p,enlaceOficial:e.target.value}))} required placeholder="https://www.utalca.cl/carreras/…" />
              </div>
              <div className="gu-field gu-field--full">
                <label>Edificio / Ubicación</label>
                <select value={carreraForm.ubicacion} onChange={e => setCarreraForm(p=>({...p,ubicacion:e.target.value}))}>
                  <option value="">Selecciona una ubicación…</option>
                  {ubicaciones.map(ub => <option key={ub._id} value={ub._id}>{ub.nombre}</option>)}
                </select>
              </div>
              <div className="gu-row">
                <div className="gu-field">
                  <label>Orden</label>
                  <input type="number" value={carreraForm.orden} onChange={e => setCarreraForm(p=>({...p,orden:+e.target.value}))} />
                </div>
                <div className="gu-field">
                  <label>Estado</label>
                  <button type="button" className={`gu-toggle ${carreraForm.activo ? 'gu-toggle--on':''}`} onClick={() => setCarreraForm(p=>({...p,activo:!p.activo}))}>
                    {carreraForm.activo ? <><Eye size={15}/> Activa</> : <><EyeOff size={15}/> Inactiva</>}
                  </button>
                </div>
              </div>
              <div className="gu-form-actions">
                <button type="button" className="gu-btn-cancel" onClick={cerrarCarreraModal}>Cancelar</button>
                <button type="submit" className="gu-btn-save" disabled={!hasCarreraChanges()}>
                  <Save size={15}/> {editingCarrera ? 'Guardar cambios' : 'Crear carrera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionInfoUniversidad;
