import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexto/ContextoAuth';
import RutaProtegida from './componentes/compartidos/RutaProtegida';
import Inicio from './vistas/publicas/Inicio';
import Login from './vistas/auth/Login';
import Tablero from './vistas/admin/Tablero';
import Principal from './vistas/estudiante/Principal';
import Wayfinding from './vistas/estudiante/Wayfinding';
import SobreUniversidad from './vistas/estudiante/SobreUniversidad';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/estudiante" element={<Principal />} />
          <Route path="/wayfinding" element={<Wayfinding />} />
          <Route path="/principal" element={<Principal />} />
          <Route path="/sobre-universidad" element={<SobreUniversidad />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <Tablero />
              </RutaProtegida>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;