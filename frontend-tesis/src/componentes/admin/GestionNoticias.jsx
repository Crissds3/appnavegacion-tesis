import { useState, useEffect } from 'react';
import { noticiasService } from '../../servicios/api';
import './GestionNoticias.css';

const GestionNoticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState(null);
  const [filtros, setFiltros] = useState({ tipo: '', categoria: '' });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [imagenPreview, setImagenPreview] = useState(null);
  
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

      <div className="header-noticias">
        <h2>Gestión de Noticias y Eventos</h2>
        <button 
          className="btn-crear"
          onClick={() => setShowModal(true)}
        >
          + Nueva Noticia
        </button>
      </div>

      <div className="filtros-noticias">
        <select 
          value={filtros.tipo} 
          onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
        >
          <option value="">Todos los tipos</option>
          {tiposNoticia.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>

        <select 
          value={filtros.categoria} 
          onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Cargando noticias...</div>
      ) : (
        <div className="tabla-noticias">
          <table>
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
                  <td colSpan="8" className="no-data">No hay noticias disponibles</td>
                </tr>
              ) : (
                noticiasFiltradas.map(noticia => (
                  <tr key={noticia._id}>
                    <td>
                      {(noticia.imagenBase64 || noticia.imagenUrl) ? (
                        <img 
                          src={noticia.imagenBase64 || noticia.imagenUrl} 
                          alt={noticia.titulo}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          background: '#f0f0f0', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999'
                        }}>
                          📷
                        </div>
                      )}
                    </td>
                    <td>{noticia.titulo}</td>
                    <td>
                      <span className={`badge badge-${noticia.tipo.toLowerCase()}`}>
                        {noticia.tipo}
                      </span>
                    </td>
                    <td>{noticia.categoria}</td>
                    <td>{new Date(noticia.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn-toggle ${noticia.destacado ? 'activo' : ''}`}
                        onClick={() => toggleDestacado(noticia)}
                        title={noticia.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
                      >
                        ★
                      </button>
                    </td>
                    <td>
                      <span className={`estado ${noticia.activo ? 'activo' : 'inactivo'}`}>
                        {noticia.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="acciones">
                      <button 
                        className="btn-editar"
                        onClick={() => handleEditar(noticia)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-eliminar"
                        onClick={() => handleEliminar(noticia._id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
              <button className="btn-cerrar" onClick={cerrarModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="form-noticia">
              <div className="form-row">
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
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
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción breve *</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contenido completo *</label>
                <textarea
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleInputChange}
                  rows="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="input-file"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Tamaño máximo: 5MB. Formatos: JPG, PNG, GIF, WebP</small>
                {imagenPreview && (
                  <div className="imagen-preview">
                    <img src={imagenPreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px', borderRadius: '8px' }} />
                    <button 
                      type="button" 
                      onClick={eliminarImagen}
                      className="btn-eliminar-imagen"
                      style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      🗑️ Eliminar imagen
                    </button>
                  </div>
                )}
              </div>

              {formData.tipo === 'Evento' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha del evento</label>
                      <input
                        type="date"
                        name="fechaEvento"
                        value={formData.fechaEvento}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Ubicación del evento</label>
                      <input
                        type="text"
                        name="ubicacionEvento"
                        value={formData.ubicacionEvento}
                        onChange={handleInputChange}
                        placeholder="Ej: Auditorio Campus Talca"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="destacado"
                    checked={formData.destacado}
                    onChange={handleInputChange}
                  />
                  Marcar como destacado
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                  />
                  Publicar (activo)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={cerrarModal} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
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
