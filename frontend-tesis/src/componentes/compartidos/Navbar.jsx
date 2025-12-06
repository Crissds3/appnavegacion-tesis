import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAuth';
import { Home, Map, Info, Newspaper, LogIn, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import './Navbar.css';
import logo from '../../assets/logo.png';

const Navbar = ({ 
  brandName = "CampusNav", 
  showLogo = true,
  customLinks = null,
  children
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const defaultNavLinks = [
    { name: 'Noticias', path: '/estudiante', icon: <Newspaper size={18} /> },
    { name: 'Mapa', path: '/wayfinding', icon: <Map size={18} /> },
    { name: 'Sobre Nosotros', path: '/sobre-universidad', icon: <Info size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;
  const isHomePage = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  const showDefaultNavigation = !isHomePage && !isDashboard;
  const linksRender = customLinks || (showDefaultNavigation ? defaultNavLinks : []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Logo Section */}
        <div className="logo-section" onClick={() => navigate('/')}>
          {showLogo && <img src={logo} alt="Logo" className="logo-img" />}
          <span className="brand-name">{brandName}</span>
        </div>

        {/* Desktop Navigation */}
        {linksRender.length > 0 && (
          <div className="nav-links desktop-only">
            {linksRender.map((link, index) => (
              link.path ? (
                <Link
                  key={link.path || index}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={link.onClick}
                  className={`nav-link ${link.active ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit' }}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </button>
              )
            ))}
          </div>
        )}

        {/* Auth Actions */}
        <div className="nav-actions desktop-only">
          {children ? (
            children
          ) : (
            isAuthenticated ? (
              <div className="auth-buttons">
                <span className="user-greeting">Hola, {user?.nombre?.split(' ')[0]}</span>
                {!isDashboard && (
                  <button onClick={() => navigate('/dashboard')} className="btn-dashboard" title="Panel de Administración">
                    <LayoutDashboard size={18} />
                    <span>Panel</span>
                  </button>
                )}
                <button onClick={logout} className="btn-logout" title="Cerrar Sesión">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-login">
                <LogIn size={18} />
                <span>Acceso Admin</span>
              </button>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          {linksRender.map((link, index) => (
             link.path ? (
              <Link
                key={link.path || index}
                to={link.path}
                className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
             ) : (
              <button
                key={index}
                onClick={() => { link.onClick(); setIsMenuOpen(false); }}
                className={`mobile-nav-link ${link.active ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.name}</span>
              </button>
             )
          ))}
          <div className="mobile-auth-actions">
            {children ? (
               isAuthenticated && (
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="mobile-btn-logout">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
               )
            ) : (
              isAuthenticated ? (
                <>
                  {!isDashboard && (
                    <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="mobile-btn-dashboard">
                      <LayoutDashboard size={18} /> Panel Admin
                    </button>
                  )}
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="mobile-btn-logout">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="mobile-btn-login">
                  <LogIn size={18} /> Acceso Admin
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
