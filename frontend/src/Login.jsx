import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Login.css';
import logosigat from './assets/logosigat.png';
import mapcalor from './assets/mapcalor.png';
function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleAuth = async (e) => {
      e.preventDefault();
      setErrorMensaje('');
      const r = await fetch("http://localhost:8080/api/auth/login", {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'content-type': 'application/json',
          },
          body: JSON.stringify({"email": email, "password": password})
      });
      if (r.ok || r.status === 401 || r.status === 403) {
          const res = await r.json();
          console.log(res.correo);

          if (res.correo === email && res.token.length > 0 && res.rol === "ROLE_USER") {
              alert("Acceso autorizado. Bienvenida/o ");
              navigate('/mapa');
              localStorage.setItem("token", res.token);
          } else if (res.correo === email && res.token.length > 0 && res.rol === "ROLE_ADMIN") {
              navigate('/panel-admin');
              localStorage.setItem("token", res.token);
          } else {
              setErrorMensaje('Credenciales incorrectas. Intente nuevamente.');
          }
      } else {
          alert("Ocurrió un error al intentar iniciar sesión")
      }
  };

  return (
    <div className="login-wrapper-split">
      <div className="login-card-split">
        <div className="login-image-side" style={{ backgroundImage: `url(${mapcalor})` }}>
          <div className="image-overlay">
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-header">
            <img src={logosigat} alt="SIGAT" className="brand-logo" height={60} width={60} />
            <h2>Acceso profesionales</h2>
            <p>Ingrese sus credenciales para acceder al sistema SIGAT.</p>
          </div>

          <form className="login-form-medical" onSubmit={handleAuth}>
            {errorMensaje && (
              <div className="error-alert-login">
                {errorMensaje}
              </div>
            )}

            <div className="input-group-med">
              <label htmlFor="email">Email institucional</label>
              <input 
                type="email" 
                id="email"
                placeholder="profesional@institución.cl" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group-med">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn-submit-med">
              Iniciar sesión
            </button>
          </form>

          <div className="login-footer">
            <button type="button" className="btn-register-med" onClick={() => navigate('/registro')}>
              ¿No tienes cuenta? Regístrate
            </button>

            <button className="btn-back-med" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;