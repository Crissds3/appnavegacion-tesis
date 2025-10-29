import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = ({ 
  brandName = "NavApp", 
  showLogo = true,
  children 
}) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {showLogo && <img src={logo} alt="Logo" className="logo-img" />}
          <span className="brand-name">{brandName}</span>
        </div>
        <div className="nav-actions">
          {children}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
