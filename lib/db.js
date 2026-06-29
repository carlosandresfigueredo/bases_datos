import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Instancia de sql.js cacheada para evitar recargar el WASM en cada petición.
 */
let _SQL = null;

async function getSQL() {
  if (_SQL) return _SQL;

  // Carga el binario WASM de sql.js desde node_modules (funciona en cualquier entorno Node.js)
  const wasmBinary = readFileSync(
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  );
  _SQL = await initSqlJs({ wasmBinary });
  return _SQL;
}

/**
 * Ejecuta una consulta SQL en una base de datos SQLite en memoria aislada.
 * @param {string} schemaSQL - El DDL de creación de tablas.
 * @param {string} seedSQL   - Las sentencias INSERT con datos semilla.
 * @param {string} query     - La consulta SQL enviada por el estudiante.
 * @returns {Promise<Object>} - Un objeto con { success: true, rows } o { success: false, error }.
 */
export async function executeSandbox(schemaSQL, seedSQL, query) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'La consulta no puede estar vacía.' };
  }

  const cleanQuery = query.trim();

  if (cleanQuery.length === 0) {
    return { success: false, error: 'Consulta vacía.' };
  }

  // Prevenir múltiples sentencias
  const statementsCount = cleanQuery.split(';').filter(s => s.trim().length > 0).length;
  if (statementsCount > 1) {
    return { success: false, error: 'Solo se permite enviar una única sentencia SQL a la vez.' };
  }

  // Validar que sea SELECT (eliminar comentarios antes de verificar)
  const withoutComments = cleanQuery
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Comentarios de bloque /* */
    .replace(/--[^\r\n]*/g, '')         // Comentarios de línea --
    .trim()
    .toUpperCase();

  if (!withoutComments.startsWith('SELECT') && !withoutComments.startsWith('WITH')) {
    return {
      success: false,
      error: 'Operación no permitida. Solo se admiten consultas de lectura de datos (SELECT).'
    };
  }

  const SQL = await getSQL();
  // Crear base de datos en memoria completamente aislada
  const db = new SQL.Database();

  try {
    // Inicializar esquema y datos semilla
    db.run(schemaSQL);
    db.run(seedSQL);

    // Ejecutar la consulta del estudiante
    const results = db.exec(cleanQuery);

    if (results.length === 0) {
      return { success: true, rows: [] };
    }

    // Convertir el formato de sql.js [{columns, values}] a array de objetos
    const { columns, values } = results[0];
    const rows = values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    return { success: true, rows };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    // Liberar memoria inmediatamente
    db.close();
  }
}
