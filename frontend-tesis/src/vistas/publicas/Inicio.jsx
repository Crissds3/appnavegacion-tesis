import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAuth';
import Navbar from '../../componentes/compartidos/Navbar';
import './Inicio.css';

const Inicio = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    navigate('/estudiante');
  };

  const handleAdminLogin = () => {
    navigate('/login');
  };

  return (
    <div className="inicio-container">
      <Navbar brandName="Portal de navegación">
        <button onClick={handleAdminLogin} className="btn-admin">
          Acceso Administrador
        </button>
      </Navbar>

      {/* Hero Section - Centrado */}
      <section className="hero-section">
        <div className="hero-content-center">
          <h1 className="hero-title">
            Navega con un sistema <span className="highlight">wayfinding</span>
          </h1>
          <p className="hero-subtitle">
            Navega por la universidad con el sistema inteligente, además conoce información importante como noticias, eventos y servicios.
          </p>
          <div className="hero-buttons">
            <button onClick={handleGetStarted} className="btn-primary">
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Inicio;
