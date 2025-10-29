import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexto/ContextoAuth';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './vistas/Inicio';
import Login from './vistas/Login';
import Register from './vistas/Register';
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
          <Route path="/register" element={<Register />} />
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