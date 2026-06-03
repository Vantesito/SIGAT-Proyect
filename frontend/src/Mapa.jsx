import React, { useState, useEffect, useRef } from 'react';
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

function Mapa() {
  const navigate = useNavigate();
  
  // REFERENCIAS PARA OPENLAYERS
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  
  // ESTADOS PRINCIPALES
  const [puntosCalor, setPuntosCalor] = useState([]);
  
  // ESTADOS PARA MODALES
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false); // NUEVO: Modal de Filtro
  
  // ESTADOS DE FORMULARIOS Y FILTROS
  const [nuevoCaso, setNuevoCaso] = useState({ rut: '', enfermedad: '', domicilio: '' });
  const [archivoLote, setArchivoLote] = useState(null);
  const [errorLote, setErrorLote] = useState('');
  
  // Estado del filtro actual
  const [filtroActual, setFiltroActual] = useState({
    ciudad: 'Todas',
    enfermedad: 'Todas'
  });
  
  // Estado temporal para el formulario del modal de filtro
  const [tempFiltro, setTempFiltro] = useState({ ciudad: 'Todas', enfermedad: 'Todas' });

  // INICIALIZAR EL MAPA
  useEffect(() => {
    if (!mapRef.current) {
      const baseLayer = new TileLayer({ source: new OSM() });
      const heatMapLayer = new Heatmap({
        source: vectorSourceRef.current,
        blur: 15,
        radius: 20,
        weight: function (feature) {
          return feature.get('weight');
        }
      });

      mapRef.current = new Map({
        target: mapElement.current,
        layers: [baseLayer, heatMapLayer],
        view: new View({
          center: fromLonLat([-72.5904, -38.7397]), // Temuco
          zoom: 13
        })
      });
    }

    // Carga inicial simulada
    setTimeout(() => {
      setPuntosCalor([
        { lng: -72.5900, lat: -38.7400, peso: 0.8, enfermedad: 'Tuberculosis', ciudad: 'Temuco' },
        { lng: -72.6000, lat: -38.7300, peso: 0.6, enfermedad: 'Varicela', ciudad: 'Temuco' }
      ]);
    }, 1000);

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
    };
  }, []);

  // ACTUALIZAR EL MAPA CADA VEZ QUE CAMBIAN LOS PUNTOS O EL FILTRO
  useEffect(() => {
    vectorSourceRef.current.clear();

    // Filtramos la lista principal basándonos en el estado de filtro actual
    const puntosFiltrados = puntosCalor.filter(punto => {
      const matchEnfermedad = filtroActual.enfermedad === 'Todas' || punto.enfermedad.toLowerCase() === filtroActual.enfermedad.toLowerCase();
      const matchCiudad = filtroActual.ciudad === 'Todas' || punto.ciudad === filtroActual.ciudad;
      return matchEnfermedad && matchCiudad;
    });

    const features = puntosFiltrados.map(punto => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([punto.lng, punto.lat]))
      });
      const pesoVisual = punto.enfermedad.toLowerCase() === 'tuberculosis' ? 0.9 : 0.5;
      feature.set('weight', pesoVisual); 
      return feature;
    });

    vectorSourceRef.current.addFeatures(features);
  }, [puntosCalor, filtroActual]);
  const handleGuardar = (e) => {
    e.preventDefault();
    const nuevaMarca = {
      lng: -72.5904 + (Math.random() - 0.5) * 0.04,
      lat: -38.7397 + (Math.random() - 0.5) * 0.04,
      enfermedad: nuevoCaso.enfermedad,
      ciudad: 'Temuco',
      peso: 0.8
    };
    setPuntosCalor([...puntosCalor, nuevaMarca]);
    setShowModal(false); 
    setNuevoCaso({ rut: '', enfermedad: '', domicilio: '' });
  };

  const ejecutarCargaExitosa = () => {
    const nuevosPuntos = Array.from({ length: 15 }).map(() => ({
      lng: -72.5904 + (Math.random() - 0.5) * 0.06,
      lat: -38.7397 + (Math.random() - 0.5) * 0.06,
      enfermedad: Math.random() > 0.5 ? 'Tuberculosis' : 'Varicela',
      ciudad: 'Temuco',
      peso: Math.random()
    }));
    setPuntosCalor(prev => [...prev, ...nuevosPuntos]);
    setShowBatchModal(false);
    setArchivoLote(null);
  };

  const handleCargaMasiva = (e) => {
    e.preventDefault();
    setErrorLote('');
    if (!archivoLote) return setErrorLote("Adjunte un archivo.");
    if (archivoLote.name.toLowerCase().includes('error')) {
      setErrorLote("Error de validación en el archivo.");
    } else {
      ejecutarCargaExitosa();
    }
  };

  // Función para aplicar el filtro
  const aplicarFiltro = (e) => {
    e.preventDefault();
    setFiltroActual(tempFiltro);
    setShowFilterModal(false);
  };

  const limpiarFiltro = () => {
    const filtroLimpio = { ciudad: 'Todas', enfermedad: 'Todas' };
    setTempFiltro(filtroLimpio);
    setFiltroActual(filtroLimpio);
    setShowFilterModal(false);
  };

  const handleLogout = () => navigate('/');

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
                <strong className="stat-value">{puntosCalor.length || '-'}</strong>
              </div>
              <button className="stat-btn-icon">&#9654;</button>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Alerta Tratamiento</span>
                <strong className="stat-value">-</strong>
              </div>
              <button className="stat-btn-icon">&#9654;</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-outline-dark" onClick={() => setShowFilterModal(true)}>
              Filtrar Ciudad/Enfermedad
              {filtroActual.enfermedad !== 'Todas' && <span style={{color: '#2b7bbc', marginLeft: '5px'}}>●</span>}
            </button>
            <button className="btn-outline-dark" onClick={() => setShowModal(true)}>
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
                <select 
                  value={tempFiltro.ciudad} 
                  onChange={(e) => setTempFiltro({...tempFiltro, ciudad: e.target.value})}
                >
                  <option value="Todas">Todas las ciudades</option>
                  <option value="Temuco">Temuco</option>
                  <option value="Padre Las Casas">Padre Las Casas</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Enfermedad</label>
                <select 
                  value={tempFiltro.enfermedad} 
                  onChange={(e) => setTempFiltro({...tempFiltro, enfermedad: e.target.value})}
                >
                  <option value="Todas">Todas las enfermedades</option>
                  <option value="Tuberculosis">Tuberculosis</option>
                  <option value="Varicela">Varicela</option>
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

      {/* MODAL: INGRESO MANUAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#1e293b' }}>
              <h3>Añadir nuevo caso</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleGuardar} className="modal-form">
              <div className="form-group">
                <label>RUT del Paciente</label>
                <input type="text" placeholder="12.345.678-9" required value={nuevoCaso.rut} onChange={(e) => setNuevoCaso({...nuevoCaso, rut: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Enfermedad</label>
                <input type="text" placeholder="Ej: Tuberculosis, Varicela" required value={nuevoCaso.enfermedad} onChange={(e) => setNuevoCaso({...nuevoCaso, enfermedad: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Domicilio del paciente</label>
                <input type="text" placeholder="Ej: Av. Alemania 0123, Temuco" required value={nuevoCaso.domicilio} onChange={(e) => setNuevoCaso({...nuevoCaso, domicilio: e.target.value})} />
                <small>La ubicación se anonimizará automáticamente a un cuadrante.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" style={{ backgroundColor: '#1e293b' }}>Guardar registro</button>
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