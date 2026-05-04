import { useState } from 'react';
import { X, Beaker } from 'lucide-react';
import './Visor3D.css';

const Visor3D = ({ url, nombre, onClose }) => {
  const [usarPrueba, setUsarPrueba] = useState(false);
  const astronautaUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
  
  const currentUrl = usarPrueba ? astronautaUrl : url;

  return (
    <div className="visor3d-overlay" role="dialog" aria-modal="true">
      <div className="visor3d-topbar">
        <div className="visor3d-info">
          <span className="visor3d-label">Minitour Virtual</span>
          <h2 className="visor3d-title">
            {usarPrueba ? 'Astronauta (Modo Prueba)' : (nombre || 'Modelo 3D')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="visor3d-close" 
            onClick={() => setUsarPrueba(!usarPrueba)}
            style={{ 
              backgroundColor: usarPrueba ? '#FFF5F5' : 'white', 
              color: usarPrueba ? '#E53935' : '#1f1f1f',
              border: usarPrueba ? '1px solid #FFCDD2' : 'none'
            }}
          >
            <Beaker size={18} /> {usarPrueba ? 'Ver mi modelo' : 'Probar Astronauta'}
          </button>
          <button type="button" className="visor3d-close" onClick={onClose}>
            <X size={18} /> Cerrar Tour
          </button>
        </div>
      </div>

      <div className="visor3d-stage">
        {currentUrl ? (
          <model-viewer
            className="visor3d-viewer"
            src={currentUrl}
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
