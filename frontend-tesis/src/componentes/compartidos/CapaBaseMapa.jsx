import { TileLayer } from 'react-leaflet';
import { Map as MapIcon, Satellite } from 'lucide-react';
import './CapaBaseMapa.css';

/**
 * TileLayer según la capa base seleccionada.
 * 'mapa'     → OpenStreetMap (calles/edificios etiquetados)
 * 'satelite' → Imágenes satelitales Esri World Imagery
 */
export const TileLayerCapas = ({ capaBase }) => (
  capaBase === 'satelite' ? (
    <TileLayer
      attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      maxZoom={18}
      maxNativeZoom={19}
    />
  ) : (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={18}
      maxNativeZoom={19}
    />
  )
);

/**
 * Botón flotante para alternar entre la capa "Mapa" y "Satélite".
 * `className` permite ajustar la posición desde el componente que lo usa.
 */
export const BotonCapas = ({ esSatelite, onToggle, className = '' }) => (
  <div className={`btn-capas-wrapper ${className}`}>
    <button
      className="btn-capas"
      onClick={(e) => {
        e.stopPropagation(); // Evitar que el clic se propague al mapa
        onToggle();
      }}
      aria-label={esSatelite ? 'Ver mapa' : 'Ver satélite'}
      title={esSatelite ? 'Ver mapa' : 'Ver satélite'}
    >
      {esSatelite ? <MapIcon size={22} color="#1a73e8" /> : <Satellite size={22} color="#1a73e8" />}
    </button>
  </div>
);
