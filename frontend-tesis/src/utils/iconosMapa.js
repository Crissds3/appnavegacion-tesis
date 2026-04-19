/**
 * iconosMapa.js — Utilidad de iconos Leaflet por categoría
 * Genera L.divIcon personalizados con SVG inline para cada tipo de ubicación.
 * Usado tanto en GestionUbicaciones (admin) como en MapaWayfinding (usuario).
 */
import L from 'leaflet';

// ── SVGs inline (estilo Lucide, stroke-based) ──────────────────────────────
const SVGS = {
  edificio: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,

  biblioteca: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,

  casino: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,

  cancha: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="12" x2="17" y2="12"/><rect x="2" y="9" width="5" height="6" rx="1"/><rect x="17" y="9" width="5" height="6" rx="1"/></svg>`,

  laboratorio: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l1 9H8L9 3z"/><path d="M6.5 21a4.5 4.5 0 0 1 0-9H8l1-3h6l1 3h1.5a4.5 4.5 0 0 1 0 9H6.5z"/></svg>`,

  entrada: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4H5v16h8"/><polyline points="17 8 21 12 17 16"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,

  estacionamiento: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,

  servicio: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8.97 8.97 0 0 0 0 11.4M17.7 6.3a8.97 8.97 0 0 1 0 11.4M3.05 9a12.05 12.05 0 0 0 0 6M20.95 9a12.05 12.05 0 0 1 0 6"/></svg>`,

  otro: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

// ── Configuración por categoría ────────────────────────────────────────────
export const CATEGORIA_CONFIG = {
  edificio:        { label: 'Edificio',          color: '#E53935' },
  biblioteca:      { label: 'Biblioteca',        color: '#1565C0' },
  casino:          { label: 'Casino',            color: '#E65100' },
  cancha:          { label: 'Cancha / Deporte',  color: '#2E7D32' },
  laboratorio:     { label: 'Laboratorio',       color: '#6A1B9A' },
  entrada:         { label: 'Entrada',           color: '#00695C' },
  estacionamiento: { label: 'Estacionamiento',   color: '#37474F' },
  servicio:        { label: 'Servicio',          color: '#1976D2' },
  otro:            { label: 'Otro',              color: '#757575' },
};

// ── Lista plana de categorías para chips/selects ───────────────────────────
export const CATEGORIAS = Object.entries(CATEGORIA_CONFIG).map(([value, { label, color }]) => ({
  value,
  label,
  color,
}));

// ── Función principal: genera el DivIcon para un marcador regular ──────────
export const getIconoPorCategoria = (categoria = 'otro') => {
  const cfg = CATEGORIA_CONFIG[categoria] || CATEGORIA_CONFIG.otro;
  const svg = SVGS[categoria] || SVGS.otro;
  const { color } = cfg;

  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.30));
    ">
      <div style="
        width: 36px;
        height: 36px;
        background: white;
        border-radius: 50%;
        border: 3px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
      ">${svg}</div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 9px solid ${color};
        margin-top: -2px;
      "></div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize:    [36, 45],
    iconAnchor:  [18, 45],
    popupAnchor: [0, -48],
  });
};
