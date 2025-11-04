import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexto/ContextoAuth';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './vistas/Inicio';
import Login from './vistas/Login';
import Tablero from './vistas/Tablero';
import Principal from './vistas/Principal';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/principal" element={<Principal />} />
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