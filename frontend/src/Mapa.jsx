import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Heatmap from 'ol/layer/Heatmap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Stroke } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import './Mapa.css';
import CargaMasivaModal from './CargaMasivaModal';
import {
    getPuntosActivos,
    getPuntosPorEnfermedad,
    getEnfermedades,
    crearPunto,
    desactivarPunto,
    logout,
} from './api';

// Ciudades para el selector y el recentrado del mapa
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

// Constantes del cuadrante (para la grilla dibujada; coinciden con el backend)
const CELL_SIZE_M = 50;
const M_PER_DEG_LAT = 111320;
const ZOOM_MINIMO_GRILLA = 16;

const diasHastaControl = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha + 'T00:00:00');
    return Math.round((f - hoy) / (1000 * 60 * 60 * 24));
};

const esAlerta = (dias) => dias !== null && dias <= 2;

const FORM_VACIO = {
    rut: '',
    enfermedadId: '',
    ciudad: 'Temuco',
    domicilio: '',
    enTratamiento: false,
    fechaInicio: '',
    fechaProximoControl: '',
};

// Convierte un Point del backend al formato que usan las tablas y el heatmap.
const mapearPunto = (p) => ({
    id: p.id,
    rut: p.rut,
    enfermedad: p.disease ? p.disease.name : '',
    diseaseId: p.disease ? p.disease.id : null,
    ciudad: p.city,
    lng: p.quadrant ? p.quadrant.centerLng : null,
    lat: p.quadrant ? p.quadrant.centerLat : null,
    quadrante: p.quadrant ? p.quadrant.label : '—',
    enTratamiento: p.inTreatment,
    fechaInicio: p.treatmentStart || '',
    fechaProximoControl: p.nextControl || '',
});

