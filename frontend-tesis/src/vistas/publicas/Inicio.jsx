import { useNavigate } from 'react-router-dom';
import Navbar from '../../componentes/compartidos/Navbar';
import MapaHero from '../../componentes/compartidos/MapaHero';
import {
  LogIn,
  MapPin,
  Newspaper,
  Search,
  ScanLine,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import './Inicio.css';

const Inicio = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => navigate('/estudiante');
  const handleAdminLogin = () => navigate('/login');

  const features = [
    {
      Icon: MapPin,
      title: 'Navegación Inteligente',
      description:
        'Sistema wayfinding que te guía por todo el campus universitario de forma intuitiva y precisa.',
    },
    {
      Icon: Newspaper,
      title: 'Noticias y Eventos',
      description:
        'Mantente informado con las últimas noticias, eventos y actividades de la universidad.',
    },
    {
      Icon: Search,
      title: 'Búsqueda Rápida',
      description:
        'Localiza aulas, laboratorios, oficinas y servicios en segundos con nuestra búsqueda inteligente.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Accede al Portal',
      description: 'Ingresa desde cualquier dispositivo sin necesidad de registro previo.',
    },
    {
      number: '02',
      title: 'Busca tu Destino',
      description: 'Usa el buscador inteligente para encontrar aulas, servicios y más.',
    },
    {
      number: '03',
      title: 'Sigue la Ruta',
      description: 'Recibe indicaciones claras y precisas para llegar a tu destino.',
    },
  ];

  return (
    <div className="inicio-container">
      <Navbar brandName="Portal de Navegación">
        <button onClick={handleAdminLogin} className="btn-login">
          <LogIn size={16} />
          <span>Acceso Administrador</span>
        </button>
      </Navbar>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <GraduationCap size={15} />
            <span>Universidad de Talca · Campus Curicó</span>
          </div>

          <h1 className="hero-title">
            Tu guía inteligente<br />
            dentro del <span className="highlight">campus</span>
          </h1>

          <p className="hero-subtitle">
            Navega el campus, consulta noticias y descubre la universidad con
            Realidad Aumentada desde cualquier dispositivo.
          </p>

          <div className="hero-buttons">
            <button onClick={handleGetStarted} className="btn-primary">
              <span>Comenzar ahora</span>
              <ArrowRight size={18} />
            </button>
          </div>


        </div>

        <div className="hero-visual" aria-hidden="true">
          <MapaHero />
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ──────────────────────────────────── */}
      <section className="features-section">
        <div className="section-wrap">
          <div className="section-header">
            <span className="section-eyebrow">Características</span>
            <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
            <p className="section-subtitle">
              Diseñado pensando en los estudiantes que llegan por primera vez al campus.
            </p>
          </div>

          <div className="features-grid">
            {features.map(({ Icon, title, description }, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-description">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REALIDAD AUMENTADA ───────────────────────────────── */}
      <section className="ar-section">
        <div className="section-wrap">
          <div className="section-header">
            <span className="section-eyebrow">Módulo de Exploración Inmersiva</span>
            <h2 className="section-title">Realidad Aumentada en dos modos</h2>
            <p className="section-subtitle">
              Explora la universidad desde donde estés o descubre información en tiempo real
              mientras recorres el campus, con el módulo de Realidad Aumentada.
            </p>
          </div>

          <div className="ar-modes-grid">
            {/* Modo 1: Minitour Virtual */}
            <div className="ar-mode-card">
              <div className="ar-mode-header">
                <div className="ar-mode-badge ar-mode-badge--remote">
                  <ScanLine size={18} strokeWidth={2} />
                  <span>Desde cualquier lugar</span>
                </div>
                <h3 className="ar-mode-title">Minitour Virtual de Edificios</h3>
              </div>
              <p className="ar-mode-desc">
                Explora la Universidad de Talca sin importar dónde estés. A través de la cámara
                de tu celular, proyecta y manipula modelos 3D de los edificios
                representativos del campus en tu propio entorno, sobre una mesa o en tu habitación,
                como vista previa inmersiva antes de visitar el campus por primera vez.
              </p>
              <ul className="ar-mode-features">
                <li><CheckCircle2 size={14} /> Modelos 3D de edificios del campus</li>
                <li><CheckCircle2 size={14} /> Proyección en tu entorno real</li>
                <li><CheckCircle2 size={14} /> Sin necesidad de estar en el campus</li>
              </ul>
            </div>

            {/* Modo 2: Información Contextual */}
            <div className="ar-mode-card ar-mode-card--accent">
              <div className="ar-mode-header">
                <div className="ar-mode-badge ar-mode-badge--campus">
                  <MapPin size={18} strokeWidth={2} />
                  <span>Presencial en el campus</span>
                </div>
                <h3 className="ar-mode-title">Información Contextual en Sitio</h3>
              </div>
              <p className="ar-mode-desc">
                Diseñado para usarse estando físicamente en la universidad. Apunta la cámara
                de tu celular hacia edificios o laboratorios y obtén información superpuesta
                en pantalla: nombre del lugar, horarios de servicios y eventos o clases
                que ocurren en ese momento.
              </p>
              <ul className="ar-mode-features">
                <li><CheckCircle2 size={14} /> Nombre del edificio o laboratorio</li>
                <li><CheckCircle2 size={14} /> Horarios de biblioteca y casino</li>
                <li><CheckCircle2 size={14} /> Eventos y clases en tiempo real</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
      <section className="how-section">
        <div className="section-wrap">
          <div className="section-header">
            <span className="section-eyebrow">Cómo funciona</span>
            <h2 className="section-title">En tres simples pasos</h2>
          </div>

          <div className="steps-track">
            {steps.map(({ number, title, description }, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{number}</div>
                <h3 className="step-title">{title}</h3>
                <p className="step-description">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-inner">
          <CheckCircle2 size={36} className="cta-icon" />
          <h2 className="cta-title">¿Listo para explorar tu universidad?</h2>
          <p className="cta-subtitle">
            Sin registros, sin descargas. Solo abre el portal y comienza a navegar.
          </p>
          <button onClick={handleGetStarted} className="btn-primary">
            <span>Comenzar ahora</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Portal de Navegación · Universidad de Talca, Campus Curicó</p>
      </footer>
    </div>
  );
};

export default Inicio;
