import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { AuthProvider } from './contexto/ContextoAuth';
import RutaProtegida from './componentes/compartidos/RutaProtegida';
import Footer from './componentes/compartidos/Footer';
import Inicio from './vistas/publicas/Inicio';
import Login from './vistas/auth/Login';
import SolicitarRecuperacion from './vistas/auth/SolicitarRecuperacion';
import RestablecerPassword from './vistas/auth/RestablecerPassword';
import Tablero from './vistas/admin/Tablero';
import Principal from './vistas/estudiante/Principal';
import Wayfinding from './vistas/estudiante/Wayfinding';
import SobreUniversidad from './vistas/estudiante/SobreUniversidad';
import TourVirtual from './vistas/publicas/TourVirtual';
import './App.css';

const RUTAS_SIN_FOOTER = ['/', '/wayfinding', '/dashboard', '/mapeador'];

function AppConFooter({ children }) {
  const { pathname } = useLocation();
  const mostrarFooter = !RUTAS_SIN_FOOTER.includes(pathname);
  return (
    <>
      {children}
      {mostrarFooter && <Footer />}
    </>
  );
}

// ─── Herramienta de desarrollo: MapeadorVisual ─────────────────────────────
// React.lazy + import.meta.env.DEV garantiza que Vite excluye completamente
// este módulo del bundle de producción (tree-shaking automático).
// No necesitas borrar nada antes de hacer `npm run build`.
const MapeadorVisual = import.meta.env.DEV
  ? lazy(() => import('./componentes/wayfinding/MapeadorVisual'))
  : null;

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppConFooter>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/estudiante" element={<Principal />} />
            <Route path="/wayfinding" element={<Wayfinding />} />
            {/* Ruta de desarrollo: solo disponible con `npm run dev`, excluida del build */}
            {import.meta.env.DEV && MapeadorVisual && (
              <Route
                path="/mapeador"
                element={
                  <Suspense fallback={<div style={{ color: '#fff', padding: 32 }}>Cargando mapeador...</div>}>
                    <MapeadorVisual />
                  </Suspense>
                }
              />
            )}
            <Route path="/principal" element={<Principal />} />
            <Route path="/sobre-universidad" element={<SobreUniversidad />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tour-virtual" element={<TourVirtual />} />
            <Route path="/solicitar-recuperacion" element={<SolicitarRecuperacion />} />
            <Route path="/restablecer-password/:token" element={<RestablecerPassword />} />
            <Route
              path="/dashboard"
              element={
                <RutaProtegida>
                  <Tablero />
                </RutaProtegida>
              }
            />
          </Routes>
        </AppConFooter>
      </AuthProvider>
    </Router>
  );
}

export default App;
