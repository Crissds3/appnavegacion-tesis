import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import logo from '../assets/logo.png';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (!formData.email || !formData.password) {
      setError('Por favor complete todos los campos');
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Logo" className="logo-image" />
        </div>
        <div className="login-header">
          <h1>Panel de administración</h1>
          <p>Ingresa tus credenciales</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-note">
            Solo administradores pueden acceder a este panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