function Mapa() {
    const navigate = useNavigate();

    // REFERENCIAS OPENLAYERS
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const vectorSourceRef = useRef(new VectorSource());
    const gridSourceRef = useRef(new VectorSource());
    const primerRender = useRef(true);

    // DATOS DEL BACKEND
    const [casos, setCasos] = useState([]);
    const [enfermedades, setEnfermedades] = useState([]); // [{id, name}]
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState('');

    // MODALES
    const [showModal, setShowModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // PANEL DE TABLAS
    const [panelAbierto, setPanelAbierto] = useState(null);

    // FORMULARIO DE CREACIÓN
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    // FILTROS: enfermedadId = 'Todas' o el id de la enfermedad
    const [filtroActual, setFiltroActual] = useState({ ciudad: 'Todas', enfermedadId: 'Todas' });
    const [tempFiltro, setTempFiltro] = useState({ ciudad: 'Todas', enfermedadId: 'Todas' });

    // ---------- CARGA DE PUNTOS DESDE EL BACKEND ----------
    const cargarPuntos = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const data =
                filtroActual.enfermedadId === 'Todas'
                    ? await getPuntosActivos()
                    : await getPuntosPorEnfermedad(filtroActual.enfermedadId);
            setCasos((data || []).map(mapearPunto));
        } catch {
            setErrorCarga('No se pudieron cargar los puntos del servidor.');
            setCasos([]);
        } finally {
            setCargando(false);
        }
    };

    // Cargar enfermedades una vez (para los selectores)
    useEffect(() => {
        getEnfermedades()
            .then((data) => setEnfermedades(data || []))
            .catch(() => setEnfermedades([]));
    }, []);

    // Cargar/recargar puntos cuando cambia el filtro de enfermedad
    useEffect(() => {
        void cargarPuntos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroActual.enfermedadId]);

    // ---------- DERIVADOS (el filtro de ciudad se aplica en el front) ----------
    const casosFiltrados = useMemo(
        () => casos.filter((c) => filtroActual.ciudad === 'Todas' || c.ciudad === filtroActual.ciudad),
        [casos, filtroActual.ciudad]
    );

    const enTratamiento = useMemo(
        () => casosFiltrados.filter((c) => c.enTratamiento),
        [casosFiltrados]
    );

    const enAlerta = useMemo(
        () => enTratamiento.filter((c) => esAlerta(diasHastaControl(c.fechaProximoControl))),
        [enTratamiento]
    );

    // ---------- GRILLA DE CUADRANTES (solo zoom cercano) ----------
    const dibujarGrilla = () => {
        if (!mapRef.current) return;
        const src = gridSourceRef.current;
        src.clear();

        const view = mapRef.current.getView();
        if (view.getZoom() < ZOOM_MINIMO_GRILLA) return;

        const extent = view.calculateExtent(mapRef.current.getSize());
        const [minLng, minLat] = toLonLat([extent[0], extent[1]]);
        const [maxLng, maxLat] = toLonLat([extent[2], extent[3]]);

        const latStep = CELL_SIZE_M / M_PER_DEG_LAT;
        const startRow = Math.floor(minLat / latStep);
        const endRow = Math.ceil(maxLat / latStep);

        for (let r = startRow; r <= endRow; r++) {
            const latBottom = r * latStep;
            const latTop = (r + 1) * latStep;
            src.addFeature(
                new Feature(new LineString([fromLonLat([minLng, latBottom]), fromLonLat([maxLng, latBottom])]))
            );
            const bandLat = (r + 0.5) * latStep;
            const lngStep = CELL_SIZE_M / (M_PER_DEG_LAT * Math.cos((bandLat * Math.PI) / 180));
            const startCol = Math.floor(minLng / lngStep);
            const endCol = Math.ceil(maxLng / lngStep);
            for (let c = startCol; c <= endCol; c++) {
                const lng = c * lngStep;
                src.addFeature(
                    new Feature(new LineString([fromLonLat([lng, latBottom]), fromLonLat([lng, latTop])]))
                );
            }
        }
    };

    // ---------- INICIALIZAR MAPA ----------
    useEffect(() => {
        if (!mapRef.current) {
            const baseLayer = new TileLayer({ source: new OSM() });
            const heatMapLayer = new Heatmap({
                source: vectorSourceRef.current,
                blur: 18,
                radius: 12,
                weight: () => 1,
            });
            const gridLayer = new VectorLayer({
                source: gridSourceRef.current,
                style: new Style({ stroke: new Stroke({ color: 'rgba(0, 128, 128, 0.35)', width: 1 }) }),
            });

            mapRef.current = new Map({
                target: mapElement.current,
                layers: [baseLayer, heatMapLayer, gridLayer],
                view: new View({ center: fromLonLat([-72.5904, -38.7397]), zoom: 13 }),
            });

            mapRef.current.on('moveend', dibujarGrilla);
            dibujarGrilla();
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.setTarget(null);
                mapRef.current = null;
            }
        };
    }, []);

    // ---------- DIBUJAR PUNTOS EN EL MAPA ----------
    useEffect(() => {
        const src = vectorSourceRef.current;
        src.clear();
        const features = casosFiltrados
            .filter((c) => c.lng != null && c.lat != null)
            .map((c) => new Feature({ geometry: new Point(fromLonLat([c.lng, c.lat])) }));
        features.forEach((f) => f.set('weight', 1));
        src.addFeatures(features);
    }, [casosFiltrados]);

    // ---------- RECENTRAR AL CAMBIAR CIUDAD ----------
    useEffect(() => {
        if (primerRender.current) {
            primerRender.current = false;
            return;
        }
        if (!mapRef.current) return;
        const view = mapRef.current.getView();
        if (filtroActual.ciudad === 'Todas') {
            view.animate({ center: fromLonLat([-71, -37]), zoom: 4 });
        } else {
            const c = getCiudad(filtroActual.ciudad);
            if (c) view.animate({ center: fromLonLat([c.lng, c.lat]), zoom: ZOOM_MINIMO_GRILLA });
        }
    }, [filtroActual.ciudad]);

    // ---------- FORMULARIO ----------
    const abrirNuevo = () => {
        setErrorForm('');
        setForm({
            ...FORM_VACIO,
            ciudad: filtroActual.ciudad !== 'Todas' ? filtroActual.ciudad : 'Temuco',
            enfermedadId: enfermedades.length > 0 ? String(enfermedades[0].id) : '',
        });
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setForm(FORM_VACIO);
        setErrorForm('');
    };

    // ---------- GUARDAR (crear punto en el backend) ----------
    const handleGuardar = async (e) => {
        e.preventDefault();
        setErrorForm('');
        if (!form.enfermedadId) {
            setErrorForm('Selecciona una enfermedad.');
            return;
        }
        setGuardando(true);
        const pcr = {
            rut: form.rut,
            disease_id: Number(form.enfermedadId),
            city: form.ciudad,
            address: form.domicilio,
            in_treatment: form.enTratamiento,
            treatment_start: form.enTratamiento ? form.fechaInicio : null,
            next_control: form.enTratamiento ? form.fechaProximoControl : null,
        };
        try {
            await crearPunto(pcr);
            cerrarModal();
            await cargarPuntos();
        } catch (err) {
            // El backend devuelve el motivo (p. ej. "no se encontró la dirección ingresada")
            setErrorForm(err.message || 'No se pudo crear el registro.');
        } finally {
            setGuardando(false);
        }
    };

    // ---------- ELIMINAR (desactivar en el backend) ----------
    const eliminarCaso = async (id) => {
        if (!window.confirm('¿Desactivar este registro? Dejará de verse en el mapa.')) return;
        try {
            await desactivarPunto(id);
            await cargarPuntos();
        } catch (err) {
            alert(err.message || 'No se pudo desactivar el registro.');
        }
    };

    // ---------- FILTROS ----------
    const aplicarFiltro = (e) => {
        e.preventDefault();
        setFiltroActual(tempFiltro);
        setShowFilterModal(false);
    };

    const limpiarFiltro = () => {
        const limpio = { ciudad: 'Todas', enfermedadId: 'Todas' };
        setTempFiltro(limpio);
        setFiltroActual(limpio);
        setShowFilterModal(false);
    };

    const abrirFiltro = () => {
        setTempFiltro(filtroActual);
        setShowFilterModal(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const togglePanel = (cual) => setPanelAbierto((prev) => (prev === cual ? null : cual));

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

                    {cargando && <p className="mapa-estado">Cargando puntos…</p>}
                    {errorCarga && <p className="mapa-estado mapa-error">{errorCarga}</p>}

                    <div className="action-buttons">
                        <button className="btn-outline-dark" onClick={abrirFiltro}>
                            Filtrar Ciudad/Enfermedad
                            {(filtroActual.enfermedadId !== 'Todas' || filtroActual.ciudad !== 'Todas') && (
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
                                        <th>Cuadrante</th>
                                        <th>Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {casosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="tabla-vacia">No hay casos para este filtro.</td>
                                        </tr>
                                    ) : (
                                        casosFiltrados.map((c) => (
                                            <tr key={c.id}>
                                                <td>{c.rut}</td>
                                                <td>{c.enfermedad}</td>
                                                <td>{c.ciudad}</td>
                                                <td>{c.enTratamiento ? 'Sí' : 'No'}</td>
                                                <td>{c.quadrante || '—'}</td>
                                                <td className="acciones-celda">
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
                                <select value={tempFiltro.enfermedadId} onChange={(e) => setTempFiltro({ ...tempFiltro, enfermedadId: e.target.value })}>
                                    <option value="Todas">Todas las enfermedades</option>
                                    {enfermedades.map((en) => (
                                        <option key={en.id} value={en.id}>{en.name}</option>
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

            {/* MODAL: INGRESO */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header" style={{ backgroundColor: '#1e293b' }}>
                            <h3>Añadir nuevo caso</h3>
                            <button className="btn-close" onClick={cerrarModal}>&times;</button>
                        </div>
                        <form onSubmit={handleGuardar} className="modal-form">
                            {errorForm && <div className="error-alert"><p>{errorForm}</p></div>}

                            <div className="form-group">
                                <label>RUT del Paciente</label>
                                <input type="text" placeholder="12.345.678-5" required value={form.rut}
                                       onChange={(e) => setForm({ ...form, rut: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Enfermedad</label>
                                <select required value={form.enfermedadId} onChange={(e) => setForm({ ...form, enfermedadId: e.target.value })}>
                                    <option value="" disabled>Selecciona una enfermedad</option>
                                    {enfermedades.map((en) => (
                                        <option key={en.id} value={en.id}>{en.name}</option>
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
                                <button type="submit" className="btn-save" style={{ backgroundColor: '#1e293b' }} disabled={guardando}>
                                    {guardando ? 'Guardando…' : 'Guardar registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CARGA MASIVA (componente con barra de progreso) */}
            {showBatchModal && (
                <CargaMasivaModal
                    simular={false}
                    onCerrar={() => setShowBatchModal(false)}
                    onCompletado={() => { setShowBatchModal(false); void cargarPuntos(); }}
                />
            )}
        </div>
    );
}

export default Mapa;
