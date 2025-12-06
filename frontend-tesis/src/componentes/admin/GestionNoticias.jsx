import { useState, useEffect, useRef } from 'react';
import { noticiasService } from '../../servicios/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Calendar, 
  MapPin, 
  Star, 
  Eye, 
  EyeOff,
  Upload
} from 'lucide-react';
import './GestionNoticias.css';

const GestionNoticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState(null);
  const [filtros, setFiltros] = useState({ tipo: '', categoria: '' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [imagenPreview, setImagenPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    contenido: '',
    tipo: 'Noticia',
    categoria: 'Académico',
    imagenUrl: '',
    imagenBase64: '',
    fechaEvento: '',
    ubicacionEvento: '',
    destacado: false,
    activo: true,
  });

  const tiposNoticia = ['Noticia', 'Evento', 'Anuncio'];
  const categorias = [
    'Académico',
    'Cultural',
    'Deportivo',
    'Investigación',
    'Extensión',
    'Administrativo',
    'Otro'
  ];

  useEffect(() => {
    cargarNoticias();
  }, []);

  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const response = await noticiasService.getAllNoticias();
      if (response.success) {
        setNoticias(response.data);
      }
    } catch (error) {
      mostrarMensaje('Error al cargar noticias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarMensaje('La imagen no debe superar 5MB', 'error');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarMensaje('Solo se permiten archivos de imagen', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({
          ...prev,
          imagenBase64: base64String,
          imagenUrl: '' // Limpiar URL si existe
        }));
        setImagenPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarImagen = () => {
    setFormData(prev => ({
      ...prev,
      imagenBase64: '',
      imagenUrl: ''
    }));
    setImagenPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingNoticia) {
        const response = await noticiasService.updateNoticia(editingNoticia._id, formData);
        if (response.success) {
          mostrarMensaje('Noticia actualizada exitosamente', 'success');
          cargarNoticias();
          cerrarModal();
        }
      } else {
        const response = await noticiasService.createNoticia(formData);
        if (response.success) {
          mostrarMensaje('Noticia creada exitosamente', 'success');
          cargarNoticias();
          cerrarModal();
        }
      }
    } catch (error) {
      mostrarMensaje(error.message || 'Error al guardar noticia', 'error');
    }
  };

  const handleEditar = (noticia) => {
    setEditingNoticia(noticia);
    setFormData({
      titulo: noticia.titulo,
      descripcion: noticia.descripcion,
      contenido: noticia.contenido,
      tipo: noticia.tipo,
      categoria: noticia.categoria,
      imagenUrl: noticia.imagenUrl || '',
      imagenBase64: noticia.imagenBase64 || '',
      fechaEvento: noticia.fechaEvento ? noticia.fechaEvento.split('T')[0] : '',
      ubicacionEvento: noticia.ubicacionEvento || '',
      destacado: noticia.destacado,
      activo: noticia.activo,
    });
    // Establecer preview con la imagen existente
    if (noticia.imagenBase64) {
      setImagenPreview(noticia.imagenBase64);
    } else if (noticia.imagenUrl) {
      setImagenPreview(noticia.imagenUrl);
    } else {
      setImagenPreview(null);
    }
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta noticia?')) return;
    
    try {
      const response = await noticiasService.deleteNoticia(id);
      if (response.success) {
        mostrarMensaje('Noticia eliminada exitosamente', 'success');
        cargarNoticias();
      }
    } catch (error) {
      mostrarMensaje('Error al eliminar noticia', 'error');
    }
  };

  const toggleDestacado = async (noticia) => {
    try {
      const response = await noticiasService.updateNoticia(noticia._id, {
        ...noticia,
        destacado: !noticia.destacado
      });
      if (response.success) {
        cargarNoticias();
      }
    } catch (error) {
      mostrarMensaje('Error al actualizar noticia', 'error');
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingNoticia(null);
    setImagenPreview(null);
    setFormData({
      titulo: '',
      descripcion: '',
      contenido: '',
      tipo: 'Noticia',
      categoria: 'Académico',
      imagenUrl: '',
      imagenBase64: '',
      fechaEvento: '',
      ubicacionEvento: '',
      destacado: false,
      activo: true,
    });
  };

  const noticiasFiltradas = noticias.filter(noticia => {
    if (filtros.tipo && noticia.tipo !== filtros.tipo) return false;
    if (filtros.categoria && noticia.categoria !== filtros.categoria) return false;
    return true;
  });

  return (
    <div className="gestion-noticias">
      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="gestion-main-card">
        <div className="gestion-header">
          <div className="header-title">
            <h2>Gestión de Noticias y Eventos</h2>
            <p className="header-subtitle">Administra las noticias, eventos y anuncios de la universidad</p>
          </div>
          <button 
            className="btn-crear-nuevo"
            onClick={() => setShowModal(true)}
          >
            <Plus size={20} />
            Nueva Noticia
          </button>
        </div>

        <div className="filtros-container">
          <div className="filtros-group">
            <select 
              value={filtros.tipo} 
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="filtro-select"
            >
              <option value="">Todos los tipos</option>
              {tiposNoticia.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <select 
              value={filtros.categoria} 
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="filtro-select"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando noticias...</p>
          </div>
        ) : (
          <div className="tabla-container">
            <table className="tabla-moderna">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th>Destacado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {noticiasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      <div className="empty-state">
                        <Search size={48} />
                        <p>No se encontraron noticias</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  noticiasFiltradas.map(noticia => (
                    <tr key={noticia._id}>
                      <td>
                        <div className="img-thumbnail-wrapper">
                          {(noticia.imagenBase64 || noticia.imagenUrl) ? (
                            <img 
                              src={noticia.imagenBase64 || noticia.imagenUrl} 
                              alt={noticia.titulo}
                              className="img-thumbnail"
                            />
                          ) : (
                            <div className="img-placeholder">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="fw-medium">{noticia.titulo}</td>
                      <td>
                        <span className={`badge badge-${noticia.tipo.toLowerCase()}`}>
                          {noticia.tipo}
                        </span>
                      </td>
                      <td>{noticia.categoria}</td>
                      <td>{new Date(noticia.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className={`btn-icon-toggle ${noticia.destacado ? 'active' : ''}`}
                          onClick={() => toggleDestacado(noticia)}
                          title={noticia.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
                        >
                          <Star size={18} fill={noticia.destacado ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td>
                        <span className={`status-indicator ${noticia.activo ? 'active' : 'inactive'}`}>
                          {noticia.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-group">
                          <button 
                            className="btn-icon-action edit"
                            onClick={() => handleEditar(noticia)}
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="btn-icon-action delete"
                            onClick={() => handleEliminar(noticia._id)}
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingNoticia ? <Edit2 size={24} /> : <Plus size={24} />}
                {editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}
              </h3>
              <button className="btn-close-modal" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-noticia">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="Ingrese el título de la noticia"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                    className="select-modern"
                  >
                    {tiposNoticia.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="select-modern"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Descripción breve *</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="2"
                    required
                    className="textarea-modern"
                    placeholder="Resumen corto para la vista previa"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Contenido completo *</label>
                  <textarea
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleInputChange}
                    rows="6"
                    required
                    className="textarea-modern"
                    placeholder="Detalles completos de la noticia o evento"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Imagen</label>
                  <div 
                    className="file-upload-container"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImagenChange}
                      className="hidden-input"
                      ref={fileInputRef}
                    />
                    {imagenPreview ? (
                      <div className="preview-container">
                        <img src={imagenPreview} alt="Preview" className="preview-image" />
                        <div className="preview-overlay">
                          <span className="change-text">Cambiar imagen</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={32} />
                        <span>Haga clic para subir una imagen</span>
                        <small>Máximo 5MB (JPG, PNG, WebP)</small>
                      </div>
                    )}
                  </div>
                  {imagenPreview && (
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarImagen();
                      }}
                      className="btn-remove-image"
                    >
                      <Trash2 size={14} /> Eliminar imagen
                    </button>
                  )}
                </div>

                {formData.tipo === 'Evento' && (
                  <div className="evento-fields full-width">
                    <div className="form-group">
                      <label><Calendar size={16} /> Fecha del evento</label>
                      <input
                        type="date"
                        name="fechaEvento"
                        value={formData.fechaEvento}
                        onChange={handleInputChange}
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group">
                      <label><MapPin size={16} /> Ubicación del evento</label>
                      <input
                        type="text"
                        name="ubicacionEvento"
                        value={formData.ubicacionEvento}
                        onChange={handleInputChange}
                        placeholder="Ej: Auditorio Campus Talca"
                        className="input-modern"
                      />
                    </div>
                  </div>
                )}

                <div className="form-checkboxes full-width">
                  <label className={`checkbox-card ${formData.destacado ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      name="destacado"
                      checked={formData.destacado}
                      onChange={handleInputChange}
                    />
                    <div className="checkbox-content">
                      <Star size={20} className={formData.destacado ? 'icon-active' : ''} />
                      <div>
                        <span className="checkbox-title">Destacado</span>
                        <span className="checkbox-desc">Aparecerá en el carrusel principal</span>
                      </div>
                    </div>
                  </label>

                  <label className={`checkbox-card ${formData.activo ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    <div className="checkbox-content">
                      {formData.activo ? <Eye size={20} /> : <EyeOff size={20} />}
                      <div>
                        <span className="checkbox-title">Visible al público</span>
                        <span className="checkbox-desc">La noticia será visible en la app</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cerrarModal} className="btn-modal-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingNoticia ? 'Actualizar' : 'Crear'}
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
