import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Instancia de sql.js cacheada para evitar recargar el WASM en cada petición.
 */
let _SQL = null;

async function getSQL() {
  if (_SQL) return _SQL;
  const wasmBinary = readFileSync(
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  );
  _SQL = await initSqlJs({ wasmBinary });
  return _SQL;
}

/**
 * Detecta si una cadena SQL contiene alguna sentencia de un tipo dado.
 */
function containsType(sql, keywords) {
  const upper = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\r\n]*/g, '').toUpperCase();
  return keywords.some(kw => upper.includes(kw));
}

/**
 * Ejecuta una o varias sentencias SQL en una base de datos SQLite en memoria aislada.
 * Soporta SELECT, CREATE TABLE, CREATE DATABASE, INSERT, UPDATE, DELETE, DROP, ALTER.
 *
 * @param {string} schemaSQL - El DDL de creación de tablas del ejercicio (contexto del ejercicio).
 * @param {string} seedSQL   - Las sentencias INSERT con datos semilla del ejercicio.
 * @param {string} query     - La(s) sentencia(s) SQL enviadas por el estudiante.
 * @returns {Promise<Object>} { success, rows, rowsModified, isDDL, error }
 */
export async function executeSandbox(schemaSQL, seedSQL, query) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'La consulta no puede estar vacía.' };
  }

  const cleanQuery = query.trim();
  if (cleanQuery.length === 0) {
    return { success: false, error: 'Consulta vacía.' };
  }

  const SQL = await getSQL();
  // Base de datos en memoria completamente aislada para cada ejecución
  const db = new SQL.Database();

  try {
    // Inicializar el contexto del ejercicio (esquema + semilla)
    if (schemaSQL) db.run(schemaSQL);
    if (seedSQL) db.run(seedSQL);

    // Ejecutar las sentencias del estudiante (soporta múltiples separadas por ';')
    const results = db.exec(cleanQuery);
    const rowsModified = db.getRowsModified();

    // Determinar el tipo de operación para contextualizar la respuesta
    const isSelect = containsType(cleanQuery, ['SELECT', 'WITH']);
    const isDDL = containsType(cleanQuery, ['CREATE', 'DROP', 'ALTER', 'RENAME']);
    const isDML = containsType(cleanQuery, ['INSERT', 'UPDATE', 'DELETE', 'REPLACE']);

    if (results.length === 0) {
      // DDL o DML sin resultado set — operación exitosa sin filas de retorno
      let message = '';
      if (isDDL && containsType(cleanQuery, ['CREATE TABLE'])) {
        message = 'Tabla creada correctamente.';
      } else if (isDDL && containsType(cleanQuery, ['CREATE DATABASE', 'ATTACH DATABASE'])) {
        // SQLite no tiene CREATE DATABASE, pero lo informamos pedagógicamente
        message = 'Nota: SQLite usa archivos en lugar de bases de datos separadas. La operación se procesó.';
      } else if (isDDL && containsType(cleanQuery, ['DROP'])) {
        message = 'Elemento eliminado correctamente.';
      } else if (isDDL && containsType(cleanQuery, ['ALTER'])) {
        message = 'Estructura modificada correctamente.';
      } else if (isDML && containsType(cleanQuery, ['INSERT'])) {
        message = `${rowsModified} fila(s) insertada(s) correctamente.`;
      } else if (isDML && containsType(cleanQuery, ['UPDATE'])) {
        message = `${rowsModified} fila(s) actualizada(s) correctamente.`;
      } else if (isDML && containsType(cleanQuery, ['DELETE'])) {
        message = `${rowsModified} fila(s) eliminada(s) correctamente.`;
      } else {
        message = `Sentencia ejecutada. ${rowsModified > 0 ? rowsModified + ' fila(s) afectada(s).' : ''}`;
      }

      return {
        success: true,
        rows: [],
        rowsModified,
        isDDL: true,   // tratamos DDL y DML sin resultado como "sin tabla de resultados"
        message
      };
    }

    // Hay resultados (SELECT u otras sentencias que devuelven filas)
    // Si hay múltiples result sets (varias sentencias SELECT), devolver el último
    const lastResult = results[results.length - 1];
    const { columns, values } = lastResult;
    const rows = values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    return { success: true, rows, rowsModified, isDDL: false };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    db.close();
  }
}
