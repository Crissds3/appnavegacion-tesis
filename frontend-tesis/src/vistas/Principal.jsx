import { useNavigate } from 'react-router-dom';
import Navbar from '../componentes/Navbar';
import './Principal.css';

const Principal = () => {
  const navigate = useNavigate();

  return (
    <div className="principal-container">
      <Navbar brandName="Sistema Wayfinding">
        <button onClick={() => navigate('/')} className="btn-back">
          Volver al Inicio
        </button>
      </Navbar>

      <main className="main-content">
        <div className="wayfinding-container">
          <h1 className="main-title">Sistema de Navegación Wayfinding</h1>
          <p className="main-subtitle">
            Aquí se implementará el sistema de navegación inteligente
          </p>
          
          <div className="wayfinding-placeholder">
            <div className="placeholder-icon">🗺️</div>
            <p>Sistema de navegación en desarrollo...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Principal;
