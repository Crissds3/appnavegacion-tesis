import { useEffect, useRef, useState } from 'react';
import { showConfirm, showError, showSuccess } from '../../utils/sweetAlert';
import { tourVirtualService } from '../../servicios/api';
import './AdminTourVirtual.css';

const initialForm = {
  nombre: '',
  descripcion: '',
  archivo: null,
};

const AdminTourVirtual = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelos, setModelos] = useState([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(false);
  const [listError, setListError] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFormData((prev) => ({ ...prev, archivo: null }));
      return;
    }

    const isGlb =
      file.name.toLowerCase().endsWith('.glb') ||
      file.type === 'model/gltf-binary';

    if (!isGlb) {
      showError('Solo se permiten archivos .glb');
      e.target.value = '';
      setFormData((prev) => ({ ...prev, archivo: null }));
      return;
    }

    setFormData((prev) => ({ ...prev, archivo: file }));
  };

  const cargarModelos = async () => {
    try {
      setIsLoadingModelos(true);
      setListError('');
      const response = await tourVirtualService.getEdificiosAdmin();
      if (response.success) {
        setModelos(response.data);
      } else {
        setListError(response.message || 'No se pudieron cargar los modelos');
      }
    } catch (error) {
      setListError(error.message || 'Error al cargar los modelos');
    } finally {
      setIsLoadingModelos(false);
    }
  };

  useEffect(() => {
    cargarModelos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      showError('Completa el nombre y la descripción');
      return;
    }

    if (!formData.archivo) {
      showError('Selecciona un archivo .glb');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('nombre', formData.nombre.trim());
      payload.append('descripcion', formData.descripcion.trim());
      payload.append('modelo', formData.archivo);

      const response = await tourVirtualService.createEdificio(payload);
      if (response.success) {
        showSuccess('Edificio agregado al Minitour');
        setFormData(initialForm);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        cargarModelos();
      } else {
        showError(response.message || 'No se pudo guardar el edificio');
      }
    } catch (error) {
      showError(error.message || 'Error al subir el modelo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Eliminar modelo',
      text: 'Esta accion eliminara el modelo del Minitour.',
      confirmText: 'Si, eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

    try {
      const response = await tourVirtualService.deleteEdificio(id);
      if (response.success) {
        showSuccess('Modelo eliminado');
        cargarModelos();
      } else {
        showError(response.message || 'No se pudo eliminar');
      }
    } catch (error) {
      showError(error.message || 'Error al eliminar el modelo');
    }
  };

  return (
    <div className="admin-tour-virtual">
      <div className="admin-tour-card">
        <header className="admin-tour-header">
          <h2>Minitour Virtual</h2>
          <p>Sube modelos 3D (.glb) para la galeria publica</p>
        </header>

        <form className="admin-tour-form" onSubmit={handleSubmit}>
          <div className="admin-tour-grid">
            <div className="admin-tour-field">
              <label htmlFor="nombre">Nombre del edificio</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej. Biblioteca Central"
              />
            </div>

            <div className="admin-tour-field full-width">
              <label htmlFor="descripcion">Descripcion breve</label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe el edificio en una o dos lineas."
              />
            </div>

            <div className="admin-tour-field full-width">
              <label htmlFor="archivo">Modelo 3D (.glb)</label>
              <div className="admin-tour-file-control">
                <input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept=".glb,model/gltf-binary"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="admin-tour-file-input"
                />
                <label htmlFor="archivo" className="admin-tour-file-button">
                  📁 Seleccionar archivo .glb
                </label>
                <span className="admin-tour-file-name">
                  {formData.archivo ? formData.archivo.name : 'Sin archivo seleccionado'}
                </span>
              </div>
              <p className="admin-tour-hint">
                Solo archivos .glb. El backend guardara el archivo y devolvera la URL.
              </p>
            </div>
          </div>

          <div className="admin-tour-actions">
            <button type="submit" className="admin-tour-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Subiendo...' : 'Guardar edificio'}
            </button>
          </div>
        </form>

        <div className="admin-tour-list">
          <div className="admin-tour-list-header">
            <span>Edificio</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {isLoadingModelos && (
            <div className="admin-tour-list-row empty">Cargando modelos...</div>
          )}
          {!isLoadingModelos && listError && (
            <div className="admin-tour-list-row empty error">{listError}</div>
          )}
          {!isLoadingModelos && !listError && modelos.length === 0 && (
            <div className="admin-tour-list-row empty">Aun no hay modelos cargados.</div>
          )}
          {!isLoadingModelos && !listError && modelos.map((edificio) => (
            <div key={edificio._id} className="admin-tour-list-row">
              <div>
                <strong>{edificio.nombre}</strong>
                {edificio.descripcion && <p>{edificio.descripcion}</p>}
              </div>
              <span className={`admin-tour-status ${edificio.activo ? 'activo' : 'inactivo'}`}>
                {edificio.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div className="admin-tour-actions-cell">
                <button
                  type="button"
                  className="admin-tour-delete"
                  onClick={() => handleDelete(edificio._id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTourVirtual;
