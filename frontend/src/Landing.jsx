import { useNavigate } from 'react-router-dom';
import './Landing.css';
import mapacalor from './assets/mapacalor.png';
import logosigat from './assets/logosigat.png';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <header className="header">
        <div className="logo">
          <img src={logosigat} alt="SIGAT" className="brand-logo" height={70} width={70} />
        </div>
        
        <nav className="nav-links">
          <a href="#">Mapeo epidemiológico</a>
          <a href="#">Alertas de tratamiento</a>
          <a href="#">Privacidad de datos</a>
        </nav>
        
        <div className="auth-buttons">
          <button className="btn-signin" onClick={() => navigate('/login')}>
            Acceso profesionales
          </button>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <h1>Control de enfermedades</h1>
          <p>
            Herramienta diseñada exclusivamente para trabajadores de la salud. 
            Mapea la concentración de enfermedades contagiosas.
          </p>
          <ul className="feature-list">
            <li>Mapas de calor anonimizados por cuadrantes</li>
            <li>Carga de pacientes mediante integración en lote</li> 
          </ul>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Ingresar al sistema
          </button>
        </div>

        <div className="hero-image-container">
          <img src={mapacalor} alt="Dashboard Médico" className="mapa-calor" height={500} width={600} onClick={() => navigate('/login')}/>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-links">
          <div className="link-column">
            <h4>SIGAT</h4>
            <a href="#">Sobre el proyecto SIGAT</a>
            <a href="#">Equipo de desarrollo</a>
          </div>
          <div className="link-column">
            <h4>Seguridad</h4>
            <a href="#">Ley de protección de Datos</a>
            <a href="#">Anonimización de cuadrantes</a>
          </div>
          <div className="link-column">
            <h4>Soporte Técnico</h4>
            <a href="#">Manual de usuario</a>
            <a href="#">Contacto administrador</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;