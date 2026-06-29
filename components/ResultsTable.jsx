'use client';

import React from 'react';

/**
 * Tabla interactiva para visualizar las tuplas devueltas por la consulta SQL.
 * @param {Array<Object>} rows - Array de objetos devueltos por el Sandbox.
 */
export default function ResultsTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database-backup">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 12a9 9 0 0 0 5 2.69"/>
          <path d="M21 5v7a9 9 0 0 1-5 2.69"/>
          <path d="M3 5v14a9 9 0 0 0 15 6.19"/>
          <path d="M16 19h6"/>
          <path d="M19 16l3 3-3 3"/>
        </svg>
        <p>No hay registros para mostrar. Ejecuta tu consulta SQL.</p>
      </div>
    );
  }

  // Extraer los nombres de las columnas a partir de la primera fila del conjunto
  const columns = Object.keys(rows[0]);

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col}>
                  {row[col] === null || row[col] === undefined ? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                  ) : (
                    String(row[col])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
