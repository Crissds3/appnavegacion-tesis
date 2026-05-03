import { X } from 'lucide-react';
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
          <X size={18} /> Cerrar Tour
        </button>
      </div>

      <div className="visor3d-stage">
        {url ? (
          <model-viewer 
            src="https://modelviewer.dev/shared-assets/models/Astronaut.glb" 
            ar 
            ar-modes="webxr scene-viewer quick-look" 
            ar-scale="auto" 
            ar-placement="floor"
            camera-controls 
            auto-rotate
            environment-image="neutral"
            exposure="1"
            style={{ width: '100%', height: '100%', minHeight: '60vh', backgroundColor: '#1a1a1a' }}
          >
            <button slot="ar-button" style={{
                position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: '#cc0000', color: 'white', padding: '12px 24px', 
                borderRadius: '25px', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer'
            }}>
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
