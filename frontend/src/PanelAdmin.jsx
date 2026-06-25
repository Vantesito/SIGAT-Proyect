import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PanelAdmin.css';
import logosigat from './assets/logosigat.png';

// Ciudades disponibles en la barra lateral de gestión
const CIUDADES = [
    'Arica', 'Iquique', 'Antofagasta', 'La Serena', 'Valparaíso', 'Santiago',
    'Rancagua', 'Talca', 'Concepción', 'Temuco', 'Valdivia', 'Puerto Montt', 'Punta Arenas',
];

// Formatea una fecha ISO a algo legible
const fmtFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

function PanelAdmin() {
    const navigate = useNavigate();

    // Vista activa: 'solicitudes' | 'usuarios' | 'historial'
    const [vista, setVista] = useState('solicitudes');

    // ---------- SOLICITUDES DE ACCESO ----------
    const [solicitudes, setSolicitudes] = useState([
        { id: 1, rut: '12.345.678-9', nombre: 'Dra. María González', email: 'mgonzalez@institucion.cl', institucion: 'CESFAM Centro', estado: 'Pendiente' },
        { id: 2, rut: '22.345.678-9', nombre: 'Enf. Carlos Pérez', email: 'cperez@institucion.cl', institucion: 'Hospital Regional', estado: 'Pendiente' },
        { id: 3, rut: '12.345.678-k', nombre: 'TS. Laura Méndez', email: 'lmendez@institucion.cl', institucion: 'CESFAM Norte', estado: 'Pendiente' },
    ]);

    const handleAprobar = (id) => {
        setSolicitudes(solicitudes.filter((s) => s.id !== id));
        alert('Usuario aprobado. El sistema ha enviado un correo con las credenciales.');
    };

    const handleRechazar = (id) => {
        setSolicitudes(solicitudes.filter((s) => s.id !== id));
        alert('Solicitud rechazada y eliminada del sistema.');
    };

    // ---------- GESTIÓN DE USUARIOS ----------
    const [usuarios, setUsuarios] = useState([
        { id: 1, rut: '11.111.111-1', nombre: 'Dra. María González', email: 'mgonzalez@institucion.cl', institucion: 'CESFAM Centro', ciudad: 'Temuco', estado: 'Activo', esAdmin: false },
        { id: 2, rut: '22.222.222-2', nombre: 'Enf. Carlos Pérez', email: 'cperez@institucion.cl', institucion: 'Hospital Regional', ciudad: 'Temuco', estado: 'Activo', esAdmin: false },
        { id: 3, rut: '33.333.333-3', nombre: 'TS. Laura Méndez', email: 'lmendez@institucion.cl', institucion: 'CESFAM Norte', ciudad: 'Santiago', estado: 'Desactivado', esAdmin: false },
        { id: 4, rut: '44.444.444-4', nombre: 'Dr. Jorge Silva', email: 'jsilva@institucion.cl', institucion: 'Hospital El Salvador', ciudad: 'Santiago', estado: 'Activo', esAdmin: true },
        { id: 5, rut: '55.555.555-5', nombre: 'Mat. Ana Rojas', email: 'arojas@institucion.cl', institucion: 'CESFAM Valdivia', ciudad: 'Valdivia', estado: 'Activo', esAdmin: false },
        { id: 6, rut: '66.666.666-6', nombre: 'Dr. Pedro Tapia', email: 'ptapia@institucion.cl', institucion: 'Hospital Naval', ciudad: 'Valparaíso', estado: 'Desactivado', esAdmin: false },
    ]);

    const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    const usuariosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return usuarios.filter((u) => {
            const okCiudad = !ciudadSeleccionada || u.ciudad === ciudadSeleccionada;
            const okBusqueda =
                !q ||
                u.nombre.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.rut.toLowerCase().includes(q);
            return okCiudad && okBusqueda;
        });
    }, [usuarios, ciudadSeleccionada, busqueda]);

    const usuariosPorCiudad = (ciudad) => usuarios.filter((u) => u.ciudad === ciudad).length;

    const toggleEstado = (id) => {
        setUsuarios((prev) =>
            prev.map((u) => (u.id === id ? { ...u, estado: u.estado === 'Activo' ? 'Desactivado' : 'Activo' } : u))
        );
    };

    const toggleAdmin = (id) => {
        setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, esAdmin: !u.esAdmin } : u)));
    };

    const eliminarUsuario = (id) => {
        if (!window.confirm('¿Eliminar definitivamente a este usuario?')) return;
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
    };

    // ---------- HISTORIAL ----------
    const [historial] = useState([
        {
            id: 1, usuario: 'Dra. María González', accion: 'Añadió punto', lugar: 'Temuco',
            fecha: '2026-06-24T09:15:00',
            detalle: { rut: '12.345.678-9', enfermedad: 'Tuberculosis', ciudad: 'Temuco', enTratamiento: true, fechaInicio: '2026-05-10', fechaProximoControl: '2026-06-25' },
        },
        {
            id: 2, usuario: 'Enf. Carlos Pérez', accion: 'Modificó punto', lugar: 'Temuco',
            fecha: '2026-06-24T10:02:00',
            detalle: { rut: '9.876.543-2', enfermedad: 'Varicela', ciudad: 'Temuco', cambio: 'Marcó paciente en tratamiento' },
        },
        {
            id: 3, usuario: 'Dr. Jorge Silva', accion: 'Eliminó punto', lugar: 'Santiago',
            fecha: '2026-06-23T16:48:00',
            detalle: { rut: '15.111.222-3', enfermedad: 'Influenza', ciudad: 'Santiago', motivo: 'Registro duplicado' },
        },
    ]);

    const [informe, setInforme] = useState(null);

    const handleLogout = () => navigate('/');

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <img src={logosigat} alt="SIGAT Logo" width={50} height={50} />
                    <div>
                        <h2>Panel de administración</h2>
                    </div>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`nav-item ${vista === 'solicitudes' ? 'active' : ''}`}
                        onClick={() => setVista('solicitudes')}
                    >
                        Solicitudes de acceso
                    </button>
                    <button
                        className={`nav-item ${vista === 'usuarios' ? 'active' : ''}`}
                        onClick={() => setVista('usuarios')}
                    >
                        Gestión de usuarios
                    </button>
                    <button
                        className={`nav-item ${vista === 'historial' ? 'active' : ''}`}
                        onClick={() => setVista('historial')}
                    >
                        Historial de acciones
                    </button>

                    <button className="nav-item nav-item-map" onClick={() => navigate('/mapa')}>
                        Ir al mapa
                    </button>
                </nav>

                <button className="btn-logout-admin" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </aside>

            <main className="admin-main">
                {/* ====================== VISTA: SOLICITUDES ====================== */}
                {vista === 'solicitudes' && (
                    <>
                        <header className="admin-header">
                            <h1>Gestión de solicitudes</h1>
                            <p>Revisa y aprueba el acceso de los nuevos profesionales de salud al sistema.</p>
                        </header>
                        <section className="admin-content">
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>RUT</th>
                                        <th>Profesional</th>
                                        <th>Email institucional</th>
                                        <th>Institución</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {solicitudes.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="empty-state">No hay solicitudes pendientes.</td>
                                        </tr>
                                    ) : (
                                        solicitudes.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.rut}</td>
                                                <td><strong>{user.nombre}</strong></td>
                                                <td>{user.email}</td>
                                                <td>{user.institucion}</td>
                                                <td><span className="badge-warning">{user.estado}</span></td>
                                                <td className="action-cells">
                                                    <button className="btn-approve" onClick={() => handleAprobar(user.id)}>Aprobar</button>
                                                    <button className="btn-reject" onClick={() => handleRechazar(user.id)}>Rechazar</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {/* ====================== VISTA: GESTIÓN DE USUARIOS ====================== */}
                {vista === 'usuarios' && (
                    <>
                        <header className="admin-header">
                            <h1>Gestión de usuarios</h1>
                            <p>Selecciona una ciudad para ver sus usuarios o busca uno específico.</p>
                        </header>
                        <section className="admin-content gestion-layout">
                            {/* Barra de ciudades */}
                            <div className="ciudades-bar">
                                <h4>Ciudades</h4>
                                <button
                                    className={`ciudad-item ${ciudadSeleccionada === null ? 'active' : ''}`}
                                    onClick={() => setCiudadSeleccionada(null)}
                                >
                                    Todas
                                </button>
                                {CIUDADES.map((c) => (
                                    <button
                                        key={c}
                                        className={`ciudad-item ${ciudadSeleccionada === c ? 'active' : ''}`}
                                        onClick={() => setCiudadSeleccionada(c)}
                                    >
                                        {c}
                                        <span className="ciudad-count">{usuariosPorCiudad(c)}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Panel de usuarios */}
                            <div className="usuarios-panel">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Buscar por nombre, email o RUT..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />

                                {!ciudadSeleccionada && !busqueda.trim() ? (
                                    <div className="prompt-vacio">Selecciona una ciudad o escribe una búsqueda.</div>
                                ) : (
                                    <div className="table-container">
                                        <table className="admin-table">
                                            <thead>
                                            <tr>
                                                <th>RUT</th>
                                                <th>Profesional</th>
                                                <th>Email</th>
                                                <th>Ciudad</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {usuariosFiltrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="empty-state">No se encontraron usuarios.</td>
                                                </tr>
                                            ) : (
                                                usuariosFiltrados.map((u) => (
                                                    <tr key={u.id}>
                                                        <td>{u.rut}</td>
                                                        <td>
                                                            <strong>{u.nombre}</strong>
                                                            {u.esAdmin && <span className="badge-admin">Admin</span>}
                                                        </td>
                                                        <td>{u.email}</td>
                                                        <td>{u.ciudad}</td>
                                                        <td>
                                <span className={u.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}>
                                  {u.estado}
                                </span>
                                                        </td>
                                                        <td className="action-cells">
                                                            <button className="btn-toggle" onClick={() => toggleEstado(u.id)}>
                                                                {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                                            </button>
                                                            <button className="btn-admin" onClick={() => toggleAdmin(u.id)}>
                                                                {u.esAdmin ? 'Quitar admin' : 'Dar admin'}
                                                            </button>
                                                            <button className="btn-reject" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* ====================== VISTA: HISTORIAL ====================== */}
                {vista === 'historial' && (
                    <>
                        <header className="admin-header">
                            <h1>Historial de acciones</h1>
                            <p>Registro de movimientos realizados por los usuarios sobre los puntos del mapa.</p>
                        </header>
                        <section className="admin-content">
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Lugar</th>
                                        <th>Fecha y hora</th>
                                        <th>Informe</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {historial.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-state">No hay acciones registradas.</td>
                                        </tr>
                                    ) : (
                                        historial.map((h) => (
                                            <tr key={h.id}>
                                                <td><strong>{h.usuario}</strong></td>
                                                <td>
                            <span className={
                                h.accion.includes('Añadió') ? 'badge-add'
                                    : h.accion.includes('Eliminó') ? 'badge-del'
                                        : 'badge-mod'
                            }>
                              {h.accion}
                            </span>
                                                </td>
                                                <td>{h.lugar}</td>
                                                <td>{fmtFecha(h.fecha)}</td>
                                                <td>
                                                    <button className="btn-approve" onClick={() => setInforme(h)}>Ver informe</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* MODAL: INFORME DEL HISTORIAL */}
            {informe && (
                <div className="modal-overlay-admin" onClick={() => setInforme(null)}>
                    <div className="modal-content-admin" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-admin">
                            <h3>Informe de acción</h3>
                            <button className="btn-close-admin" onClick={() => setInforme(null)}>&times;</button>
                        </div>
                        <div className="modal-body-admin">
                            <p><strong>Usuario:</strong> {informe.usuario}</p>
                            <p><strong>Acción:</strong> {informe.accion}</p>
                            <p><strong>Lugar:</strong> {informe.lugar}</p>
                            <p><strong>Fecha:</strong> {fmtFecha(informe.fecha)}</p>
                            <hr />
                            <h4>Detalle del registro</h4>
                            <ul className="informe-detalle">
                                {Object.entries(informe.detalle).map(([clave, valor]) => (
                                    <li key={clave}>
                                        <span className="informe-clave">{clave}:</span>{' '}
                                        {typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : String(valor)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PanelAdmin;