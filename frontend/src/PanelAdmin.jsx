import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PanelAdmin.css';
import logosigat from './assets/logosigat.png';
import * as api from './api';
import Paginador from './Paginador';

const POR_PAGINA = 10;

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

// Convierte un User del backend al formato que usan las tablas del panel
const mapearUsuario = (u) => ({
    id: u.id,
    rut: u.rut,
    nombre: `${u.names || ''} ${u.surnames || ''}`.trim(),
    email: u.email,
    institucion: u.institution,
    ciudad: u.city,
    estado: u.active ? 'Activo' : 'Desactivado',
    esAdmin: u.role === 'ADMIN',
});

const mapearSolicitud = (u) => ({
    id: u.id,
    rut: u.rut,
    nombre: `${u.names || ''} ${u.surnames || ''}`.trim(),
    email: u.email,
    institucion: u.institution,
    estado: 'Pendiente',
});

// Texto legible según el tipo de acción del backend
const ACCION_TEXTO = {
    CREATION: 'Añadió punto',
    MODIFICATION: 'Modificó punto',
    DELETION: 'Eliminó punto',
    DEACTIVATION: 'Desactivó punto',
};

// Arma el detalle del informe a partir del punto y (si aplica) los valores modificados
const construirDetalle = (a) => {
    const d = {};
    if (a.point) {
        d.rut = a.point.rut;
        d.enfermedad = a.point.disease ? a.point.disease.name : '—';
        d.ciudad = a.point.city;
        d.cuadrante = a.point.quadrant ? a.point.quadrant.label : '—';
        d.enTratamiento = a.point.inTreatment;
        if (a.point.treatmentStart) d.fechaInicio = a.point.treatmentStart;
        if (a.point.nextControl) d.fechaProximoControl = a.point.nextControl;
    }
    if (a.pointModificationValues) {
        d.campoModificado = a.pointModificationValues.affectedField;
        d.valorAnterior = a.pointModificationValues.oldValue;
        d.valorNuevo = a.pointModificationValues.newValue;
    }
    return d;
};

// Convierte un PointAction del backend a la fila del historial
const mapearAccion = (a) => ({
    id: a.id,
    usuario: a.user ? `${a.user.names || ''} ${a.user.surnames || ''}`.trim() : '—',
    accion: ACCION_TEXTO[a.actionType] || a.actionType,
    lugar: a.point ? a.point.city : '—',
    fecha: a.dateTime,
    detalle: construirDetalle(a),
});

