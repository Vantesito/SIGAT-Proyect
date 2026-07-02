import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './CargaMasivaModal.css';
import { subirCargaMasiva } from './api';

// Segundos estimados por fila: el backend espera geo_api_wait (~1s) por cada
// dirección geocodificada, más la latencia de Nominatim. Ajusta si cambias
// geo_api_wait en el backend.
const SEGUNDOS_POR_FILA = 1.5;

const formatTiempo = (seg) => {
  const s = Math.max(0, Math.round(seg));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m} min ${r.toString().padStart(2, '0')} s`;
};

// Props:
//  onCerrar()            -> cierra el modal
//  onCompletado(result)  -> opcional, se llama con el ImportResult al terminar
//  simular               -> si true, no llama al backend (útil en modo demo)
function CargaMasivaModal({ onCerrar, onCompletado, simular = false }) {
  const [fase, setFase] = useState('seleccion'); // seleccion | cargando | resultado | error

  // Usamos JSDoc para que el IDE entienda que es un archivo y no marque error en FormData
  /** @type {[File | null, React.Dispatch<React.SetStateAction<File | null>>]} */
  const [archivo, setArchivo] = useState(null);

  const [numFilas, setNumFilas] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [mensajeError, setMensajeError] = useState('');

  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleArchivo = async (e) => {
    const f = e.target.files[0];
    setMensajeError('');
    setResultado(null);
    if (!f) {
      setArchivo(null);
      setNumFilas(0);
      return;
    }
    setArchivo(f);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rango = XLSX.utils.decode_range(ws['!ref']);
      const filasDatos = rango.e.r;
      setNumFilas(filasDatos > 0 ? filasDatos : 0);
    } catch {
      setNumFilas(0);
    }
  };

  const iniciarBarraEstimada = (totalSeg) => {
    setTiempoRestante(totalSeg);
    setProgreso(0);
    const inicio = Date.now();
    intervalRef.current = setInterval(() => {
      const transcurrido = (Date.now() - inicio) / 1000;
      const pct = totalSeg > 0 ? Math.min(95, (transcurrido / totalSeg) * 100) : 90;
      setProgreso(pct);
      setTiempoRestante(Math.max(0, totalSeg - transcurrido));
    }, 200);
  };

  const finalizarBarra = () => {
    clearInterval(intervalRef.current);
    setProgreso(100);
    setTiempoRestante(0);
  };

  const handleSubir = async () => {
    if (!archivo) return;
    setFase('cargando');
    const estimado = Math.max(2, numFilas * SEGUNDOS_POR_FILA);
    iniciarBarraEstimada(estimado);

    try {
      let data;
      if (simular) {
        await new Promise((r) => setTimeout(r, estimado * 1000));
        data = {
          importados: Math.max(0, numFilas - 1),
          fallidos: numFilas > 0 ? 1 : 0,
          errores: numFilas > 0 ? ['Fila 3 no válida por: no se encontró la dirección ingresada'] : [],
        };
      } else {
        // Llamada centralizada: api.js agrega la URL base y el token JWT
        data = await subirCargaMasiva(archivo);
      }

      finalizarBarra();
      setResultado(data);
      setFase('resultado');
      if (onCompletado) onCompletado(data);

    } catch (err) {
      finalizarBarra();
      setMensajeError(err.message || 'No se pudo procesar la carga');
      setFase('error');
    }
  };

  const reiniciar = () => {
    setFase('seleccion');
    setArchivo(null);
    setNumFilas(0);
    setProgreso(0);
    setResultado(null);
    setMensajeError('');
  };

  return (
      <div className="cm-overlay">
        <div className="cm-modal">
          <div className="cm-header">
            <h3>Carga masiva de registros</h3>
            {fase !== 'cargando' && (
                <button className="cm-close" onClick={onCerrar} aria-label="Cerrar">&times;</button>
            )}
          </div>

          <div className="cm-body">
            {fase === 'seleccion' && (
                <>
                  <label className="cm-file">
                    <input type="file" accept=".xls,.xlsx" onChange={handleArchivo} />
                    <span>{archivo ? archivo.name : 'Selecciona un archivo .xls o .xlsx'}</span>
                  </label>

                  {archivo && numFilas > 0 && (
                      <p className="cm-estimacion">
                        Se procesarán <strong>{numFilas}</strong> registro{numFilas === 1 ? '' : 's'}.
                        Tiempo estimado: <strong>~{formatTiempo(numFilas * SEGUNDOS_POR_FILA)}</strong>.
                      </p>
                  )}
                  {archivo && numFilas === 0 && (
                      <p className="cm-estimacion cm-aviso">
                        No se pudo contar los registros; el servidor validará el archivo al subirlo.
                      </p>
                  )}

                  <div className="cm-actions">
                    <button className="cm-btn-cancel" onClick={onCerrar}>Cancelar</button>
                    <button className="cm-btn-primary" onClick={handleSubir} disabled={!archivo}>
                      Subir archivo
                    </button>
                  </div>
                </>
            )}

            {fase === 'cargando' && (
                <div className="cm-progreso">
                  <p className="cm-progreso-titulo">Procesando registros…</p>
                  <div
                      className="cm-barra"
                      role="progressbar"
                      aria-valuenow={Math.round(progreso)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                  >
                    <div className="cm-barra-fill" style={{ width: `${progreso}%` }} />
                  </div>
                  <p className="cm-progreso-detalle">
                    {Math.round(progreso)}% · queda ~{formatTiempo(tiempoRestante)}
                  </p>
                  <p className="cm-nota">
                    Cada dirección se geolocaliza respetando el límite del servicio de mapas,
                    por eso la carga tarda. No cierres esta ventana.
                  </p>
                </div>
            )}

            {fase === 'resultado' && resultado && (
                <div className="cm-resultado">
                  <div className="cm-resumen">
                    <span className="cm-ok">{resultado.importados} importados</span>
                    {resultado.fallidos > 0 && (
                        <span className="cm-fail">{resultado.fallidos} con error</span>
                    )}
                  </div>

                  {resultado.errores && resultado.errores.length > 0 && (
                      <div className="cm-errores">
                        <p className="cm-errores-titulo">Filas no cargadas:</p>
                        <ul>
                          {resultado.errores.map((e, i) => (
                              <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                  )}

                  <div className="cm-actions">
                    <button className="cm-btn-cancel" onClick={reiniciar}>Cargar otro</button>
                    <button className="cm-btn-primary" onClick={onCerrar}>Listo</button>
                  </div>
                </div>
            )}

            {fase === 'error' && (
                <div className="cm-resultado">
                  <p className="cm-error-msg">{mensajeError}</p>
                  <div className="cm-actions">
                    <button className="cm-btn-cancel" onClick={onCerrar}>Cerrar</button>
                    <button className="cm-btn-primary" onClick={reiniciar}>Reintentar</button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default CargaMasivaModal;
