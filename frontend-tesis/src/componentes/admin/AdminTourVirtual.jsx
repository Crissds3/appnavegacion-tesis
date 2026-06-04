import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Box, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { showConfirm, showError, showSuccess } from '../../utils/sweetAlert';
import { tourVirtualService } from '../../servicios/api';
import './AdminTourVirtual.css';

const initialForm = { nombre: '', descripcion: '', archivo: null };

const AdminTourVirtual = () => {
  const [formData,         setFormData]         = useState(initialForm);
  const [previewUrl,       setPreviewUrl]        = useState(null);   // blob URL para preview
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [modelos,          setModelos]           = useState([]);
  const [isLoadingModelos, setIsLoadingModelos]  = useState(false);
  const [listError,        setListError]         = useState('');
  const [showForm,         setShowForm]          = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;

    // Revocar URL anterior si existe
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }

    if (!file) { setFormData(p => ({ ...p, archivo: null })); return; }

    const isGlb = file.name.toLowerCase().endsWith('.glb') || file.type === 'model/gltf-binary';
    if (!isGlb) {
      showError('Solo se permiten archivos .glb');
      e.target.value = '';
      setFormData(p => ({ ...p, archivo: null }));
      return;
    }

    // Crear URL temporal para previsualización
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData(p => ({ ...p, archivo: file }));
  };

  // Limpiar URL al desmontar
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const cargarModelos = async () => {
    try {
      setIsLoadingModelos(true); setListError('');
      const res = await tourVirtualService.getEdificiosAdmin();
      if (res.success) setModelos(res.data);
      else setListError(res.message || 'No se pudieron cargar los modelos');
    } catch (e) { setListError(e.message || 'Error al cargar los modelos'); }
    finally { setIsLoadingModelos(false); }
  };

  useEffect(() => { cargarModelos(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.descripcion.trim()) { showError('Completa nombre y descripción'); return; }
    if (!formData.archivo) { showError('Selecciona un archivo .glb'); return; }
    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('nombre',      formData.nombre.trim());
      payload.append('descripcion', formData.descripcion.trim());
      payload.append('modelo',      formData.archivo);
      const res = await tourVirtualService.createEdificio(payload);
      if (res.success) {
        showSuccess('Edificio agregado al Minitour');
        if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
        setFormData(initialForm);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowForm(false);
        cargarModelos();
      } else { showError(res.message || 'No se pudo guardar el edificio'); }
    } catch (e) { showError(e.message || 'Error al subir el modelo'); }
    finally { setIsSubmitting(false); }
  };

  const cancelarForm = () => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setFormData(initialForm);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title: 'Eliminar modelo', text: 'Esta acción eliminará el modelo del Minitour.', confirmText: 'Sí, eliminar', cancelText: 'Cancelar' });
    if (!ok) return;
    try {
      const res = await tourVirtualService.deleteEdificio(id);
      if (res.success) { showSuccess('Modelo eliminado'); cargarModelos(); }
      else showError(res.message || 'No se pudo eliminar');
    } catch (e) { showError(e.message || 'Error al eliminar el modelo'); }
  };

  return (
    <div className="atv-wrap">

      {/* Cabecera */}
      <div className="atv-header">
        <p className="atv-subtitle">{modelos.length} modelos 3D disponibles en la galería pública</p>
        <button className="atv-btn-add" onClick={() => setShowForm(p => !p)}>
          <Plus size={17} /> {showForm ? 'Cancelar' : 'Agregar edificio'}
        </button>
      </div>

      {/* Formulario + preview */}
      {showForm && (
        <div className="atv-form-card">
          <h3 className="atv-form-title">Nuevo edificio 3D</h3>
          <div className="atv-form-layout">

            {/* Preview model-viewer */}
            <div className="atv-preview-panel">
              {previewUrl ? (
                <model-viewer
                  class="atv-model-viewer"
                  src={previewUrl}
                  auto-rotate
                  camera-controls
                  shadow-intensity="0.6"
                  exposure="0.9"
                  camera-orbit="0deg 75deg 105%"
                  style={{ width: '100%', height: '100%', background: 'transparent' }}
                />
              ) : (
                <div className="atv-preview-empty">
                  <Box size={36} />
                  <span>La vista previa aparecerá aquí al seleccionar el .glb</span>
                </div>
              )}
            </div>

            {/* Formulario */}
            <form className="atv-form" onSubmit={handleSubmit}>
              <div className="atv-field">
                <label>Nombre del edificio *</label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleInputChange} placeholder="Ej. Biblioteca Central" />
              </div>
              <div className="atv-field">
                <label>Descripción *</label>
                <textarea name="descripcion" rows={3} value={formData.descripcion}
                  onChange={handleInputChange} placeholder="Breve descripción del edificio." />
              </div>
              <div className="atv-field">
                <label>Modelo 3D (.glb) *</label>
                <div className="atv-file-zone">
                  <input type="file" id="atv-file" accept=".glb,model/gltf-binary"
                    onChange={handleFileChange} ref={fileInputRef} className="atv-file-input" />
                  <label htmlFor="atv-file" className="atv-file-label">
                    <Upload size={20} />
                    <span>{formData.archivo ? formData.archivo.name : 'Seleccionar archivo .glb'}</span>
                    {!formData.archivo && <small>Solo .glb · Máx. 100 MB</small>}
                  </label>
                </div>
              </div>
              <div className="atv-form-actions">
                <button type="button" className="atv-btn-cancel" onClick={cancelarForm}>Cancelar</button>
                <button type="submit" className="atv-btn-save" disabled={isSubmitting}>
                  {isSubmitting ? 'Subiendo…' : <><Upload size={15} /> Guardar edificio</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de modelos — mismo estilo que TourVirtual público */}
      {isLoadingModelos ? (
        <div className="atv-state"><div className="atv-spinner" /><p>Cargando modelos…</p></div>
      ) : listError ? (
        <div className="atv-state atv-state--error"><p>{listError}</p></div>
      ) : modelos.length === 0 ? (
        <div className="atv-state">
          <Box size={36} opacity={.25} />
          <p>Aún no hay modelos cargados.<br/>Agrega el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="atv-grid">
          {modelos.map(ed => (
            <article key={ed._id} className="atv-card">
              {/* Viewport con model-viewer real */}
              <div className="atv-card-viewport">
                {ed.modeloUrl ? (
                  <model-viewer
                    class="atv-mv"
                    src={ed.modeloUrl}
                    auto-rotate
                    auto-rotate-delay="0"
                    rotation-per-second="30deg"
                    interaction-prompt="none"
                    disable-zoom
                    shadow-intensity="0.7"
                    exposure="0.9"
                    camera-orbit="0deg 75deg 105%"
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                  />
                ) : (
                  <div className="atv-no-model"><Box size={32} opacity={.35} /></div>
                )}
                <span className={`atv-card-status ${ed.activo ? 'atv-card-status--on' : 'atv-card-status--off'}`}>
                  {ed.activo ? <><CheckCircle size={11} /> Activo</> : <><XCircle size={11} /> Inactivo</>}
                </span>
              </div>

              {/* Cuerpo */}
              <div className="atv-card-body">
                <h4 className="atv-card-name">{ed.nombre}</h4>
                {ed.descripcion && <p className="atv-card-desc">{ed.descripcion}</p>}
                <div className="atv-card-footer">
                  <button className="atv-btn-delete" onClick={() => handleDelete(ed._id)}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTourVirtual;