function PanelAdmin() {
    const navigate = useNavigate();

    // Vista activa: 'solicitudes' | 'usuarios' | 'historial'
    const [vista, setVista] = useState('solicitudes');

    // ---------- SOLICITUDES DE ACCESO ----------
    const [solicitudes, setSolicitudes] = useState([]);

    const cargarSolicitudes = async () => {
        try {
            const data = await api.getSolicitudesPendientes();
            setSolicitudes((data || []).map(mapearSolicitud));
        } catch {
            setSolicitudes([]);
        }
    };

    const handleAprobar = async (id) => {
        try {
            await api.aprobarUsuario(id); // el backend envía el correo de bienvenida
            await cargarSolicitudes();
            await cargarUsuarios();
        } catch (err) {
            alert(err.message || 'No se pudo aprobar la solicitud.');
        }
    };

    const handleRechazar = async (id) => {
        if (!window.confirm('¿Rechazar y eliminar esta solicitud?')) return;
        try {
            await api.eliminarUsuario(id);
            await cargarSolicitudes();
        } catch (err) {
            alert(err.message || 'No se pudo rechazar la solicitud.');
        }
    };

    // ---------- GESTIÓN DE USUARIOS ----------
    const [usuarios, setUsuarios] = useState([]);

    const cargarUsuarios = async () => {
        try {
            const data = await api.getUsuarios();
            setUsuarios((data || []).map(mapearUsuario));
        } catch {
            setUsuarios([]);
        }
    };

    // ---------- HISTORIAL ----------
    const [historial, setHistorial] = useState([]);

    const cargarHistorial = async () => {
        try {
            const data = await api.getHistorialGlobal();
            setHistorial((data || []).map(mapearAccion));
        } catch {
            setHistorial([]);
        }
    };

    // Cargar datos reales al montar el panel (patrón estándar de fetch-on-mount;
    // el aviso de "cascading renders" es un falso positivo para esta regla
    // experimental, ya que cada carga es independiente y actualiza su propio estado).
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        void cargarSolicitudes();
        void cargarUsuarios();
        void cargarHistorial();
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    // Página actual de cada tabla (independientes entre sí)
    const [paginaSolicitudes, setPaginaSolicitudes] = useState(1);
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const [paginaHistorial, setPaginaHistorial] = useState(1);

    // Los siguientes efectos ajustan la página actual de cada tabla cuando la
    // lista cambia de tamaño (filtro, aprobar/eliminar, nueva carga, etc.).
    // El aviso de "cascading renders" de esta regla experimental es un falso
    // positivo aquí: cada ajuste es independiente y solo corrige un número
    // de página fuera de rango, no encadena renders entre sí.
    /* eslint-disable react-hooks/set-state-in-effect */

    // Al cambiar de ciudad o búsqueda, vuelve a la página 1 (si no, podrías
    // quedar "varado" en una página que ya no existe para el nuevo filtro).
    useEffect(() => {
        setPaginaUsuarios(1);
    }, [ciudadSeleccionada, busqueda]);

    const usuariosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return usuarios.filter((u) => {
            const okCiudad = !ciudadSeleccionada || u.ciudad === ciudadSeleccionada;
            const okBusqueda =
                !q ||
                u.nombre.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.rut || '').toLowerCase().includes(q);
            return okCiudad && okBusqueda;
        });
    }, [usuarios, ciudadSeleccionada, busqueda]);

    // Si la lista se acorta (p. ej. al aprobar/eliminar) y la página actual
    // queda fuera de rango, retrocede automáticamente a la última válida.
    useEffect(() => {
        const total = Math.max(1, Math.ceil(solicitudes.length / POR_PAGINA));
        if (paginaSolicitudes > total) setPaginaSolicitudes(total);
    }, [solicitudes, paginaSolicitudes]);

    useEffect(() => {
        const total = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA));
        if (paginaUsuarios > total) setPaginaUsuarios(total);
    }, [usuariosFiltrados, paginaUsuarios]);

    // Recorte de cada lista a la página actual (10 por página)
    const solicitudesPagina = useMemo(() => {
        const inicio = (paginaSolicitudes - 1) * POR_PAGINA;
        return solicitudes.slice(inicio, inicio + POR_PAGINA);
    }, [solicitudes, paginaSolicitudes]);
    const totalPaginasSolicitudes = Math.max(1, Math.ceil(solicitudes.length / POR_PAGINA));

    const usuariosPagina = useMemo(() => {
        const inicio = (paginaUsuarios - 1) * POR_PAGINA;
        return usuariosFiltrados.slice(inicio, inicio + POR_PAGINA);
    }, [usuariosFiltrados, paginaUsuarios]);
    const totalPaginasUsuarios = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA));

    // Guarda de rango también para el historial
    useEffect(() => {
        const total = Math.max(1, Math.ceil(historial.length / POR_PAGINA));
        setPaginaHistorial((p) => (p > total ? total : p));
    }, [historial]);

    /* eslint-enable react-hooks/set-state-in-effect */

    const historialPagina = useMemo(() => {
        const inicio = (paginaHistorial - 1) * POR_PAGINA;
        return historial.slice(inicio, inicio + POR_PAGINA);
    }, [historial, paginaHistorial]);
    const totalPaginasHistorial = Math.max(1, Math.ceil(historial.length / POR_PAGINA));

    const usuariosPorCiudad = (ciudad) => usuarios.filter((u) => u.ciudad === ciudad).length;

    const toggleEstado = async (u) => {
        try {
            if (u.estado === 'Activo') {
                await api.desactivarUsuario(u.id); // correo de cuenta desactivada
            } else {
                await api.activarUsuario(u.id); // correo de cuenta reactivada
            }
            await cargarUsuarios();
        } catch (err) {
            alert(err.message || 'No se pudo cambiar el estado del usuario.');
        }
    };

    const toggleAdmin = async (u) => {
        try {
            await api.cambiarRolUsuario(u.id, !u.esAdmin); // correo de promoción/remoción
            await cargarUsuarios();
        } catch (err) {
            alert(err.message || 'No se pudo cambiar el rol del usuario.');
        }
    };

    const eliminarUsuario = async (id) => {
        if (!window.confirm('¿Eliminar definitivamente a este usuario?')) return;
        try {
            await api.eliminarUsuario(id);
            await cargarUsuarios();
        } catch (err) {
            alert(err.message || 'No se pudo eliminar el usuario.');
        }
    };

    const [informe, setInforme] = useState(null);

    const handleLogout = () => {
        api.logout();
        navigate('/');
    };

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
                                        solicitudesPagina.map((user) => (
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
                                <Paginador
                                    pagina={paginaSolicitudes}
                                    totalPaginas={totalPaginasSolicitudes}
                                    onCambiar={setPaginaSolicitudes}
                                />
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
                                                usuariosPagina.map((u) => (
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
                                                            <button className="btn-toggle" onClick={() => toggleEstado(u)}>
                                                                {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                                            </button>
                                                            <button className="btn-admin" onClick={() => toggleAdmin(u)}>
                                                                {u.esAdmin ? 'Quitar admin' : 'Dar admin'}
                                                            </button>
                                                            <button className="btn-reject" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                            </tbody>
                                        </table>
                                        <Paginador
                                            pagina={paginaUsuarios}
                                            totalPaginas={totalPaginasUsuarios}
                                            onCambiar={setPaginaUsuarios}
                                        />
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
                                        historialPagina.map((h) => (
                                            <tr key={h.id}>
                                                <td><strong>{h.usuario}</strong></td>
                                                <td>
                            <span className={
                                h.accion.includes('Añadió') ? 'badge-add'
                                    : (h.accion.includes('Eliminó') || h.accion.includes('Desactivó')) ? 'badge-del'
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
                                <Paginador
                                    pagina={paginaHistorial}
                                    totalPaginas={totalPaginasHistorial}
                                    onCambiar={setPaginaHistorial}
                                />
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
