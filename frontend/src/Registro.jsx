import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
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
    const [exito, setExito] = useState(false);

    // Guardia adicional contra doble envío (clic doble, Enter repetido, etc.):
    // 'enviando' ya deshabilita el botón, pero un ref sincrónico evita que una
    // segunda petición se dispare incluso si el evento llega antes del re-render.
    const enviandoRef = useRef(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        if (enviandoRef.current) return; // ya hay un envío en curso, ignora este
        setErrorMensaje('');

        if (formData.password !== formData.confirmPassword) {
            setErrorMensaje('Las contraseñas no coinciden. Por favor, verifique.');
            return;
        }

        enviandoRef.current = true;
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
            // Mensaje en pantalla (no alert(), que puede quedar bloqueado en
            // algunos entornos embebidos) + redirección tras una pausa breve
            // para que la persona alcance a leer la confirmación.
            setExito(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setErrorMensaje(err.message || 'No se pudo completar el registro.');
            enviandoRef.current = false;
            setEnviando(false);
        }
    };

    if (exito) {
        return (
            <div className="registro-wrapper-wide">
                <div className="registro-card-wide">
                    <div className="registro-header-wide">
                        <img src={logosigat} alt="SIGAT" className="brand-logo" height={60} width={60} />
                        <h2>¡Solicitud enviada!</h2>
                    </div>
                    <div className="registro-exito">
                        <p>Tu solicitud de registro fue enviada con éxito.</p>
                        <p>Un administrador debe aprobarla antes de que puedas iniciar sesión.</p>
                        <p className="registro-exito-redirigiendo">Redirigiendo al inicio de sesión…</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Apellido(s)</label>
                            <input type="text" name="apellido" required value={formData.apellido} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Correo electrónico</label>
                            <input type="email" name="correo" required value={formData.correo} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Contraseña</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Confirmar contraseña</label>
                            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Teléfono</label>
                            <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} disabled={enviando} />
                        </div>
                    </div>

                    {/*Ubicación e Institución */}
                    <div className="form-column">
                        <div className="input-group-grid">
                            <label>Rut</label>
                            <input type="text" name="rut" required value={formData.rut} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>País</label>
                            <input type="text" name="pais" required value={formData.pais} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Región</label>
                            <input type="text" name="region" required value={formData.region} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Ciudad</label>
                            <input type="text" name="ciudad" required value={formData.ciudad} onChange={handleChange} disabled={enviando} />
                        </div>
                        <div className="input-group-grid">
                            <label>Institución</label>
                            <input type="text" name="institucion" required value={formData.institucion} onChange={handleChange} disabled={enviando} />
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

                        <button type="button" className="btn-registro-volver" onClick={() => navigate('/')} disabled={enviando}>
                            Volver al inicio
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default Registro;
