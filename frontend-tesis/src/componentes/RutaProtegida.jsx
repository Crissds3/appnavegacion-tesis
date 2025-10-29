import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';

const RutaProtegida = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default RutaProtegida;
