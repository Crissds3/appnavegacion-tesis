import { useState, useEffect } from 'react';
import { infoService, carrerasService, ubicacionesService } from '../../servicios/api';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import { 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Link, 
  MapPin, 
  Clock, 
  Target, 
  Eye, 
  EyeOff,
  Star, 
  Phone, 
  Building2,
  MoreVertical,
  Search
} from 'lucide-react';
import './GestionInfoUniversidad.css';

const GestionInfoUniversidad = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  // Estados para información general
  const [secciones, setSecciones] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState(null);
  const [infoForm, setInfoForm] = useState({
    seccion: 'Historia',
    titulo: '',
    contenido: '',
    icono: 'BookOpen',
    orden: 0,
    activo: true
  });
  const [infoFormOriginal, setInfoFormOriginal] = useState(null);

  // Estados para carreras
  const [carreras, setCarreras] = useState([]);
  const [showCarreraModal, setShowCarreraModal] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState(null);
  const [carreraForm, setCarreraForm] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    modalidad: 'Presencial',
    enlaceOficial: '',
    ubicacion: '',
    orden: 0,
    activo: true
  });
  const [carreraFormOriginal, setCarreraFormOriginal] = useState(null);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const seccionesDisponibles = ['Historia', 'Misión', 'Visión', 'Valores', 'Contacto'];
  
  // Mapeo de iconos para uso interno y visualización
  const iconMap = {
    'BookOpen': <BookOpen size={20} />,
    'Target': <Target size={20} />,
    'Eye': <Eye size={20} />,
    'Star': <Star size={20} />,
    'Phone': <Phone size={20} />,
    'Building2': <Building2 size={20} />,
    'GraduationCap': <GraduationCap size={20} />,
    'MapPin': <MapPin size={20} />,
    'Clock': <Clock size={20} />
  };

  // Etiquetas en español para el selector
  const iconLabels = {
    'BookOpen': 'Libro / Historia',
    'Target': 'Objetivo / Misión',
    'Eye': 'Visión',
    'Star': 'Valores / Destacado',
    'Phone': 'Contacto / Teléfono',
    'Building2': 'Edificio / Instalaciones',
    'GraduationCap': 'Educación / Graduación',
    'MapPin': 'Ubicación / Mapa',
    'Clock': 'Horario / Tiempo'
  };

  const iconosDisponibles = Object.keys(iconMap);
  const modalidadesDisponibles = ['Presencial', 'Semi-presencial', 'Online'];

  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      await Promise.all([
        cargarSecciones(),
        cargarCarreras(),
        cargarUbicaciones()
      ]);
      setLoading(false);
    };
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarUbicaciones = async () => {
    try {
      const response = await ubicacionesService.getUbicacionesPublicas();
      if (response.success) {
        setUbicaciones(response.data);
      }
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  // Helper para renderizar iconos (soporta emojis antiguos y nuevos iconos Lucide)
  const renderIcon = (iconName) => {
    if (iconMap[iconName]) {
      return iconMap[iconName];
    }
    // Fallback para emojis antiguos o texto
    return <span className="emoji-icon">{iconName}</span>;
  };

  // ============ FUNCIONES INFORMACIÓN GENERAL ============
  const cargarSecciones = async () => {
    try {
      const response = await infoService.getAllSecciones();
      if (response.success) {
        setSecciones(response.data);
      }
    } catch (err) {
      showError('Error al cargar secciones');
      console.error(err);
    }
  };

  const handleInfoInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInfoForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await infoService.updateInfo(infoForm);
      if (response.success) {
        showSuccess(
          editingSeccion ? 'Sección actualizada exitosamente' : 'Sección creada exitosamente'
        );
        cargarSecciones();
        cerrarInfoModal();
      }
    } catch (error) {
      showError(error.message || 'Error al guardar sección');
    }
  };

  const abrirInfoModal = (seccion = null) => {
    if (seccion) {
      setEditingSeccion(seccion);
      const initialData = {
        seccion: seccion.seccion,
        titulo: seccion.titulo,
        contenido: seccion.contenido,
        icono: seccion.icono || 'BookOpen',
        orden: seccion.orden,
        activo: seccion.activo
      };
      setInfoForm(initialData);
      setInfoFormOriginal(initialData);
    } else {
      setEditingSeccion(null);
      setInfoFormOriginal(null);
      setInfoForm({
        seccion: 'Historia',
        titulo: '',
        contenido: '',
        icono: 'BookOpen',
        orden: 0,
        activo: true
      });
    }
    setShowInfoModal(true);
  };

  const cerrarInfoModal = () => {
    setShowInfoModal(false);
    setEditingSeccion(null);
  };

  // ============ FUNCIONES CARRERAS ============
  const cargarCarreras = async () => {
    try {
      const response = await carrerasService.getAllCarreras();
      if (response.success) {
        setCarreras(response.data);
      }
    } catch (err) {
      showError('Error al cargar carreras');
      console.error(err);
    }
  };

  const handleCarreraInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCarreraForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCarreraSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCarrera) {
        const response = await carrerasService.updateCarrera(editingCarrera._id, carreraForm);
        if (response.success) {
          showSuccess('Carrera actualizada exitosamente');
          cargarCarreras();
          cerrarCarreraModal();
        }
      } else {
        const response = await carrerasService.createCarrera(carreraForm);
        if (response.success) {
          showSuccess('Carrera creada exitosamente');
          cargarCarreras();
          cerrarCarreraModal();
        }
      }
    } catch (error) {
      showError(error.message || 'Error al guardar carrera');
    }
  };

  const abrirCarreraModal = (carrera = null) => {
    if (carrera) {
      setEditingCarrera(carrera);
      const initialData = {
        nombre: carrera.nombre,
        descripcion: carrera.descripcion,
        duracion: carrera.duracion,
        modalidad: carrera.modalidad,
        enlaceOficial: carrera.enlaceOficial || '',
        ubicacion: carrera.ubicacion?._id || carrera.ubicacion || '',
        orden: carrera.orden,
        activo: carrera.activo
      };
      setCarreraForm(initialData);
      setCarreraFormOriginal(initialData);
    } else {
      setEditingCarrera(null);
      setCarreraFormOriginal(null);
      setCarreraForm({
        nombre: '',
        descripcion: '',
        duracion: '',
        modalidad: 'Presencial',
        enlaceOficial: '',
        ubicacion: '',
        orden: 0,
        activo: true
      });
    }
    setShowCarreraModal(true);
  };

  const cerrarCarreraModal = () => {
    setShowCarreraModal(false);
    setEditingCarrera(null);
  };

  const handleEliminarCarrera = async (id) => {
    const confirmado = await showConfirm({
      title: '¿Eliminar carrera?',
      text: '¿Estás seguro de eliminar esta carrera?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmado) return;

    try {
      const response = await carrerasService.deleteCarrera(id);
      if (response.success) {
        showSuccess('Carrera eliminada exitosamente');
        cargarCarreras();
      }
    } catch (error) {
      showError(error.message || 'Error al eliminar carrera');
    }
  };

  const hasInfoChanges = () => {
    if (!editingSeccion) return true;
    if (!infoFormOriginal) return true;
    return JSON.stringify(infoForm) !== JSON.stringify(infoFormOriginal);
  };

  const hasCarreraChanges = () => {
    if (!editingCarrera) return true;
    if (!carreraFormOriginal) return true;
    return JSON.stringify(carreraForm) !== JSON.stringify(carreraFormOriginal);
  };

  return (
    <div className="gestion-info-container">

        <div className="tabs-navigation">
          <button
            className={`tab-nav-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <BookOpen size={18} />
            Información General
          </button>
          <button
            className={`tab-nav-button ${activeTab === 'carreras' ? 'active' : ''}`}
            onClick={() => setActiveTab('carreras')}
          >
            <GraduationCap size={18} />
            Carreras
          </button>
          
          <div style={{ marginLeft: 'auto' }}>
            {activeTab === 'info' ? (
              <button className="btn-crear-nuevo" onClick={() => abrirInfoModal()}>
                <Plus size={18} />
                Nueva Sección
              </button>
            ) : (
              <button className="btn-crear-nuevo" onClick={() => abrirCarreraModal()}>
                <Plus size={18} />
                Nueva Carrera
              </button>
            )}
          </div>
        </div>

        {/* TAB INFORMACIÓN GENERAL */}
        {activeTab === 'info' && (
          <div className="tab-content fade-in">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Cargando información...</p>
              </div>
            ) : (
              <div className="secciones-grid">
                {secciones.map((seccion) => (
                  <div key={seccion._id} className="info-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '22px' }}>
                      <div className="info-card-icon">
                        {renderIcon(seccion.icono)}
                      </div>
                      <div className="seccion-actions-top" style={{ marginTop: '22px' }}>
                        <button
                          className="btn-icon-action edit"
                          onClick={() => abrirInfoModal(seccion)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="info-card-content">
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: '#17120F' }}>{seccion.titulo}</h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#6E675F', lineHeight: 1.6 }}>
                        {seccion.contenido.length > 120 
                          ? seccion.contenido.substring(0, 120) + '...' 
                          : seccion.contenido}
                      </p>

                      <div className="seccion-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(20,15,12,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`status-badge ${seccion.activo ? 'active' : 'inactive'}`}>
                          {seccion.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="orden-badge">Orden: {seccion.orden}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CARRERAS */}
        {activeTab === 'carreras' && (
          <div className="tab-content fade-in">
            <div className="acciones-header" style={{ justifyContent: 'flex-start', marginBottom: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="ar-buscador-wrap" style={{ marginBottom: 0 }}>
                  <Search size={15} className="ar-buscador-icon" />
                  <input 
                    type="text" 
                    placeholder="Buscar carrera..." 
                    className="ar-buscador" 
                    value={busqueda || ''}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button className="ar-buscador-clear" onClick={() => setBusqueda('')}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                <span className="contador-badge">{carreras.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).length} carreras</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Cargando carreras...</p>
              </div>
            ) : (
              <div className="carreras-grid">
                {carreras.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((carrera) => (
                  <div key={carrera._id} className="carrera-card-estudiante">
                    <div className="carrera-card-header">
                      <div className="carrera-icon-wrapper">
                        <GraduationCap size={24} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#17120F', lineHeight: 1.3 }}>{carrera.nombre}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`status-dot ${carrera.activo ? 'active' : 'inactive'}`} title={carrera.activo ? 'Activo' : 'Inactivo'}></span>
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>{carrera.activo ? 'Activa' : 'Inactiva'}</span>
                        </div>
                      </div>
                      <div className="carrera-actions-col">
                        <a 
                          href={carrera.enlaceOficial} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-icon-action link"
                          title="Ver enlace oficial"
                        >
                          <Link size={18} />
                        </a>
                        <button
                          className="btn-icon-action edit"
                          onClick={() => abrirCarreraModal(carrera)}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-icon-action delete"
                          onClick={() => handleEliminarCarrera(carrera._id)}
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="carrera-card-body">
                      <div className="carrera-meta">
                        <div className="meta-item">
                          <Clock size={16} />
                          <span>{carrera.duracion}</span>
                        </div>
                        <div className="meta-item">
                          <MapPin size={16} />
                          <span>{carrera.modalidad}</span>
                        </div>
                        {carrera.ubicacion && (
                          <div className="meta-item">
                            <Building2 size={16} />
                            <span>{carrera.ubicacion.nombre || 'Ubicación asignada'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* MODAL INFORMACIÓN GENERAL */}
      {showInfoModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-bg">
                  {editingSeccion ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h3>{editingSeccion ? 'Editar sección' : 'Nueva sección'}</h3>
              </div>
              <button className="btn-cerrar" onClick={cerrarInfoModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleInfoSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tipo de sección</label>
                  <select
                    name="seccion"
                    value={infoForm.seccion}
                    onChange={handleInfoInputChange}
                    required
                    disabled={editingSeccion !== null}
                    className="form-select"
                  >
                    {seccionesDisponibles.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Icono representativo</label>
                  <div className="icon-selector">
                    <select
                      name="icono"
                      value={infoForm.icono}
                      onChange={handleInfoInputChange}
                      className="form-select"
                    >
                      {iconosDisponibles.map(icono => (
                        <option key={icono} value={icono}>{iconLabels[icono] || icono}</option>
                      ))}
                    </select>
                    <div className="icon-preview">
                      {renderIcon(infoForm.icono)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  name="titulo"
                  value={infoForm.titulo}
                  onChange={handleInfoInputChange}
                  required
                  className="form-input"
                  placeholder="Ingrese el título de la sección"
                />
              </div>

              <div className="form-group">
                <label>Contenido</label>
                <textarea
                  name="contenido"
                  value={infoForm.contenido}
                  onChange={handleInfoInputChange}
                  rows="6"
                  required
                  className="form-textarea"
                  placeholder="Escriba el contenido detallado..."
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Orden de visualización</label>
                  <input
                    type="number"
                    name="orden"
                    value={infoForm.orden}
                    onChange={handleInfoInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <label className={`checkbox-card-modal ${infoForm.activo ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={infoForm.activo}
                      onChange={handleInfoInputChange}
                    />
                    <div className="checkbox-content">
                      {infoForm.activo ? <Eye size={20} /> : <EyeOff size={20} />}
                      <div>
                        <span className="checkbox-title">Visible al público</span>
                        <span className="checkbox-desc">La sección será visible en la app</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-unique-cancel" onClick={cerrarInfoModal}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-unique-save"
                  disabled={!hasInfoChanges()}
                  style={{ opacity: !hasInfoChanges() ? 0.5 : 1, cursor: !hasInfoChanges() ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={18} />
                  {editingSeccion ? 'Guardar cambios' : 'Crear sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARRERA */}
      {showCarreraModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-bg">
                  <GraduationCap size={20} />
                </div>
                <h3>{editingCarrera ? 'Editar carrera' : 'Nueva carrera'}</h3>
              </div>
              <button className="btn-cerrar" onClick={cerrarCarreraModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCarreraSubmit} className="modal-form">
              <div className="form-section-title">
                <h4>Información académica</h4>
              </div>
              
              <div className="form-group">
                <label>Nombre de la carrera</label>
                <input
                  type="text"
                  name="nombre"
                  value={carreraForm.nombre}
                  onChange={handleCarreraInputChange}
                  placeholder="Ej: Ingeniería Civil en Computación"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={carreraForm.descripcion}
                  onChange={handleCarreraInputChange}
                  rows="4"
                  placeholder="Descripción breve de la carrera, perfil de egreso, etc."
                  required
                  className="form-textarea"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Duración</label>
                  <div className="input-with-icon">
                    <Clock size={18} className="input-icon" />
                    <input
                      type="text"
                      name="duracion"
                      value={carreraForm.duracion}
                      onChange={handleCarreraInputChange}
                      placeholder="Ej: 10 semestres"
                      required
                      className="form-input pl-10"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Modalidad</label>
                  <div className="input-with-icon">
                    <select
                      name="modalidad"
                      value={carreraForm.modalidad}
                      onChange={handleCarreraInputChange}
                      required
                      className="form-select"
                    >
                      {modalidadesDisponibles.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Enlace Oficial</label>
                <div className="input-with-icon">
                  <Link size={18} className="input-icon" />
                  <input
                    type="url"
                    name="enlaceOficial"
                    value={carreraForm.enlaceOficial}
                    onChange={handleCarreraInputChange}
                    placeholder="https://www.utalca.cl/carreras/..."
                    required
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ubicación (Edificio/Departamento)</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <select
                    name="ubicacion"
                    value={carreraForm.ubicacion}
                    onChange={handleCarreraInputChange}
                    className="form-select pl-10"
                  >
                    <option value="">Seleccione una ubicación...</option>
                    {ubicaciones.map(ub => (
                      <option key={ub._id} value={ub._id}>{ub.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Orden</label>
                  <input
                    type="number"
                    name="orden"
                    value={carreraForm.orden}
                    onChange={handleCarreraInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <label className={`checkbox-card-modal ${carreraForm.activo ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={carreraForm.activo}
                      onChange={handleCarreraInputChange}
                    />
                    <div className="checkbox-content">
                      {carreraForm.activo ? <Eye size={20} /> : <EyeOff size={20} />}
                      <div>
                        <span className="checkbox-title">Carrera activa</span>
                        <span className="checkbox-desc">Visible en el catálogo de carreras</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-unique-cancel" onClick={cerrarCarreraModal}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-unique-save"
                  disabled={!hasCarreraChanges()}
                  style={{ opacity: !hasCarreraChanges() ? 0.5 : 1, cursor: !hasCarreraChanges() ? 'not-allowed' : 'pointer' }}
                >
                  <Save size={18} />
                  {editingCarrera ? 'Guardar Cambios' : 'Crear Carrera'}
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
