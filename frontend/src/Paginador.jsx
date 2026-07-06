import React from 'react';
import './Paginador.css';

// Componente de paginación reutilizable.
// Props: pagina (1-based), totalPaginas, onCambiar(nuevaPagina)
function Paginador({ pagina, totalPaginas, onCambiar }) {
    if (totalPaginas <= 1) return null;

    // Genera un rango acotado de números de página alrededor de la actual,
    // para no listar 40 botones si hay muchas páginas.
    const paginas = [];
    const inicio = Math.max(1, pagina - 2);
    const fin = Math.min(totalPaginas, pagina + 2);
    for (let p = inicio; p <= fin; p++) paginas.push(p);

    return (
        <div className="paginador">
            <button
                className="paginador-btn"
                onClick={() => onCambiar(pagina - 1)}
                disabled={pagina === 1}
            >
                ‹ Anterior
            </button>

            {inicio > 1 && (
                <>
                    <button className="paginador-btn" onClick={() => onCambiar(1)}>1</button>
                    {inicio > 2 && <span className="paginador-elipsis">…</span>}
                </>
            )}

            {paginas.map((p) => (
                <button
                    key={p}
                    className={`paginador-btn ${p === pagina ? 'paginador-activo' : ''}`}
                    onClick={() => onCambiar(p)}
                >
                    {p}
                </button>
            ))}

            {fin < totalPaginas && (
                <>
                    {fin < totalPaginas - 1 && <span className="paginador-elipsis">…</span>}
                    <button className="paginador-btn" onClick={() => onCambiar(totalPaginas)}>{totalPaginas}</button>
                </>
            )}

            <button
                className="paginador-btn"
                onClick={() => onCambiar(pagina + 1)}
                disabled={pagina === totalPaginas}
            >
                Siguiente ›
            </button>
        </div>
    );
}

export default Paginador;
