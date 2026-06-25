import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import './Mapa.css';

// Listas compartidas (mantienen sincronizados formulario y filtros)
const ENFERMEDADES = ['Tuberculosis', 'Varicela', 'Influenza', 'COVID-19', 'Sarampión'];

const CIUDADES_CHILE = [
    { nombre: 'Arica', lng: -70.3126, lat: -18.4783 },
    { nombre: 'Iquique', lng: -70.1503, lat: -20.2307 },
    { nombre: 'Antofagasta', lng: -70.4000, lat: -23.6500 },
    { nombre: 'Copiapó', lng: -70.3314, lat: -27.3668 },
    { nombre: 'La Serena', lng: -71.2500, lat: -29.9027 },
    { nombre: 'Valparaíso', lng: -71.6197, lat: -33.0472 },
    { nombre: 'Viña del Mar', lng: -71.5518, lat: -33.0245 },
    { nombre: 'Santiago', lng: -70.6483, lat: -33.4569 },
    { nombre: 'Rancagua', lng: -70.7444, lat: -34.1708 },
    { nombre: 'Talca', lng: -71.6554, lat: -35.4264 },
    { nombre: 'Chillán', lng: -72.1034, lat: -36.6066 },
    { nombre: 'Concepción', lng: -73.0498, lat: -36.8270 },
    { nombre: 'Temuco', lng: -72.5904, lat: -38.7397 },
    { nombre: 'Valdivia', lng: -73.2459, lat: -39.8142 },
    { nombre: 'Osorno', lng: -73.1333, lat: -40.5736 },
    { nombre: 'Puerto Montt', lng: -72.9411, lat: -41.4693 },
    { nombre: 'Coyhaique', lng: -72.0666, lat: -45.5712 },
    { nombre: 'Punta Arenas', lng: -70.9171, lat: -53.1638 },
];

const getCiudad = (nombre) => CIUDADES_CHILE.find((c) => c.nombre === nombre);

// Pequeño desplazamiento para "anonimizar por cuadrante"
const jitter = () => (Math.random() - 0.5) * 0.03;

// Fecha de hoy + n días en formato yyyy-mm-dd (para inputs date)
const hoyMas = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};

// Días que faltan para una fecha (negativo = vencido). null si no hay fecha.
const diasHastaControl = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha + 'T00:00:00');
    return Math.round((f - hoy) / (1000 * 60 * 60 * 24));
};

// Alerta = control vencido o dentro de 2 días (1-2 días antes del límite)
const esAlerta = (dias) => dias !== null && dias <= 2;

const FORM_VACIO = {
    rut: '',
    enfermedad: 'Tuberculosis',
    ciudad: 'Temuco',
    domicilio: '',
    enTratamiento: false,
    fechaInicio: '',
    fechaProximoControl: '',
};

