import Database from 'better-sqlite3';

/**
 * Ejecuta una consulta SQL en una base de datos SQLite en memoria aislada.
 * @param {string} schemaSQL - El DDL de creación de tablas.
 * @param {string} seedSQL - Las sentencias INSERT con datos semilla.
 * @param {string} query - La consulta SQL enviada por el estudiante.
 * @returns {Object} - Un objeto con { success: true, rows } o { success: false, error }.
 */
export function executeSandbox(schemaSQL, seedSQL, query) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'La consulta no puede estar vacía.' };
  }

  const cleanQuery = query.trim();

  // Validación rápida: evitar consultas vacías
  if (cleanQuery.length === 0) {
    return { success: false, error: 'Consulta vacía.' };
  }

  // Prevenir consultas múltiples rudimentariamente para evitar evasiones de la validación del parser
  // (better-sqlite3 prepara únicamente el primer statement, pero es buena práctica validarlo)
  const statementsCount = cleanQuery.split(';').filter(s => s.trim().length > 0).length;
  if (statementsCount > 1) {
    return { success: false, error: 'Solo se permite enviar una única sentencia SQL a la vez.' };
  }

  // Crear la base de datos temporal en memoria
  const db = new Database(':memory:');

  try {
    // Forzar integridad de llaves foráneas
    db.pragma('foreign_keys = ON');

    // Inicializar el esquema y los datos
    db.exec(schemaSQL);
    db.exec(seedSQL);

    // Preparar la consulta
    const stmt = db.prepare(cleanQuery);

    // Validar de manera estricta que la consulta es de SOLO LECTURA (SELECT)
    // El atributo .reader en better-sqlite3 es true si la consulta retorna datos (SELECT)
    if (!stmt.reader) {
      return { success: false, error: 'Operación no permitida. Solo se admiten consultas de consulta de datos (SELECT).' };
    }

    // Ejecutar y obtener resultados
    const rows = stmt.all();
    return { success: true, rows };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    // Cerrar la base de datos para liberar recursos de memoria inmediatamente
    db.close();
  }
}
