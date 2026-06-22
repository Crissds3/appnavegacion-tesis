import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Visor3D.css';

const Visor3D = ({ url, nombre, onClose }) => {
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousPosition = style.position;
    const previousTop = style.top;
    const previousWidth = style.width;

    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';

    return () => {
      style.overflow = previousOverflow;
      style.position = previousPosition;
      style.top = previousTop;
      style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className="visor3d-overlay" role="dialog" aria-modal="true">
      <div className="visor3d-topbar">
        <div className="visor3d-info">
          <span className="visor3d-label">Minitour Virtual</span>
          <h2 className="visor3d-title">{nombre || 'Modelo 3D'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="visor3d-close" onClick={onClose}>
            <X size={18} /> Cerrar Tour
          </button>
        </div>
      </div>

      <div className="visor3d-stage">
        {url ? (
          <model-viewer
            className="visor3d-viewer"
            src={url}
            auto-rotate
            camera-controls
            shadow-intensity="1"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
          >
            <button slot="ar-button" className="visor3d-ar-button">
              📷 Ver en mi entorno (AR)
            </button>
          </model-viewer>
        ) : (
          <div className="visor3d-empty">No hay modelo disponible.</div>
        )}
      </div>
    </div>
  );
};

export default Visor3D;
