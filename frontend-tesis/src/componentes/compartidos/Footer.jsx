import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="shared-footer">
      <span className="sf-topo" aria-hidden="true"></span>
      <div className="sf-wrap">
        <div className="sf-top">
          <div>
            <div className="sf-brand">
              <img src={logo} alt="Universidad de Talca" className="sf-brand__logo" />
              <span className="sf-brand__text">
                <span className="sf-brand__name">Portal de Navegación</span>
                <span className="sf-brand__uni">Universidad de Talca · Campus Curicó</span>
              </span>
            </div>
            <p className="sf-tag">Tu guía inteligente dentro del campus. Navegación, noticias y Realidad Aumentada en un solo lugar.</p>
          </div>

          <div className="sf-links">
            <div className="sf-col">
              <h4>Explorar</h4>
              <button onClick={() => navigate('/estudiante')}>Portal del Estudiante</button>
              <button onClick={() => navigate('/tour-virtual')}>Tour Virtual 3D</button>
              <button onClick={() => navigate('/sobre-universidad')}>Sobre la Universidad</button>
            </div>
            <div className="sf-col">
              <h4>Acceso</h4>
              <button onClick={() => navigate('/')}>Inicio</button>
              <button onClick={() => navigate('/login')}>Acceso Administrador</button>
            </div>
          </div>
        </div>

        <div className="sf-bottom">
          <span className="sf-copy">© {new Date().getFullYear()} Portal de Navegación · Universidad de Talca, Campus Curicó</span>
          <span className="sf-author">
            <span className="sf-pin"></span>
            Desarrollado por <strong>Cristóbal Núñez</strong> · Proyecto de Título
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
