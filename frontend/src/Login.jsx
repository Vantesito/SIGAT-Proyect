import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Login.css';
import googlelogo from './assets/googlelogo.png';
import logosigat from './assets/logosigat.png';

function Login() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState(''); // Mostrar error

  const handleAuth = (e) => {
    e.preventDefault();
    setErrorMensaje(''); // Limpiar errores
    
    // Buscamos el usuario en la memoria del navegador
    const usuarioGuardadoStr = localStorage.getItem('sigat_usuario_demo');
    
    if (usuarioGuardadoStr) {
      // Convertimos el texto de vuelta a JS
      const usuarioGuardado = JSON.parse(usuarioGuardadoStr);
      
      // Validar credenciales
      if (usuarioGuardado.email === email && usuarioGuardado.password === password) {
        alert("Acceso autorizado. Bienvenida/o " + usuarioGuardado.nombre);
        navigate('/mapa'); 
      } else {
        setErrorMensaje('Credenciales incorrectas. Intente nuevamente.');
      }
    } else {
      setErrorMensaje('No hay ninguna cuenta registrada con ese correo.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-medical">
        <div className="login-header">

          <img src={logosigat} alt="SIGAT" className="brand-logo" height={70} width={70} />
          <h2>Acceso profesionales</h2>
          <p>Ingrese sus credenciales para acceder al sistema epidemiológico.</p>
        </div>

        <form className="login-form-medical" onSubmit={handleAuth}>
          {/* Mensaje de error visual */}
          {errorMensaje && <div style={{color: '#e53e3e', fontSize: '0.85rem', marginBottom: '10px', textAlign: 'center'}}>{errorMensaje}</div>}

          <div className="input-group-med">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              placeholder="medico@correo.cl" 
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

        <div className="divider"><span>O</span></div>

        <button className="btn-google"  onClick={() => alert('Simulación')}>
          <img src={googlelogo} alt="google" className="google-logo" height={15} width={15} />
          Acceder con Google Workspace
        </button>

        <button type="submit" className="btn-register-med" onClick={() => navigate('/registro')}>
          ¿No tienes cuenta? Regístrate
        </button>

        <button className="btn-back-med" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Login;