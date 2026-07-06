import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './CargaMasivaModal.css';
import { subirCargaMasiva } from './api';

// Segundos estimados por fila: el backend espera geo_api_wait (~1s) por cada
// dirección geocodificada, más la latencia de Nominatim. Ajusta si cambias
// geo_api_wait en el backend.
const SEGUNDOS_POR_FILA = 1.5;

// Plantilla en blanco (solo encabezados) embebida en base64, para que el
// botón de descarga funcione sin depender de un archivo estático servido
// aparte ni de una llamada al backend.
const PLANTILLA_BASE64 = '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';
const PLANTILLA_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PLANTILLA_NOMBRE = 'plantilla-carga-masiva-sigat.xlsx';

const descargarPlantilla = () => {
  const bytes = atob(PLANTILLA_BASE64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const blob = new Blob([buffer], { type: PLANTILLA_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = PLANTILLA_NOMBRE;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

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
      // Contamos filas con contenido REAL, no el rango declarado de la hoja
      // (ws['!ref']): ese rango queda "pegado" al tamaño más grande que tuvo
      // el archivo alguna vez y no se achica solo al borrar celdas sin
      // eliminar la fila físicamente, lo que sobreestimaba el conteo.
      const filas = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
      const filasDatos = Math.max(0, filas.length - 1); // -1 por el encabezado
      setNumFilas(filasDatos);
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
                  <div className="cm-plantilla">
                    <div className="cm-plantilla-texto">
                      <strong>Plantilla a usar</strong>
                      <span>Descarga la plantilla con las columnas exactas que espera el sistema.</span>
                    </div>
                    <button type="button" className="cm-btn-plantilla" onClick={descargarPlantilla}>
                      Descargar plantilla
                    </button>
                  </div>

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
