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
 * Normaliza SQL escrito en estilo MySQL para que funcione en SQLite.
 * Elimina silenciosamente sentencias no soportadas y devuelve qué se adaptó.
 *
 * Sentencias adaptadas:
 *  - CREATE DATABASE / DROP DATABASE  → eliminadas (SQLite no las necesita)
 *  - USE <database>                   → eliminada (SQLite usa un solo archivo)
 *  - SHOW DATABASES / SHOW TABLES    → eliminadas
 *  - ENGINE=InnoDB, CHARSET=utf8, etc → eliminados de CREATE TABLE
 */
function normalizeMySQLToSQLite(sql) {
  const mysqlOnlyPattern =
    /^\s*(CREATE\s+DATABASE|DROP\s+DATABASE|USE\s+\w+|SHOW\s+DATABASES|SHOW\s+TABLES)\b/i;

  const statements = sql.split(/(?<=;)/g).map(s => s.trim()).filter(Boolean);
  const stripped = [];
  const kept = [];

  for (const stmt of statements) {
    const clean = stmt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\r\n]*/g, '').trim();
    if (mysqlOnlyPattern.test(clean)) {
      stripped.push(clean.split(/\s+/).slice(0, 2).join(' ').toUpperCase());
    } else {
      // Eliminar opciones MySQL de CREATE TABLE: ENGINE=..., DEFAULT CHARSET=..., COLLATE=...
      const normalized = stmt
        .replace(/\s+ENGINE\s*=\s*\w+/gi, '')
        .replace(/\s+DEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
        .replace(/\s+CHARSET\s*=\s*\w+/gi, '')
        .replace(/\s+COLLATE\s*=\s*[\w_]+/gi, '')
        .replace(/\s+AUTO_INCREMENT\s*=\s*\d+/gi, '')
        .replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT')
        .replace(/\bTINYINT\b/gi, 'INTEGER')
        .replace(/\bSMALLINT\b/gi, 'INTEGER')
        .replace(/\bMEDIUMINT\b/gi, 'INTEGER')
        .replace(/\bBIGINT\b/gi, 'INTEGER')
        .replace(/\bVARCHAR\s*\(\d+\)/gi, 'TEXT')
        .replace(/\bDATETIME\b/gi, 'TEXT')
        .replace(/\bBOOLEAN\b/gi, 'INTEGER')
        .replace(/\bBOOL\b/gi, 'INTEGER')
        .replace(/\bDOUBLE\b/gi, 'REAL')
        .replace(/\bFLOAT\b/gi, 'REAL');
      kept.push(normalized);
    }
  }

  return { sql: kept.join('\n'), stripped };
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

    // Normalizar sintaxis MySQL → SQLite (CREATE DATABASE, USE, VARCHAR, ENGINE, etc.)
    const { sql: normalizedQuery, stripped: mysqlAdapted } = normalizeMySQLToSQLite(cleanQuery);

    // Si después de normalizar no queda nada ejecutable, retornar mensaje informativo
    if (!normalizedQuery.trim()) {
      return {
        success: true,
        rows: [],
        rowsModified: 0,
        isDDL: true,
        mysqlAdapted,
        message: 'Las sentencias fueron interpretadas (no tienen equivalente directo en SQLite).'
      };
    }

    // Ejecutar las sentencias del estudiante (soporta múltiples separadas por ';')
    const results = db.exec(normalizedQuery);
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
        mysqlAdapted,
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

    return { success: true, rows, rowsModified, isDDL: false, mysqlAdapted };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    db.close();
  }
}
