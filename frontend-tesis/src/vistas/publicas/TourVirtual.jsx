import { useEffect, useState } from 'react';
import Navbar from '../../componentes/compartidos/Navbar';
import { tourVirtualService } from '../../servicios/api';
import Visor3D from '../../componentes/compartidos/Visor3D';
import './TourVirtual.css';

const TourVirtual = () => {
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEdificio, setSelectedEdificio] = useState(null);

  useEffect(() => {
    const cargarEdificios = async () => {
      try {
        setLoading(true);
        const response = await tourVirtualService.getEdificiosPublicos();
        if (response.success) {
          setEdificios(response.data);
        } else {
          setError(response.message || 'No se pudieron cargar los edificios');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar los edificios');
      } finally {
        setLoading(false);
      }
    };

    cargarEdificios();
  }, []);

  const handleExplorar = (edificio) => {
    setSelectedEdificio(edificio);
  };

  const handleClose = () => {
    setSelectedEdificio(null);
  };

  const getModelUrl = (edificio) =>
    edificio?.modeloUrl || edificio?.url || edificio?.archivoUrl || '';

  return (
    <div className="tour-container">
      <Navbar brandName="Módulo informativo" />

      <main className="tour-main">
        <header className="tour-header">
          <h1>Minitour Virtual</h1>
          <p className="tour-subtitle">Explora los edificios en 3D</p>
        </header>

        <div className="tour-content">
          {loading && <p className="tour-state">Cargando edificios...</p>}
          {error && !loading && <p className="tour-state error">{error}</p>}

          {!loading && !error && (
            <div className="tour-grid">
              {edificios.length === 0 && (
                <div className="tour-empty">Aun no hay edificios disponibles.</div>
              )}

              {edificios.map((edificio) => (
                <div key={edificio._id || edificio.id || edificio.nombre} className="tour-card">
                  <div>
                    <h3>{edificio.nombre}</h3>
                    {edificio.descripcion && <p>{edificio.descripcion}</p>}
                  </div>
                  <button type="button" onClick={() => handleExplorar(edificio)}>
                    👁️ Explorar en 3D
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedEdificio && (
        <Visor3D
          url={getModelUrl(selectedEdificio)}
          nombre={selectedEdificio.nombre}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default TourVirtual;
