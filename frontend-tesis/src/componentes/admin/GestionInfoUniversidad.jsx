import { useState, useEffect } from 'react';
import { infoService, carrerasService } from '../../servicios/api';
import './GestionInfoUniversidad.css';

const GestionInfoUniversidad = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Estados para información general
  const [secciones, setSecciones] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState(null);
  const [infoForm, setInfoForm] = useState({
    seccion: 'Historia',
    titulo: '',
    contenido: '',
    icono: '📚',
    orden: 0,
    activo: true
  });

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

  const seccionesDisponibles = ['Historia', 'Misión', 'Visión', 'Valores', 'Contacto'];
  const iconosDisponibles = ['📚', '🎯', '👁️', '⭐', '📞', '🏛️', '🎓'];
  const modalidadesDisponibles = ['Presencial', 'Semi-presencial', 'Online'];

  useEffect(() => {
    if (activeTab === 'info') {
      cargarSecciones();
    } else {
      cargarCarreras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  // ============ FUNCIONES INFORMACIÓN GENERAL ============
  const cargarSecciones = async () => {
    try {
      setLoading(true);
      const response = await infoService.getAllSecciones();
      if (response.success) {
        setSecciones(response.data);
      }
    } catch (err) {
      mostrarMensaje('Error al cargar secciones', 'error');
      console.error(err);
    } finally {
      setLoading(false);
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
        mostrarMensaje(
          editingSeccion ? 'Sección actualizada exitosamente' : 'Sección creada exitosamente',
          'success'
        );
        cargarSecciones();
        cerrarInfoModal();
      }
    } catch (error) {
      mostrarMensaje(error.message || 'Error al guardar sección', 'error');
    }
  };

  const abrirInfoModal = (seccion = null) => {
    if (seccion) {
      setEditingSeccion(seccion);
      setInfoForm({
        seccion: seccion.seccion,
        titulo: seccion.titulo,
        contenido: seccion.contenido,
        icono: seccion.icono,
        orden: seccion.orden,
        activo: seccion.activo
      });
    } else {
      setEditingSeccion(null);
      setInfoForm({
        seccion: 'Historia',
        titulo: '',
        contenido: '',
        icono: '📚',
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
      setLoading(true);
      const response = await carrerasService.getAllCarreras();
      if (response.success) {
        setCarreras(response.data);
      }
    } catch (err) {
      mostrarMensaje('Error al cargar carreras', 'error');
      console.error(err);
    } finally {
      setLoading(false);
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
          mostrarMensaje('Carrera actualizada exitosamente', 'success');
          cargarCarreras();
          cerrarCarreraModal();
        }
      } else {
        const response = await carrerasService.createCarrera(carreraForm);
        if (response.success) {
          mostrarMensaje('Carrera creada exitosamente', 'success');
          cargarCarreras();
          cerrarCarreraModal();
        }
      }
    } catch (error) {
      mostrarMensaje(error.message || 'Error al guardar carrera', 'error');
    }
  };

  const abrirCarreraModal = (carrera = null) => {
    if (carrera) {
      setEditingCarrera(carrera);
      setCarreraForm({
        nombre: carrera.nombre,
        descripcion: carrera.descripcion,
        duracion: carrera.duracion,
        modalidad: carrera.modalidad,
        enlaceOficial: carrera.enlaceOficial || '',
        ubicacion: carrera.ubicacion || '',
        orden: carrera.orden,
        activo: carrera.activo
      });
    } else {
      setEditingCarrera(null);
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
    if (!window.confirm('¿Estás seguro de eliminar esta carrera?')) return;

    try {
      const response = await carrerasService.deleteCarrera(id);
      if (response.success) {
        mostrarMensaje('Carrera eliminada exitosamente', 'success');
        cargarCarreras();
      }
    } catch (error) {
      mostrarMensaje(error.message || 'Error al eliminar carrera', 'error');
    }
  };

  return (
    <div className="gestion-info-container">
      {mensaje.texto && (
        <div className={`mensaje-flotante ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="gestion-info-header">
        <h2>Gestión de Información Universitaria</h2>
        <p>Administra la información general y las carreras de la universidad</p>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📋 Información General
        </button>
        <button
          className={`tab-button ${activeTab === 'carreras' ? 'active' : ''}`}
          onClick={() => setActiveTab('carreras')}
        >
          🎓 Carreras
        </button>
      </div>

      {/* TAB INFORMACIÓN GENERAL */}
      {activeTab === 'info' && (
        <div className="tab-content">
          <div className="acciones-header">
            <button className="btn-primary" onClick={() => abrirInfoModal()}>
              + Nueva Sección
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner">Cargando...</div>
          ) : (
            <div className="secciones-grid">
              {secciones.map((seccion) => (
                <div key={seccion._id} className="seccion-card">
                  <div className="seccion-header">
                    <span className="seccion-icono">{seccion.icono}</span>
                    <h3>{seccion.titulo}</h3>
                    <span className={`badge ${seccion.activo ? 'activo' : 'inactivo'}`}>
                      {seccion.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="seccion-tipo">{seccion.seccion}</p>
                  <p className="seccion-contenido">
                    {seccion.contenido.substring(0, 150)}...
                  </p>
                  <div className="seccion-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => abrirInfoModal(seccion)}
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CARRERAS */}
      {activeTab === 'carreras' && (
        <div className="tab-content">
          <div className="acciones-header">
            <button className="btn-primary" onClick={() => abrirCarreraModal()}>
              + Nueva Carrera
            </button>
            <span className="contador">Total: {carreras.length} carreras</span>
          </div>

          {loading ? (
            <div className="loading-spinner">Cargando...</div>
          ) : (
            <div className="carreras-lista">
              {carreras.map((carrera) => (
                <div key={carrera._id} className="carrera-card">
                  <div className="carrera-main">
                    <div className="carrera-info">
                      <div className="carrera-header-row">
                        <h3>{carrera.nombre}</h3>
                        <span className={`badge ${carrera.activo ? 'activo' : 'inactivo'}`}>
                          {carrera.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="carrera-detalles">
                        <strong>Duración:</strong> {carrera.duracion} | 
                        <strong> Modalidad:</strong> {carrera.modalidad}
                      </p>
                      <p className="carrera-descripcion">
                        {carrera.descripcion.length > 150 ? `${carrera.descripcion.substring(0, 150)}...` : carrera.descripcion}
                      </p>
                      <a 
                        href={carrera.enlaceOficial} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="carrera-enlace"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Ver información completa
                      </a>
                    </div>
                    <div className="carrera-acciones">
                      <button
                        className="btn-editar"
                        onClick={() => abrirCarreraModal(carrera)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminarCarrera(carrera._id)}
                      >
                        🗑️ Eliminar
                      </button>
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
        <div className="modal-overlay" onClick={cerrarInfoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSeccion ? 'Editar Sección' : 'Nueva Sección'}</h3>
              <button className="btn-cerrar" onClick={cerrarInfoModal}>×</button>
            </div>
            <form onSubmit={handleInfoSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Sección *</label>
                  <select
                    name="seccion"
                    value={infoForm.seccion}
                    onChange={handleInfoInputChange}
                    required
                    disabled={editingSeccion !== null}
                  >
                    {seccionesDisponibles.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Icono</label>
                  <select
                    name="icono"
                    value={infoForm.icono}
                    onChange={handleInfoInputChange}
                  >
                    {iconosDisponibles.map(icono => (
                      <option key={icono} value={icono}>{icono}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  name="titulo"
                  value={infoForm.titulo}
                  onChange={handleInfoInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contenido *</label>
                <textarea
                  name="contenido"
                  value={infoForm.contenido}
                  onChange={handleInfoInputChange}
                  rows="8"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Orden</label>
                  <input
                    type="number"
                    name="orden"
                    value={infoForm.orden}
                    onChange={handleInfoInputChange}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={infoForm.activo}
                      onChange={handleInfoInputChange}
                    />
                    Activo
                  </label>
                </div>
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={cerrarInfoModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {editingSeccion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARRERA */}
      {showCarreraModal && (
        <div className="modal-overlay" onClick={cerrarCarreraModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCarrera ? 'Editar Carrera' : 'Nueva Carrera'}</h3>
              <button className="btn-cerrar" onClick={cerrarCarreraModal}>×</button>
            </div>
            <form onSubmit={handleCarreraSubmit} className="modal-form">
              <div className="form-section">
                <h4>Información de la Carrera</h4>
                
                <div className="form-group">
                  <label>Nombre de la Carrera *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={carreraForm.nombre}
                    onChange={handleCarreraInputChange}
                    placeholder="ej: Ingeniería Civil en Computación"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    name="descripcion"
                    value={carreraForm.descripcion}
                    onChange={handleCarreraInputChange}
                    rows="4"
                    placeholder="Describe brevemente la carrera..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duración *</label>
                    <input
                      type="text"
                      name="duracion"
                      value={carreraForm.duracion}
                      onChange={handleCarreraInputChange}
                      placeholder="ej: 5 años, 10 semestres"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Modalidad *</label>
                    <select
                      name="modalidad"
                      value={carreraForm.modalidad}
                      onChange={handleCarreraInputChange}
                      required
                    >
                      {modalidadesDisponibles.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Enlace a Página Oficial *</label>
                  <input
                    type="url"
                    name="enlaceOficial"
                    value={carreraForm.enlaceOficial}
                    onChange={handleCarreraInputChange}
                    placeholder="https://www.utalca.cl/carreras/..."
                    required
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    🔗 URL de la página oficial con información académica completa (malla curricular, perfil de egreso, etc.)
                  </small>
                </div>

                <div className="form-group">
                  <label>Ubicación (opcional)</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={carreraForm.ubicacion}
                    onChange={handleCarreraInputChange}
                    placeholder="Ej: Campus Talca, Edificio D, 2do piso"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    📍 Ubicación física donde se imparte la carrera o ubicación de la oficina de información
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Orden</label>
                    <input
                      type="number"
                      name="orden"
                      value={carreraForm.orden}
                      onChange={handleCarreraInputChange}
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={carreraForm.activo}
                        onChange={handleCarreraInputChange}
                      />
                      Activo
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={cerrarCarreraModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {editingCarrera ? 'Actualizar' : 'Crear'}
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
