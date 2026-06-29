export const exercises = [
  {
    id: 0,
    title: "🧪 Sandbox Libre",
    difficulty: "Libre",
    category: "Práctica Libre",
    description: `
      **Modo libre** — Base de datos completamente vacía.

      Practica el flujo completo de trabajo SQL desde cero:

      1. **Crear tus tablas** con \`CREATE TABLE\`
      2. **Insertar datos** con \`INSERT INTO\`
      3. **Consultar y modificar** con \`SELECT\`, \`UPDATE\`, \`DELETE\`

      También puedes escribir sintaxis MySQL como \`CREATE DATABASE mi_bd;\` y \`USE mi_bd;\`
      — el sandbox las adapta automáticamente.

      **Ejemplo rápido:**
      \`\`\`sql
      CREATE TABLE estudiantes (
        id   INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        nota   REAL
      );
      INSERT INTO estudiantes VALUES (1, 'Ana Torres', 4.8);
      INSERT INTO estudiantes VALUES (2, 'Luis Mejía', 3.9);
      SELECT * FROM estudiantes WHERE nota >= 4.0;
      \`\`\`
    `,
    schemaSQL: '',   // Base de datos completamente vacía
    seedSQL: '',
    referenceSQL: 'SELECT 1 AS sandbox_libre;'
  },
  {
    id: 1,
    title: "1. Listar Aprendices Sobresalientes",
    difficulty: "Fácil",
    category: "Consultas Básicas",
    description: `
      El Centro de Electricidad y Automatización del SENA requiere un reporte de los aprendices con excelente rendimiento académico.
      
      Escribe una consulta SQL que retorne los nombres, apellidos y el promedio de todos los aprendices que pertenezcan a la ficha **2500123** y tengan un promedio **mayor o igual a 4.5**.
      
      **Columnas requeridas en el resultado:**
      - \`nombre\`
      - \`apellido\`
      - \`promedio\`
      
      **Ordenamiento:**
      - Ordena los resultados por \`promedio\` de forma descendente.
    `,
    schemaSQL: `
      CREATE TABLE aprendices (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        ficha TEXT NOT NULL,
        promedio REAL NOT NULL
      );
    `,
    seedSQL: `
      INSERT INTO aprendices (id, nombre, apellido, ficha, promedio) VALUES
      (1, 'Ana', 'Gómez', '2500123', 4.8),
      (2, 'Carlos', 'Ruiz', '2500123', 3.9),
      (3, 'María', 'Paz', '2500123', 4.5),
      (4, 'Juan', 'Rodríguez', '2500456', 4.7),
      (5, 'Diana', 'Martínez', '2500123', 4.2),
      (6, 'Sebastián', 'Castro', '2500123', 4.6);
    `,
    referenceSQL: `
      SELECT nombre, apellido, promedio
      FROM aprendices
      WHERE ficha = '2500123' AND promedio >= 4.5
      ORDER BY promedio DESC;
    `
  },
  {
    id: 2,
    title: "2. Control de Inventario de Equipos STEM",
    difficulty: "Medio",
    category: "Agrupaciones y Conteos",
    description: `
      El laboratorio de robótica necesita auditar el estado físico de sus componentes electrónicos.
      
      Escribe una consulta SQL para obtener el nombre de la categoría del equipo, la cantidad total de equipos registrados en esa categoría, y el promedio de su valor estimado en pesos (redondeado a dos decimales). Filtra únicamente las categorías que tengan **más de 1 equipo registrado**.
      
      **Columnas requeridas en el resultado:**
      - \`categoria\`
      - \`cantidad_equipos\`
      - \`valor_promedio\`
      
      **Ordenamiento:**
      - Ordena por \`cantidad_equipos\` de manera descendente.
    `,
    schemaSQL: `
      CREATE TABLE inventario (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        estado TEXT NOT NULL,
        valor_estimado REAL NOT NULL
      );
    `,
    seedSQL: `
      INSERT INTO inventario (id, nombre, categoria, estado, valor_estimado) VALUES
      (1, 'Arduino Uno R3', 'Microcontroladores', 'Operativo', 120000.00),
      (2, 'Raspberry Pi 4', 'Microcontroladores', 'Operativo', 450000.00),
      (3, 'Osciloscopio Digital', 'Instrumentación', 'Operativo', 1500000.00),
      (4, 'Multímetro Fluke', 'Instrumentación', 'Mantenimiento', 600000.00),
      (5, 'Kit Sensores Gas', 'Sensores', 'Operativo', 85000.00),
      (6, 'ESP32 NodeMCU', 'Microcontroladores', 'Operativo', 45000.00);
    `,
    referenceSQL: `
      SELECT categoria, COUNT(*) as cantidad_equipos, ROUND(AVG(valor_estimado), 2) as valor_promedio
      FROM inventario
      GROUP BY categoria
      HAVING cantidad_equipos > 1
      ORDER BY cantidad_equipos DESC;
    `
  },
  {
    id: 3,
    title: "3. Asignación de Instructores a Fichas",
    difficulty: "Difícil",
    category: "Joins y Relaciones",
    description: `
      La coordinación académica del SENA desea saber qué instructores tienen asignadas fichas de formación en el área de software y cuántas horas de formación imparten semanalmente.
      
      Escribe una consulta que combine la información de los instructores y sus fichas asignadas. Debe retornar el nombre completo del instructor (en formato \`Nombre Apellido\` concatenado), el número de la ficha, el nombre del programa de formación, y la cantidad de horas semanales asignadas.
      
      Solo debes incluir instructores asignados a programas que contengan la palabra **'Software'** en su nombre.
      
      **Columnas requeridas en el resultado:**
      - \`instructor_nombre\` (ej: "Juan Pérez")
      - \`ficha\`
      - \`programa\`
      - \`horas_semanales\`
      
      **Ordenamiento:**
      - Ordena por \`horas_semanales\` de forma descendente y secundariamente por el nombre del instructor de forma alfabética.
    `,
    schemaSQL: `
      CREATE TABLE instructores (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        especialidad TEXT NOT NULL
      );
      
      CREATE TABLE fichas (
        codigo TEXT PRIMARY KEY,
        programa TEXT NOT NULL,
        instructor_id INTEGER,
        horas_semanales INTEGER NOT NULL,
        FOREIGN KEY(instructor_id) REFERENCES instructores(id)
      );
    `,
    seedSQL: `
      INSERT INTO instructores (id, nombre, apellido, especialidad) VALUES
      (1, 'Jairo', 'Alba', 'Desarrollo de Software'),
      (2, 'Patricia', 'Tobón', 'Redes de Datos'),
      (3, 'Héctor', 'Fabio', 'Desarrollo de Software'),
      (4, 'Liliana', 'Gómez', 'Diseño Gráfico');
      
      INSERT INTO fichas (codigo, programa, instructor_id, horas_semanales) VALUES
      ('2500123', 'ADSO (Análisis y Desarrollo de Software)', 1, 20),
      ('2500456', 'Redes y Telecomunicaciones', 2, 16),
      ('2500789', 'Programación de Software', 3, 24),
      ('2500111', 'ADSO (Análisis y Desarrollo de Software)', 3, 10),
      ('2500222', 'Diseño de Medios Interactivos', 4, 18);
    `,
    referenceSQL: `
      SELECT (i.nombre || ' ' || i.apellido) as instructor_nombre, f.codigo as ficha, f.programa, f.horas_semanales
      FROM instructores i
      JOIN fichas f ON i.id = f.instructor_id
      WHERE f.programa LIKE '%Software%'
      ORDER BY f.horas_semanales DESC, instructor_nombre ASC;
    `
  },
  {
    id: 4,
    title: "4. Equipos de Mayor Valor en Laboratorio",
    difficulty: "Medio",
    category: "Subconsultas",
    description: `
      El departamento de compras requiere saber qué equipos del inventario tienen el valor estimado más alto de todo el laboratorio, para efectos de contratar una póliza de seguro.
      
      Escribe una consulta SQL que retorne el nombre, la categoría y el valor estimado de los equipos cuyo valor estimado sea igual al valor máximo registrado en la tabla.
      
      **Columnas requeridas en el resultado:**
      - \`nombre\`
      - \`categoria\`
      - \`valor_estimado\`
      
      **Ordenamiento:**
      - No se requiere un ordenamiento específico.
    `,
    schemaSQL: `
      CREATE TABLE inventario (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        estado TEXT NOT NULL,
        valor_estimado REAL NOT NULL
      );
    `,
    seedSQL: `
      INSERT INTO inventario (id, nombre, categoria, estado, valor_estimado) VALUES
      (1, 'Arduino Uno R3', 'Microcontroladores', 'Operativo', 120000.00),
      (2, 'Raspberry Pi 4', 'Microcontroladores', 'Operativo', 450000.00),
      (3, 'Osciloscopio Digital Rígido', 'Instrumentación', 'Operativo', 1500000.00),
      (4, 'Multímetro Fluke Profesional', 'Instrumentación', 'Mantenimiento', 600000.00),
      (5, 'Estación de Soldadura Pro', 'Herramientas', 'Operativo', 1500000.00),
      (6, 'ESP32 NodeMCU', 'Microcontroladores', 'Operativo', 45000.00);
    `,
    referenceSQL: `
      SELECT nombre, categoria, valor_estimado
      FROM inventario
      WHERE valor_estimado = (SELECT MAX(valor_estimado) FROM inventario);
    `
  },
  {
    id: 5,
    title: "5. Instructores sin Carga Académica Completa",
    difficulty: "Difícil",
    category: "Joins y Relaciones",
    description: `
      Para planificar el próximo semestre, la dirección académica necesita un listado de todos los instructores y las fichas que tienen asignadas. Es indispensable incluir en el reporte a aquellos instructores que actualmente no tienen ninguna ficha de formación asignada.
      
      Escribe una consulta SQL que devuelva el nombre completo del instructor (concatenado como \`Nombre Apellido\` con un espacio intermedio), su especialidad, y el código de la ficha asignada. Si el instructor no tiene ficha asignada, la columna de la ficha debe aparecer como NULL.
      
      **Columnas requeridas en el resultado:**
      - \`instructor_nombre\` (ej: "Jairo Alba")
      - \`especialidad\`
      - \`ficha\`
      
      **Ordenamiento:**
      - Ordena alfabéticamente por el \`instructor_nombre\` de forma ascendente.
    `,
    schemaSQL: `
      CREATE TABLE instructores (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        especialidad TEXT NOT NULL
      );
      
      CREATE TABLE fichas (
        codigo TEXT PRIMARY KEY,
        programa TEXT NOT NULL,
        instructor_id INTEGER,
        horas_semanales INTEGER NOT NULL,
        FOREIGN KEY(instructor_id) REFERENCES instructores(id)
      );
    `,
    seedSQL: `
      INSERT INTO instructores (id, nombre, apellido, especialidad) VALUES
      (1, 'Jairo', 'Alba', 'Desarrollo de Software'),
      (2, 'Patricia', 'Tobón', 'Redes de Datos'),
      (3, 'Héctor', 'Fabio', 'Desarrollo de Software'),
      (4, 'Liliana', 'Gómez', 'Diseño Gráfico'),
      (5, 'Carlos', 'Mendoza', 'Soporte Técnico');
      
      INSERT INTO fichas (codigo, programa, instructor_id, horas_semanales) VALUES
      ('2500123', 'ADSO (Análisis y Desarrollo de Software)', 1, 20),
      ('2500456', 'Redes y Telecomunicaciones', 2, 16),
      ('2500789', 'Programación de Software', 3, 24);
    `,
    referenceSQL: `
      SELECT (i.nombre || ' ' || i.apellido) as instructor_nombre, i.especialidad, f.codigo as ficha
      FROM instructores i
      LEFT JOIN fichas f ON i.id = f.instructor_id
      ORDER BY instructor_nombre ASC;
    `
  },
  {
    id: 6,
    title: "6. Registro de Préstamos STEM",
    difficulty: "Medio",
    category: "Consultas con Fechas",
    description: `
      El centro de formación realiza préstamos de kits tecnológicos a los aprendices y requiere supervisar los préstamos hechos durante el mes de junio de 2026.
      
      Escribe una consulta SQL que muestre el nombre del aprendiz, el nombre del equipo prestado, la fecha de préstamo y la cantidad de días transcurridos desde el préstamo hasta la fecha de devolución.
      
      Solo debes incluir préstamos realizados entre el **1 de junio de 2026 y el 30 de junio de 2026** (ambos inclusive) y que ya hayan sido devueltos (es decir, con \`fecha_devolucion\` no nula).
      
      **Columnas requeridas en el resultado:**
      - \`aprendiz\`
      - \`equipo\`
      - \`fecha_prestamo\`
      - \`dias_prestado\` (la diferencia en días entre la fecha de devolución y la fecha de préstamo)
      
      **Nota sobre SQLite:**
      - Para restar fechas en SQLite, puedes utilizar la función \`julianday(fecha_fin) - julianday(fecha_inicio)\` para calcular los días de diferencia y luego convertirla a entero usando \`CAST(... AS INTEGER)\`.
      
      **Ordenamiento:**
      - Ordena los resultados por \`fecha_prestamo\` de forma ascendente.
    `,
    schemaSQL: `
      CREATE TABLE prestamos (
        id INTEGER PRIMARY KEY,
        aprendiz TEXT NOT NULL,
        equipo TEXT NOT NULL,
        fecha_prestamo TEXT NOT NULL,
        fecha_devolucion TEXT
      );
    `,
    seedSQL: `
      INSERT INTO prestamos (id, aprendiz, equipo, fecha_prestamo, fecha_devolucion) VALUES
      (1, 'Ana Gómez', 'Kit Arduino Uno', '2026-06-05', '2026-06-12'),
      (2, 'Carlos Ruiz', 'Raspberry Pi 4', '2026-06-10', '2026-06-15'),
      (3, 'María Paz', 'Multímetro Digital', '2026-05-28', '2026-06-02'),
      (4, 'Juan Rodríguez', 'Osciloscopio Digital', '2026-06-15', NULL),
      (5, 'Diana Martínez', 'Kit Sensores Gas', '2026-06-20', '2026-06-22'),
      (6, 'Sebastián Castro', 'Cautín Regulable', '2026-07-01', '2026-07-05');
    `,
    referenceSQL: `
      SELECT aprendiz, equipo, fecha_prestamo, 
             CAST(julianday(fecha_devolucion) - julianday(fecha_prestamo) AS INTEGER) as dias_prestado
      FROM prestamos
      WHERE fecha_prestamo BETWEEN '2026-06-01' AND '2026-06-30'
        AND fecha_devolucion IS NOT NULL
      ORDER BY fecha_prestamo ASC;
    `
  }
];
