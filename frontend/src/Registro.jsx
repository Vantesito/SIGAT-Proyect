import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Registro.css';
import logosigat from './assets/logosigat.png';

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    institucion: ''
  });

  const handleRegistro = (e) => {
    e.preventDefault();
    
    // SIMULACIÓN DE BACKEND: Guardamos el usuario en la memoria del navegador
    // Convertimos el objeto formData a un texto (string) para poder guardarlo
    localStorage.setItem('sigat_usuario_demo', JSON.stringify(formData));
    
    alert("Cuenta simulada creada con éxito para " + formData.nombre);
    
    // Redirigimos al Login para que pruebe entrar
    navigate('/login'); 
  };

  return (
    <div className="registro-wrapper">
      <div className="registro-card">
        <img src={logosigat} alt="SIGAT" className="brand-logo" height={70} width={70} />
        <h2>Registro de Profesional</h2>
        <p>Crea tu credencial institucional para SIGAT.</p>
        
        <form onSubmit={handleRegistro}>
          <div className="input-group-med">
            <label>Nombre completo</label>
            <input 
              type="text" 
              required 
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          <div className="input-group-med">
            <label>Email</label>
            <input 
              type="email" 
              required 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="input-group-med">
            <label>Contraseña</label>
            <input 
              type="password" 
              required 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn-submit-med">Crear cuenta</button>
        </form>
        <button className="btn-back-med" onClick={() => navigate('/login')}>
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </div>
    </div>
  );
}

export default Registro;