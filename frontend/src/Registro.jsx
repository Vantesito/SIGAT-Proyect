import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Registro.css';
import logosigat from './assets/logosigat.png';
import { register } from './api';

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
    const [errorMensaje, setErrorMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        setErrorMensaje('');

        if (formData.password !== formData.confirmPassword) {
            setErrorMensaje('Las contraseñas no coinciden. Por favor, verifique.');
            return;
        }

        setEnviando(true);
        try {
            await register({
                email: formData.correo,
                confirmation_email: formData.correo,
                names: formData.nombre,
                surnames: formData.apellido,
                password: formData.password,
                phone_number: formData.telefono,
                rut: formData.rut,
                country: formData.pais,
                region: formData.region,
                city: formData.ciudad,
                institution: formData.institucion,
            });
            alert('Solicitud de registro enviada con éxito.');
            navigate('/login');
        } catch (err) {
            // El backend devuelve el motivo (email o RUT en uso, correos que no coinciden, etc.)
            setErrorMensaje(err.message || 'No se pudo completar el registro.');
        } finally {
            setEnviando(false);
        }
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
                        {errorMensaje && (
                            <div className="error-alert-login">
                                {errorMensaje}
                            </div>
                        )}

                        <p className="disclaimer-text">
                            *La solicitud de registro<br/>
                            puede demorar un mínimo de 24 horas para ser aceptada.
                        </p>

                        <button type="submit" className="btn-registro-submit" disabled={enviando}>
                            {enviando ? 'Enviando…' : 'Registrarse'}
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