function Mapa() {
    const navigate = useNavigate();

    // REFERENCIAS PARA OPENLAYERS
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const vectorSourceRef = useRef(new VectorSource());
    const primerRender = useRef(true);

    // DATOS PRINCIPALES (cada caso = un paciente)
    const [casos, setCasos] = useState([]);

    // MODALES
    const [showModal, setShowModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // PANEL DESPLEGABLE DE TABLAS: null | 'casos' | 'tratamiento'
    const [panelAbierto, setPanelAbierto] = useState(null);

    // FORMULARIO (sirve para crear y editar)
    const [form, setForm] = useState(FORM_VACIO);
    const [editId, setEditId] = useState(null);

    // CARGA MASIVA
    const [archivoLote, setArchivoLote] = useState(null);
    const [errorLote, setErrorLote] = useState('');

    // FILTROS
    const [filtroActual, setFiltroActual] = useState({ ciudad: 'Todas', enfermedad: 'Todas' });
    const [tempFiltro, setTempFiltro] = useState({ ciudad: 'Todas', enfermedad: 'Todas' });

    // ---------- DERIVADOS ----------
    const casosFiltrados = useMemo(
        () =>
            casos.filter((c) => {
                const okEnf = filtroActual.enfermedad === 'Todas' || c.enfermedad === filtroActual.enfermedad;
                const okCiu = filtroActual.ciudad === 'Todas' || c.ciudad === filtroActual.ciudad;
                return okEnf && okCiu;
            }),
        [casos, filtroActual]
    );

    const enTratamiento = useMemo(
        () => casosFiltrados.filter((c) => c.enTratamiento),
        [casosFiltrados]
    );

    const enAlerta = useMemo(
        () => enTratamiento.filter((c) => esAlerta(diasHastaControl(c.fechaProximoControl))),
        [enTratamiento]
    );

    // ---------- INICIALIZAR MAPA ----------
    useEffect(() => {
        if (!mapRef.current) {
            const baseLayer = new TileLayer({ source: new OSM() });
            const heatMapLayer = new Heatmap({
                source: vectorSourceRef.current,
                blur: 18,
                radius: 12,
                // Peso constante por caso: la intensidad nace de la CONCENTRACIÓN
                // geográfica (puntos que se solapan), no del total de la ciudad.
                weight: () => 1,
            });

            mapRef.current = new Map({
                target: mapElement.current,
                layers: [baseLayer, heatMapLayer],
                view: new View({ center: fromLonLat([-72.5904, -38.7397]), zoom: 13 }),
            });
        }

        // Carga inicial simulada (incluye casos en tratamiento para ver la alerta)
        setTimeout(() => {
            const t = getCiudad('Temuco');
            setCasos([
                {
                    id: 1, rut: '12.345.678-9', enfermedad: 'Tuberculosis', ciudad: 'Temuco',
                    domicilio: 'Av. Alemania 0123', lng: t.lng + jitter(), lat: t.lat + jitter(),
                    enTratamiento: true, fechaInicio: hoyMas(-40), fechaProximoControl: hoyMas(1),
                },
                {
                    id: 2, rut: '9.876.543-2', enfermedad: 'Varicela', ciudad: 'Temuco',
                    domicilio: 'Calle Prat 456', lng: t.lng + jitter(), lat: t.lat + jitter(),
                    enTratamiento: false, fechaInicio: '', fechaProximoControl: '',
                },
                {
                    id: 3, rut: '15.111.222-3', enfermedad: 'Tuberculosis', ciudad: 'Temuco',
                    domicilio: 'Av. Caupolicán 789', lng: t.lng + jitter(), lat: t.lat + jitter(),
                    enTratamiento: true, fechaInicio: hoyMas(-10), fechaProximoControl: hoyMas(12),
                },
            ]);
        }, 800);

        return () => {
            if (mapRef.current) {
                mapRef.current.setTarget(null);
                mapRef.current = null;
            }
        };
    }, []);

    // ---------- RECONSTRUIR PUNTOS DEL MAPA SEGÚN FILTRO ----------
    useEffect(() => {
        const src = vectorSourceRef.current;
        src.clear();
        const features = casosFiltrados.map(
            (c) => new Feature({ geometry: new Point(fromLonLat([c.lng, c.lat])) })
        );
        features.forEach((f) => f.set('weight', 1));
        src.addFeatures(features);
    }, [casosFiltrados]);

    // ---------- RECENTRAR EL MAPA AL CAMBIAR DE CIUDAD ----------
    useEffect(() => {
        if (primerRender.current) {
            primerRender.current = false;
            return;
        }
        if (!mapRef.current) return;
        const view = mapRef.current.getView();
        if (filtroActual.ciudad === 'Todas') {
            view.animate({ center: fromLonLat([-71, -37]), zoom: 4 }); // Chile completo
        } else {
            const c = getCiudad(filtroActual.ciudad);
            if (c) view.animate({ center: fromLonLat([c.lng, c.lat]), zoom: 12 });
        }
    }, [filtroActual.ciudad]);

    // ---------- ABRIR / CERRAR FORMULARIO ----------
    const abrirNuevo = () => {
        setEditId(null);
        setForm({ ...FORM_VACIO, ciudad: filtroActual.ciudad !== 'Todas' ? filtroActual.ciudad : 'Temuco' });
        setShowModal(true);
    };

    const abrirEditar = (caso) => {
        setEditId(caso.id);
        setForm({
            rut: caso.rut,
            enfermedad: caso.enfermedad,
            ciudad: caso.ciudad,
            domicilio: caso.domicilio || '',
            enTratamiento: caso.enTratamiento,
            fechaInicio: caso.fechaInicio || '',
            fechaProximoControl: caso.fechaProximoControl || '',
        });
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm(FORM_VACIO);
    };

    // ---------- GUARDAR (crear o editar) ----------
    const handleGuardar = (e) => {
        e.preventDefault();
        const datos = {
            rut: form.rut,
            enfermedad: form.enfermedad,
            ciudad: form.ciudad,
            domicilio: form.domicilio,
            enTratamiento: form.enTratamiento,
            fechaInicio: form.enTratamiento ? form.fechaInicio : '',
            fechaProximoControl: form.enTratamiento ? form.fechaProximoControl : '',
        };

        if (editId) {
            setCasos((prev) =>
                prev.map((c) => {
                    if (c.id !== editId) return c;
                    // Si cambió de ciudad, reubicamos el punto; si no, mantenemos coords
                    let { lng, lat } = c;
                    if (c.ciudad !== datos.ciudad) {
                        const ci = getCiudad(datos.ciudad) || getCiudad('Temuco');
                        lng = ci.lng + jitter();
                        lat = ci.lat + jitter();
                    }
                    return { ...c, ...datos, lng, lat };
                })
            );
        } else {
            const ci = getCiudad(datos.ciudad) || getCiudad('Temuco');
            setCasos((prev) => [
                ...prev,
                { id: Date.now(), ...datos, lng: ci.lng + jitter(), lat: ci.lat + jitter() },
            ]);
        }
        cerrarModal();
    };

    // ---------- ELIMINAR ----------
    const eliminarCaso = (id) => {
        if (!window.confirm('¿Eliminar este registro? También se quitará del mapa.')) return;
        setCasos((prev) => prev.filter((c) => c.id !== id));
    };

    // ---------- CARGA MASIVA ----------
    const ejecutarCargaExitosa = () => {
        const ciudadBase = filtroActual.ciudad !== 'Todas' ? filtroActual.ciudad : 'Temuco';
        const ci = getCiudad(ciudadBase);
        const nuevos = Array.from({ length: 15 }).map(() => {
            const tratamiento = Math.random() > 0.5;
            return {
                id: Date.now() + Math.floor(Math.random() * 100000),
                rut: `${Math.floor(Math.random() * 25) + 5}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`,
                enfermedad: ENFERMEDADES[Math.floor(Math.random() * ENFERMEDADES.length)],
                ciudad: ciudadBase,
                domicilio: 'Importado por lote',
                lng: ci.lng + jitter() * 2,
                lat: ci.lat + jitter() * 2,
                enTratamiento: tratamiento,
                fechaInicio: tratamiento ? hoyMas(-Math.floor(Math.random() * 30)) : '',
                fechaProximoControl: tratamiento ? hoyMas(Math.floor(Math.random() * 8)) : '',
            };
        });
        setCasos((prev) => [...prev, ...nuevos]);
        setShowBatchModal(false);
        setArchivoLote(null);
    };

    const handleCargaMasiva = (e) => {
        e.preventDefault();
        setErrorLote('');
        if (!archivoLote) return setErrorLote('Adjunte un archivo.');
        if (archivoLote.name.toLowerCase().includes('error')) {
            setErrorLote('Error de validación en el archivo.');
        } else {
            ejecutarCargaExitosa();
        }
    };

    // ---------- FILTROS ----------
    const aplicarFiltro = (e) => {
        e.preventDefault();
        setFiltroActual(tempFiltro);
        setShowFilterModal(false);
    };

    const limpiarFiltro = () => {
        const limpio = { ciudad: 'Todas', enfermedad: 'Todas' };
        setTempFiltro(limpio);
        setFiltroActual(limpio);
        setShowFilterModal(false);
    };

    const abrirFiltro = () => {
        setTempFiltro(filtroActual);
        setShowFilterModal(true);
    };

    const handleLogout = () => navigate('/');

    const togglePanel = (cual) => setPanelAbierto((prev) => (prev === cual ? null : cual));

    // Texto de los días para la tabla de tratamiento
    const textoDias = (dias) => {
        if (dias === null) return '—';
        if (dias < 0) return `Vencido (${Math.abs(dias)}d)`;
        if (dias === 0) return 'Hoy';
        return `En ${dias} día${dias === 1 ? '' : 's'}`;
    };

    return (
        <div className="mapa-dashboard">
            <aside className="mapa-sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-header">
                        <h2>Panel de Control</h2>
                        <span className="user-role">Dr./ Trabajador social</span>
                    </div>

                    <div className="stats-container">
                        <div className="stat-card">
                            <div className="stat-info">
                                <span className="stat-label">Nro. Casos</span>
                                <strong className="stat-value">{casosFiltrados.length || '-'}</strong>
                            </div>
                            <button
                                className={`stat-btn-icon ${panelAbierto === 'casos' ? 'open' : ''}`}
                                onClick={() => togglePanel('casos')}
                                title="Ver tabla de casos"
                            >
                                &#9654;
                            </button>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <span className="stat-label">Alerta Tratamiento</span>
                                <strong className="stat-value">{enAlerta.length || '-'}</strong>
                            </div>
                            <button
                                className={`stat-btn-icon ${panelAbierto === 'tratamiento' ? 'open' : ''}`}
                                onClick={() => togglePanel('tratamiento')}
                                title="Ver alertas de tratamiento"
                            >
                                &#9654;
                            </button>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="btn-outline-dark" onClick={abrirFiltro}>
                            Filtrar Ciudad/Enfermedad
                            {(filtroActual.enfermedad !== 'Todas' || filtroActual.ciudad !== 'Todas') && (
                                <span style={{ color: '#2b7bbc', marginLeft: '5px' }}>●</span>
                            )}
                        </button>
                        <button className="btn-outline-dark" onClick={abrirNuevo}>
                            Ingresar nuevo registro
                        </button>
                        <button className="btn-outline-dark" onClick={() => setShowBatchModal(true)}>
                            Carga masiva (Excel)
                        </button>
                    </div>
                </div>

                <button className="btn-logout-outline" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </aside>

            <main className="mapa-container">
                <div ref={mapElement} className="ol-map-container" />

                {/* PANEL DESPLEGABLE CON LAS TABLAS */}
                {panelAbierto && (
                    <div className="data-panel">
                        <div className="data-panel-header">
                            <h3>{panelAbierto === 'casos' ? 'Casos registrados' : 'Alertas de tratamiento'}</h3>
                            <button className="btn-close-panel" onClick={() => setPanelAbierto(null)}>
                                &times;
                            </button>
                        </div>

                        <div className="data-panel-body">
                            {panelAbierto === 'casos' ? (
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>RUT</th>
                                        <th>Enfermedad</th>
                                        <th>Ciudad</th>
                                        <th>Tratam.</th>
                                        <th>Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {casosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="tabla-vacia">No hay casos para este filtro.</td>
                                        </tr>
                                    ) : (
                                        casosFiltrados.map((c) => (
                                            <tr key={c.id}>
                                                <td>{c.rut}</td>
                                                <td>{c.enfermedad}</td>
                                                <td>{c.ciudad}</td>
                                                <td>{c.enTratamiento ? 'Sí' : 'No'}</td>
                                                <td className="acciones-celda">
                                                    <button className="btn-mini-edit" onClick={() => abrirEditar(c)}>Editar</button>
                                                    <button className="btn-mini-del" onClick={() => eliminarCaso(c.id)}>Eliminar</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            ) : (
                                <>
                                    <div className="alerta-leyenda">
                                        <span className="dot-red" /> Próximo control vencido o en ≤ 2 días
                                    </div>
                                    <table className="data-table">
                                        <thead>
                                        <tr>
                                            <th>RUT</th>
                                            <th>Enfermedad</th>
                                            <th>Inicio</th>
                                            <th>Próx. control</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {enTratamiento.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="tabla-vacia">No hay pacientes en tratamiento.</td>
                                            </tr>
                                        ) : (
                                            enTratamiento.map((c) => {
                                                const dias = diasHastaControl(c.fechaProximoControl);
                                                const alerta = esAlerta(dias);
                                                return (
                                                    <tr key={c.id} className={alerta ? 'fila-alerta' : ''}>
                                                        <td>{c.rut}</td>
                                                        <td>{c.enfermedad}</td>
                                                        <td>{c.fechaInicio || '—'}</td>
                                                        <td>{c.fechaProximoControl || '—'}</td>
                                                        <td>{textoDias(dias)}</td>
                                                        <td className="acciones-celda">
                                                            <button className="btn-mini-edit" onClick={() => abrirEditar(c)}>Editar</button>
                                                            <button className="btn-mini-del" onClick={() => eliminarCaso(c.id)}>Eliminar</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL: FILTROS */}
            {showFilterModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header" style={{ backgroundColor: '#1e293b' }}>
                            <h3>Filtrar mapa</h3>
                            <button className="btn-close" onClick={() => setShowFilterModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={aplicarFiltro} className="modal-form">
                            <div className="form-group">
                                <label>Ciudad</label>
                                <select value={tempFiltro.ciudad} onChange={(e) => setTempFiltro({ ...tempFiltro, ciudad: e.target.value })}>
                                    <option value="Todas">Todas las ciudades</option>
                                    {CIUDADES_CHILE.map((c) => (
                                        <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Enfermedad</label>
                                <select value={tempFiltro.enfermedad} onChange={(e) => setTempFiltro({ ...tempFiltro, enfermedad: e.target.value })}>
                                    <option value="Todas">Todas las enfermedades</option>
                                    {ENFERMEDADES.map((en) => (
                                        <option key={en} value={en}>{en}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={limpiarFiltro}>Limpiar filtros</button>
                                <button type="submit" className="btn-save" style={{ backgroundColor: '#1e293b' }}>Aplicar filtro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: INGRESO / EDICIÓN */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header" style={{ backgroundColor: '#1e293b' }}>
                            <h3>{editId ? 'Editar caso' : 'Añadir nuevo caso'}</h3>
                            <button className="btn-close" onClick={cerrarModal}>&times;</button>
                        </div>
                        <form onSubmit={handleGuardar} className="modal-form">
                            <div className="form-group">
                                <label>RUT del Paciente</label>
                                <input type="text" placeholder="12.345.678-9" required value={form.rut}
                                       onChange={(e) => setForm({ ...form, rut: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Enfermedad</label>
                                <select required value={form.enfermedad} onChange={(e) => setForm({ ...form, enfermedad: e.target.value })}>
                                    {ENFERMEDADES.map((en) => (
                                        <option key={en} value={en}>{en}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Ciudad</label>
                                <select required value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })}>
                                    {CIUDADES_CHILE.map((c) => (
                                        <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Domicilio del paciente</label>
                                <input type="text" placeholder="Ej: Av. Alemania 0123" required value={form.domicilio}
                                       onChange={(e) => setForm({ ...form, domicilio: e.target.value })} />
                                <small>La ubicación se anonimizará automáticamente a un cuadrante.</small>
                            </div>

                            {/* Tratamiento */}
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={form.enTratamiento}
                                           onChange={(e) => setForm({ ...form, enTratamiento: e.target.checked })} />
                                    ¿Paciente en tratamiento?
                                </label>
                            </div>

                            {form.enTratamiento && (
                                <div className="fechas-tratamiento">
                                    <div className="form-group">
                                        <label>Inicio del tratamiento</label>
                                        <input type="date" required value={form.fechaInicio}
                                               onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha próximo control</label>
                                        <input type="date" required value={form.fechaProximoControl}
                                               onChange={(e) => setForm({ ...form, fechaProximoControl: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn-save" style={{ backgroundColor: '#1e293b' }}>
                                    {editId ? 'Guardar cambios' : 'Guardar registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CARGA MASIVA */}
            {showBatchModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header" style={{ backgroundColor: '#1e293b' }}>
                            <h3>Carga masiva de registros</h3>
                            <button className="btn-close" onClick={() => setShowBatchModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCargaMasiva} className="modal-form">
                            {errorLote && (
                                <div className="error-alert">
                                    <strong> Error de validación</strong>
                                    <p>{errorLote}</p>
                                </div>
                            )}
                            <div className="form-group file-upload-group">
                                <label>Archivo de datos (.xlsx, .csv)</label>
                                <input type="file" accept=".xlsx, .xls, .csv" required onChange={(e) => setArchivoLote(e.target.files[0])} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowBatchModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-save" style={{ backgroundColor: '#1e293b' }}>Procesar Archivo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Mapa;