import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import './Wayfinding.css';

const Wayfinding = () => {
  const navigate = useNavigate();

  return (
    <div className="wayfinding-container">
      <Navbar brandName="Módulo de navegación">
        <div className="navbar-buttons">
          <button onClick={() => navigate('/estudiante')} className="btn-noticias">
            Noticias
          </button>
          <button onClick={() => navigate('/')} className="btn-inicio">
            Inicio
          </button>
        </div>
      </Navbar>

      <main className="wayfinding-main">
        <div className="wayfinding-header">
          <h1>Sistema de Navegación Wayfinding</h1>
          <p className="subtitle">Encuentra tu camino en el Campus</p>
        </div>

        <div className="wayfinding-content">
          <div className="wayfinding-map">
            <div className="map-placeholder">
              <div className="placeholder-icon">🗺️</div>
              <h3>Mapa Interactivo del Campus</h3>
              <p>Sistema de navegación en desarrollo...</p>
            </div>
          </div>

          <div className="wayfinding-sidebar">
            <div className="search-section">
              <h3>Buscar Ubicación</h3>
              <input 
                type="text" 
                placeholder="Edificio, sala, oficina..."
                className="search-input"
              />
              <button className="btn-search">
                🔍 Buscar
              </button>
            </div>

            <div className="quick-access">
              <h3>Acceso Rápido</h3>
              <div className="quick-buttons">
                <button className="quick-btn">
                  <span className="icon">🏛️</span>
                  <span className="text">Biblioteca</span>
                </button>
                <button className="quick-btn">
                  <span className="icon">🍽️</span>
                  <span className="text">Casino</span>
                </button>
                <button className="quick-btn">
                  <span className="icon">🏃</span>
                  <span className="text">Gimnasio</span>
                </button>
                <button className="quick-btn">
                  <span className="icon">🎓</span>
                  <span className="text">Facultades</span>
                </button>
                <button className="quick-btn">
                  <span className="icon">🅿️</span>
                  <span className="text">Estacionamiento</span>
                </button>
                <button className="quick-btn">
                  <span className="icon">🏥</span>
                  <span className="text">Enfermería</span>
                </button>
              </div>
            </div>

            <div className="info-section">
              <h3>Información</h3>
              <div className="info-card">
                <p>
                  <strong>📍 Navegación en tiempo real</strong><br />
                  Encuentra la ruta más rápida a tu destino
                </p>
              </div>
              <div className="info-card">
                <p>
                  <strong>🎯 Realidad Aumentada</strong><br />
                  Usa AR para navegar de forma intuitiva
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wayfinding;
