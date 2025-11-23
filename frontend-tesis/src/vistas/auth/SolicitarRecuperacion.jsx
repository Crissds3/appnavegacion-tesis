import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import './Login.css';

const SolicitarRecuperacion = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    // Validación
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor ingrese su correo electrónico' });
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/solicitar-recuperacion`, { email });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Si el correo existe en nuestro sistema, recibirás un email con las instrucciones para recuperar tu contraseña'
        });
        setEmail('');
        
        // Redirigir al login después de 5 segundos
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al procesar la solicitud. Intente nuevamente'
      });
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
          <h1>Recuperar contraseña</h1>
          <p>Ingresa tu correo para recibir instrucciones</p>
        </div>

        {message.text && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            <span>{message.type === 'error' ? '⚠️' : '✓'} {message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Enviando...' : 'ENVIAR INSTRUCCIONES'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <Link to="/login" className="link">
              ← Volver al inicio de sesión
            </Link>
          </p>
          <p className="footer-note">
            Recibirás un correo con un enlace válido por 1 hora
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolicitarRecuperacion;
