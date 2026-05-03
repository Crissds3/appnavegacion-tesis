import './Visor3D.css';

const Visor3D = ({ url, nombre, onClose }) => {
  return (
    <div className="visor3d-overlay" role="dialog" aria-modal="true">
      <div className="visor3d-topbar">
        <div className="visor3d-info">
          <span className="visor3d-label">Minitour Virtual</span>
          <h2 className="visor3d-title">{nombre || 'Modelo 3D'}</h2>
        </div>
        <button type="button" className="visor3d-close" onClick={onClose}>
          ❌ Cerrar Tour
        </button>
      </div>

      <div className="visor3d-stage">
        {url ? (
          <model-viewer
            className="visor3d-viewer"
            src={url}
            auto-rotate
            camera-controls
            shadow-intensity="1"
          ></model-viewer>
        ) : (
          <div className="visor3d-empty">No hay modelo disponible.</div>
        )}
      </div>
    </div>
  );
};

export default Visor3D;
