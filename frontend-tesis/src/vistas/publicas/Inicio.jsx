import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import { LogIn } from 'lucide-react';
import './Inicio.css';

const Inicio = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/estudiante');
  };

  const handleAdminLogin = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: '🗺️',
      title: 'Navegación Inteligente',
      description: 'Sistema wayfinding que te guía por todo el campus universitario de forma intuitiva y precisa.'
    },
    {
      icon: '📰',
      title: 'Noticias Actualizadas',
      description: 'Mantente informado con las últimas noticias, eventos y actividades de la universidad.'
    },
    {
      icon: '🎯',
      title: 'Encuentra Rápido',
      description: 'Localiza aulas, laboratorios, oficinas y servicios en segundos con nuestra búsqueda inteligente.'
    }
  ];

  return (
    <div className="inicio-container">
      <Navbar brandName="Portal de Navegación">
        <button onClick={handleAdminLogin} className="btn-login">
          <LogIn size={18} />
          <span>Acceso Administrador</span>
        </button>
      </Navbar>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🎓 Sistema de Navegación Universitaria</div>
          <h1 className="hero-title">
            Navega e infórmate sobre tu <span className="highlight">Universidad</span>
          </h1>
          <p className="hero-subtitle">
            Conoce información relevante de la Universidad de Talca en Curicó y encuentra tu camino dentro del campus de manera fácil y rápida.
          </p>
          <div className="hero-buttons">
            <button onClick={handleGetStarted} className="btn-primary">
              <span>Comenzar Ahora</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">Características</span>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-header">
          <span className="section-badge">Cómo Funciona</span>
        </div>

        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3 className="step-title">Accede al Portal</h3>
            <p className="step-description">
              Ingresa a la plataforma desde cualquier dispositivo sin necesidad de registro.
            </p>
          </div>

          <div className="step-connector"></div>

          <div className="step-item">
            <div className="step-number">2</div>
            <h3 className="step-title">Busca tu Destino</h3>
            <p className="step-description">
              Utiliza el sistema de búsqueda inteligente para encontrar aulas, servicios y más.
            </p>
          </div>

          <div className="step-connector"></div>

          <div className="step-item">
            <div className="step-number">3</div>
            <h3 className="step-title">Sigue la Ruta</h3>
            <p className="step-description">
              Recibe indicaciones claras y precisas para llegar a tu destino sin perderte.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Inicio;
