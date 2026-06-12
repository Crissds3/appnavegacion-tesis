import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Navbar from '../../componentes/compartidos/Navbar';
import logo from '../../assets/logo.png';
import './Inicio.css';

const Inicio = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal, .draw');
    const inView = (el) => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const r = el.getBoundingClientRect();
      return r.top < vh * 0.95 && r.bottom > 0;
    };

    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('instant'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));

    const animateInView = () => reveals.forEach((el) => { if (inView(el)) el.classList.add('in'); });
    animateInView();
    requestAnimationFrame(animateInView);
    window.addEventListener('load', animateInView);

    const timer = setTimeout(() => {
      reveals.forEach((el) => { if (inView(el)) el.classList.add('instant'); });
    }, 2200);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      window.removeEventListener('load', animateInView);
    };
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const arItems1 = ['Modelos 3D de edificios del campus', 'Proyección en tu entorno real', 'Sin necesidad de estar en el campus'];
  const arItems2 = ['Nombre del edificio o laboratorio', 'Horarios de biblioteca y casino', 'Eventos en tiempo real'];

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="inicio-page">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <Navbar brandName="Portal de Navegación">
        <button className="btn-login" onClick={() => navigate('/login')}>
          <LogIn size={16} />
          <span>Acceso Administrador</span>
        </button>
      </Navbar>

      <main id="top">

        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero__deco" aria-hidden="true">
            <span className="blob"></span>
            <svg className="hero__route" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice">
              <path d="M-40 120 C 280 60, 360 320, 640 300 S 1080 360, 1180 200 S 1460 120, 1520 280" />
            </svg>
          </div>
          <span className="topo" aria-hidden="true"></span>

          <div className="wrap hero__grid">
            <div className="hero__copy">
              <span className="eyebrow reveal">
                <span className="dot"></span> Universidad de Talca · Campus Curicó
              </span>
              <h1 className="reveal" data-d="1">
                Encuentra tu camino dentro del <span className="acento">campus</span>
              </h1>
              <p className="hero__sub reveal" data-d="2">
                Navega el campus, consulta las noticias de la universidad y explora sus edificios con Realidad Aumentada — desde tu computador o tu celular.
              </p>
              <div className="hero__cta reveal" data-d="3">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/estudiante')}>
                  Comenzar ahora <ArrowIcon />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => scrollTo('ar')}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                  Ver Realidad Aumentada
                </button>
              </div>
              <div className="hero__stats reveal" data-d="3">
                <div className="stat">
                  <div className="stat__num">+30 <span>lugares</span></div>
                  <div className="stat__label">edificios, labs y servicios</div>
                </div>
                <div className="stat">
                  <div className="stat__num">3D <span>· AR</span></div>
                  <div className="stat__label">edificios en tu entorno</div>
                </div>
                <div className="stat">
                  <div className="stat__num">0 <span>registros</span></div>
                  <div className="stat__label">solo abrir y navegar</div>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="appstage reveal" data-d="2">
              <div className="chip chip--ar float-anim" aria-hidden="true">
                <span className="ci">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <div className="ct">Modo AR activo</div>
                  <div className="cd">Apunta y descubre</div>
                </div>
              </div>
              <div className="chip chip--news float-anim b" aria-hidden="true">
                <span className="ci">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 0 1 1H7a2 2 0 0 1-2-2V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M8 9h7M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <div className="ct">
                    <span className="live" style={{ display: 'inline-block', marginRight: '5px' }}></span>
                    3 eventos hoy
                  </div>
                  <div className="cd">Casa Central · Aula Magna</div>
                </div>
              </div>

              <div className="phone" aria-label="Vista previa de la app de navegación">
                <span className="phone__notch"></span>
                <div className="phone__screen">
                  <div className="app__map" aria-hidden="true">
                    <span className="mblk m1"></span>
                    <span className="mblk m2"></span>
                    <span className="mblk green m3"></span>
                    <span className="mblk m4"></span>
                    <svg className="app__route" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path vectorEffect="non-scaling-stroke" d="M26 40 C 42 48, 44 64, 60 66 S 72 72, 74 74"/>
                    </svg>
                    <span className="mpin a">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12Z" fill="#E53935"/>
                        <circle cx="12" cy="10" r="2.6" fill="#fff"/>
                      </svg>
                    </span>
                    <span className="mpin b">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" fill="#C62828"/>
                        <circle cx="12" cy="12" r="3.3" fill="#fff"/>
                      </svg>
                    </span>
                  </div>
                  <div className="app__top">
                    <div className="app__search">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="#6E6A66" strokeWidth="2"/>
                        <path d="m20 20-3.2-3.2" stroke="#6E6A66" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      ¿A dónde quieres ir?
                    </div>
                  </div>
                  <div className="app__sheet">
                    <div className="row">
                      <span className="ic">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M12 21s7-6.6 7-12A7 7 0 0 0 5 9c0 5.4 7 12 7 12Z" stroke="#E53935" strokeWidth="1.9"/>
                          <circle cx="12" cy="9" r="2.4" stroke="#E53935" strokeWidth="1.9"/>
                        </svg>
                      </span>
                      <div>
                        <div className="t">Biblioteca Central</div>
                        <div className="d">Edificio C · Piso 1</div>
                      </div>
                      <div className="eta"><b>3 min</b><small>caminando</small></div>
                    </div>
                    <div className="go">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Iniciar ruta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CARACTERÍSTICAS (BENTO) ─────────────────────────── */}
        <section className="section section--hueso" id="caracteristicas">
          <span className="topo--left" aria-hidden="true"></span>
          <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-head">
              <span className="kicker">Características</span>
              <h2 className="section-title">Todo lo que necesitas,<br/>en un solo lugar</h2>
              <p className="section-sub">Diseñado pensando en los estudiantes que llegan por primera vez al Campus Curicó de la Universidad de Talca.</p>
            </div>

            <div className="bento">
              <article className="bcard bcard--lg reveal" data-d="1">
                <div className="bcard__body">
                  <div className="bcard__ic">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 19 3 21V6l6-2m0 15 6 2m-6-2V4m6 17 6-2V4l-6 2m0 13V6m0 0L9 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="bcard__num">01 — WAYFINDING</span>
                  <h3>Navegación Inteligente</h3>
                  <p>Un sistema de wayfinding que te guía por todo el campus de forma intuitiva y precisa, calculando la mejor ruta paso a paso hasta tu destino.</p>
                </div>
                <div className="minimap" aria-hidden="true">
                  <span className="mblk r1"></span>
                  <span className="mblk green r2"></span>
                  <span className="mblk r3"></span>
                  <svg className="route" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M24 48 C 40 56, 48 64, 60 66 S 70 68, 72 70"/>
                  </svg>
                  <span className="mpin a">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 22s7-6.6 7-12A7 7 0 0 0 5 10c0 5.4 7 12 7 12Z" fill="#E53935"/>
                      <circle cx="12" cy="10" r="2.6" fill="#fff"/>
                    </svg>
                  </span>
                  <span className="mpin b">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" fill="#C62828"/>
                      <circle cx="12" cy="12" r="3.3" fill="#fff"/>
                    </svg>
                  </span>
                </div>
              </article>

              <article className="bcard bcard--sm reveal" data-d="2">
                <div className="bcard__ic">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 0 1 1H7a2 2 0 0 1-2-2V4Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/>
                    <path d="M8 8h7M8 12h7M8 16h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Noticias y Eventos</h3>
                <p>Mantente al día con las últimas noticias, eventos y actividades de la universidad, directo en tu pantalla.</p>
              </article>

              <article className="bcard bcard--sm reveal" data-d="3">
                <div className="bcard__ic">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/>
                    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Búsqueda Rápida</h3>
                <p>Localiza aulas, laboratorios, oficinas y servicios en segundos con nuestra búsqueda inteligente.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── REALIDAD AUMENTADA ──────────────────────────────── */}
        <section className="section ar" id="ar">
          <span className="ar__glow g1" aria-hidden="true"></span>
          <span className="ar__glow g2" aria-hidden="true"></span>
          <span className="topo-dark" aria-hidden="true"></span>
          <div className="wrap">
            <div className="section-head center">
              <span className="kicker on-dark">Módulo de exploración inmersiva</span>
              <h2 className="section-title">Realidad Aumentada,<br/>en dos modos</h2>
              <p className="section-sub">Explora la universidad desde donde estés, o descubre información en tiempo real mientras recorres el campus.</p>
            </div>

            <div className="ar-grid">
              <article className="arc reveal" data-d="1">
                <div className="arc__scan" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </div>
                <span className="arc__badge">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
                  </svg>
                  Desde cualquier lugar
                </span>
                <h3>Minitour Virtual de Edificios</h3>
                <p>Explora la Universidad de Talca sin importar dónde estés. A través de la cámara de tu celular, proyecta y manipula modelos 3D de los edificios del campus en tu propio entorno —sobre una mesa o en tu habitación— como vista previa inmersiva antes de visitar el campus por primera vez.</p>
                <ul className="arc__list">
                  {arItems1.map((item, i) => (
                    <li key={i}><span className="arc__check"><CheckIcon /></span>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="arc reveal" data-d="2">
                <div className="arc__scan" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </div>
                <span className="arc__badge">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s7-6.6 7-12A7 7 0 0 0 5 9c0 5.4 7 12 7 12Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/>
                    <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.9"/>
                  </svg>
                  Presencial en el campus
                </span>
                <h3>Información Contextual en Sitio</h3>
                <p>Diseñado para usarse estando físicamente en la universidad. Apunta la cámara de tu celular hacia edificios o laboratorios y obtén información superpuesta en pantalla: nombre del lugar, horarios de servicios y eventos o clases que ocurren en ese momento.</p>
                <ul className="arc__list">
                  {arItems2.map((item, i) => (
                    <li key={i}><span className="arc__check"><CheckIcon /></span>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ───────────────────────────────────── */}
        <section className="section section--hueso" id="como">
          <span className="topo" aria-hidden="true"></span>
          <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-head center">
              <span className="kicker">Cómo funciona</span>
              <h2 className="section-title">En tres simples pasos</h2>
              <p className="section-sub">Sin fricción, sin curva de aprendizaje. Desde que abres el portal hasta llegar a tu destino.</p>
            </div>

            <div className="steps-wrap">
              <div className="route-line reveal" aria-hidden="true">
                <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
                  <path className="draw" style={{ '--len': '1020' }} d="M10 20 C 250 -10, 330 50, 500 20 S 760 -10, 990 20"/>
                </svg>
              </div>
              <div className="steps">
                {[
                  { num: '01', title: 'Accede al Portal', desc: 'Ingresa desde cualquier dispositivo, sin necesidad de registro previo ni descargas.' },
                  { num: '02', title: 'Busca tu Destino', desc: 'Usa el buscador inteligente para encontrar edificios, laboratorios y más.' },
                  { num: '03', title: 'Sigue la Ruta', desc: 'Recibe indicaciones claras y precisas para llegar a tu destino sin perderte.' },
                ].map(({ num, title, desc }, i) => (
                  <article key={i} className="step reveal" data-d={String(i + 1)}>
                    <div className="step__badge">
                      <span className="step__num">{num}</span>
                      <span className="way">
                        <svg viewBox="0 0 24 24" fill="none">
                          {num === '03'
                            ? <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                            : <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </svg>
                      </span>
                    </div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────── */}
        <section className="cta-final">
          <div className="wrap">
            <div className="cta-box reveal">
              <span className="topo-c" aria-hidden="true"></span>
              <span className="ring r1" aria-hidden="true"></span>
              <span className="ring r2" aria-hidden="true"></span>
              <span className="ring r3" aria-hidden="true"></span>
              <div className="cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-6.6 7-12A7 7 0 0 0 5 9c0 5.4 7 12 7 12Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.9"/>
                </svg>
              </div>
              <h2>¿Listo para explorar tu universidad?</h2>
              <p>Sin registros, sin descargas. Solo abre el portal y comienza a navegar por el Campus Curicó.</p>
              <button className="btn btn-lg btn-white" onClick={() => navigate('/estudiante')}>
                Comenzar ahora <ArrowIcon />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="footer">
        <span className="topo-f" aria-hidden="true"></span>
        <div className="wrap">
          <div className="footer__top">
            <div>
              <div className="footer-brand">
                <img src={logo} alt="Universidad de Talca" className="footer-brand__logo" />
                <span className="footer-brand__text">
                  <span className="footer-brand__name">Portal de Navegación</span>
                  <span className="footer-brand__uni">Universidad de Talca · Campus Curicó</span>
                </span>
              </div>
              <p className="footer__tag">Tu guía inteligente dentro del campus. Navegación, noticias y Realidad Aumentada en un solo lugar.</p>
            </div>
            <div className="footer__links">
              <div className="footer__col">
                <h4>Producto</h4>
                <a href="#caracteristicas" onClick={(e) => { e.preventDefault(); scrollTo('caracteristicas'); }}>Características</a>
                <a href="#ar" onClick={(e) => { e.preventDefault(); scrollTo('ar'); }}>Realidad Aumentada</a>
                <a href="#como" onClick={(e) => { e.preventDefault(); scrollTo('como'); }}>Cómo funciona</a>
              </div>
              <div className="footer__col">
                <h4>Acceso</h4>
                <button onClick={() => navigate('/estudiante')}>Abrir portal</button>
                <button onClick={() => navigate('/login')}>Acceso Administrador</button>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span className="footer__copy">© {new Date().getFullYear()} Portal de Navegación · Universidad de Talca, Campus Curicó</span>
            <span className="footer__author">
              <span className="pin"></span>
              Desarrollado por <strong>Cristóbal Núñez</strong> · Proyecto de Título
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Inicio;
