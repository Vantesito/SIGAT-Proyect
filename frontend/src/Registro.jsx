import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Registro.css';
import logosigat from './assets/logosigat.png';

function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    rut: '',
    pais: '',
    region: '',
    ciudad: '',
    institucion: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistro = (e) => {
    e.preventDefault();
    
    // Validación básica de contraseñas
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor, verifique.");
      return;
    }
    
    // SIMULACIÓN
    localStorage.setItem('sigat_usuario_demo', JSON.stringify({
      email: formData.correo,
      password: formData.password,
      nombre: formData.nombre + ' ' + formData.apellido
    }));
    
    alert("Prototipo: Solicitud de registro enviada con éxito.");
    navigate('/login'); 
  };

  return (
    <div className="registro-wrapper-wide">
      <div className="registro-card-wide">
        <div className="registro-header-wide">
          <img src={logosigat} alt="SIGAT" className="brand-logo" height={60} width={60} />
          <h2>Formulario registro</h2>
        </div>
        <form className="registro-grid" onSubmit={handleRegistro}>
          
          {/*Datos Personales */}
          <div className="form-column">
            <div className="input-group-grid">
              <label>Nombre(s)</label>
              <input type="text" name="nombre" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Apellido(s)</label>
              <input type="text" name="apellido" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Correo electrónico</label>
              <input type="email" name="correo" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Contraseña</label>
              <input type="password" name="password" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Confirmar contraseña</label>
              <input type="password" name="confirmPassword" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Teléfono</label>
              <input type="tel" name="telefono" required onChange={handleChange} />
            </div>
          </div>

          {/*Ubicación e Institución */}
          <div className="form-column">
            <div className="input-group-grid">
              <label>Rut</label>
              <input type="text" name="rut" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>País</label>
              <input type="text" name="pais" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Región</label>
              <input type="text" name="region" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Ciudad</label>
              <input type="text" name="ciudad" required onChange={handleChange} />
            </div>
            <div className="input-group-grid">
              <label>Institución</label>
              <input type="text" name="institucion" required onChange={handleChange} />
            </div>
          </div>

          {/*Acciones y Advertencia */}
          <div className="action-column">
            <p className="disclaimer-text">
              *La solicitud de registro<br/>
              puede demorar un mínimo de 24 horas para ser aceptada.
            </p>
            
            <button type="submit" className="btn-registro-submit">
              Registrarse
            </button>
            
            <div className="divider-circle">o</div>
            
            <button type="button" className="btn-registro-volver" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Registro;