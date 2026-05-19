import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mapa.css';

function Mapa() {
  const navigate = useNavigate();
  
  // ESTADOS PRINCIPALES
  const [puntosCalor, setPuntosCalor] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ESTADOS PARA MODALES
  const [showModal, setShowModal] = useState(false); // Modal de ingreso manual
  const [showBatchModal, setShowBatchModal] = useState(false); // Modal de carga masiva
  
  // ESTADOS DE FORMULARIOS
  const [nuevoCaso, setNuevoCaso] = useState({ rut: '', enfermedad: '', domicilio: '' });
  const [archivoLote, setArchivoLote] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const dataSimulada = [
        { top: '30%', left: '40%', size: '150px', color: 'rgba(255, 50, 0, 0.6)', enfermedad: 'Tuberculosis' },
        { top: '60%', left: '70%', size: '120px', color: 'rgba(200, 0, 0, 0.7)', enfermedad: 'Varicela' }
      ];
      setPuntosCalor(dataSimulada);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Función para ingreso manual
  const handleGuardar = (e) => {
    e.preventDefault();
    const nuevaMarca = {
      top: `${Math.floor(Math.random() * 60) + 20}%`,
      left: `${Math.floor(Math.random() * 60) + 20}%`,
      size: '140px',
      color: nuevoCaso.enfermedad.toLowerCase() === 'tuberculosis' ? 'rgba(255, 50, 0, 0.6)' : 'rgba(255, 150, 0, 0.6)',
      enfermedad: nuevoCaso.enfermedad
    };

    setPuntosCalor([...puntosCalor, nuevaMarca]);
    setShowModal(false); 
    alert(`Caso de ${nuevoCaso.enfermedad} registrado en el sistema SIGAT`);
    setNuevoCaso({ rut: '', enfermedad: '', domicilio: '' });
  };

  // Función para carga masiva (Excel)
  const handleCargaMasiva = (e) => {
    e.preventDefault();
    if (!archivoLote) {
      alert("Por favor, adjunte un archivo válido.");
      return;
    }

    // Simulamos que el backend procesa el Excel y devuelve 10 casos nuevos repartidos
    const nuevosPuntosMasivos = Array.from({ length: 10 }).map(() => ({
      top: `${Math.floor(Math.random() * 80) + 10}%`,
      left: `${Math.floor(Math.random() * 80) + 10}%`,
      size: '130px',
      color: Math.random() > 0.5 ? 'rgba(255, 50, 0, 0.5)' : 'rgba(255, 150, 0, 0.5)',
      enfermedad: Math.random() > 0.5 ? 'Tuberculosis' : 'Varicela'
    }));

    setPuntosCalor([...puntosCalor, ...nuevosPuntosMasivos]);
    setShowBatchModal(false);
    setArchivoLote(null);
    alert(`Carga masiva exitosa. Se han importado 10 casos nuevos al mapa de SIGAT.`);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="mapa-dashboard">
      <aside className="mapa-sidebar">
        <div className="sidebar-header">
          <h2>Panel de Control</h2>
          <span className="user-badge">Personal Salud SIGAT</span>
        </div>
        
        <div className="stats-card">
          <span>Casos Registrados</span>
          <strong>{puntosCalor.length}</strong>
        </div>

        {/* Botones de acción principal */}
        <div className="action-buttons">
          <button className="btn-add-data" onClick={() => setShowModal(true)}>
            Ingresar Caso Manual
          </button>
          
          <button className="btn-batch-data" onClick={() => setShowBatchModal(true)}>
            Carga Masiva (Excel)
          </button>
        </div>
        
        <p className="privacy-note">
          * Datos anonimizados por cuadrantes (50-100m) para protección de privacidad.
        </p>
        
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </aside>

      <main className="mapa-container">
        {isLoading ? (
          <div className="loading-overlay">Cargando SIGAT...</div>
        ) : (
          <div className="mock-map">
            <div className="mock-map-grid"></div>
            {puntosCalor.map((punto, index) => (
              <div key={index} className="heat-spot" style={{
                top: punto.top, left: punto.left, width: punto.size, height: punto.size,
                background: `radial-gradient(circle, ${punto.color} 0%, rgba(255,255,255,0) 70%)`
              }} />
            ))}
            <div className="mock-map-label">Vista SIGAT: Mapa de Calor Epidemiológico</div>
          </div>
        )}
      </main>

      {/* MODAL: INGRESO MANUAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Añadir Nuevo Caso</h3>
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
                <label>Domicilio del Paciente</label>
                <input type="text" placeholder="Ej: Av. Alemania 0123, Temuco" required value={nuevoCaso.domicilio} onChange={(e) => setNuevoCaso({...nuevoCaso, domicilio: e.target.value})} />
                <small>La ubicación se anonimizará automáticamente a un cuadrante.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGA MASIVA */}
      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#008080' }}>
              <h3>Carga masiva de registros</h3>
              <button className="btn-close" onClick={() => setShowBatchModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCargaMasiva} className="modal-form">
              <div className="form-group file-upload-group">
                <label>Archivo de Datos (.xlsx, .csv)</label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  required
                  onChange={(e) => setArchivoLote(e.target.files[0])}
                />
                <small>Asegúrese de que el archivo contenga las columnas: RUT, Enfermedad y Domicilio.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBatchModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" style={{ backgroundColor: '#008080' }}>Procesar Archivo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mapa;