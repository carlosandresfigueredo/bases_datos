import { NextResponse } from 'next/server';
import { exercises } from '@/lib/exercises';
import { executeSandbox } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const { query, exerciseId, runOnly } = await request.json();

    // 1. Validar parámetros de entrada
    if (!exerciseId) {
      return NextResponse.json({ success: false, error: 'Falta el ID del ejercicio.' }, { status: 400 });
    }

    const exercise = exercises.find(e => e.id === Number(exerciseId));
    if (!exercise) {
      return NextResponse.json({ success: false, error: 'Ejercicio no encontrado.' }, { status: 404 });
    }

    // 1.5 Ejecución rápida de solo prueba
    if (runOnly) {
      const studentResult = await executeSandbox(exercise.schemaSQL, exercise.seedSQL, query);
      return NextResponse.json({
        success: true,
        runOnly: true,
        datosEstudiante: studentResult.success ? studentResult.rows : null,
        isDDL: studentResult.isDDL,
        rowsModified: studentResult.rowsModified,
        ddlMessage: studentResult.message,
        errorSQL: studentResult.success ? null : studentResult.error
      });
    }

    // 2. Ejecutar la consulta del profesor (Referencia)
    const refResult = await executeSandbox(exercise.schemaSQL, exercise.seedSQL, exercise.referenceSQL);
    if (!refResult.success) {
      return NextResponse.json({
        success: false,
        error: `Error interno: La consulta de referencia del profesor falló. Detalle: ${refResult.error}`
      }, { status: 500 });
    }

    // 3. Ejecutar la consulta del estudiante en el sandbox
    const studentResult = await executeSandbox(exercise.schemaSQL, exercise.seedSQL, query);

    // 4. Comparar resultados
    let isCorrect = false;
    let score = 0;
    let details = '';

    if (studentResult.success) {
      // Comparar estructura de columnas e igualdad de filas (orden e información)
      const refStr = JSON.stringify(refResult.rows);
      const studStr = JSON.stringify(studentResult.rows);

      if (refStr === studStr) {
        isCorrect = true;
        score = 100;
        details = '¡Excelente! Los resultados coinciden exactamente con la respuesta esperada.';
      } else {
        score = 40; // Puntaje parcial por ejecutar sin error, pero resultados incorrectos
        details = 'La consulta se ejecutó correctamente pero los datos devueltos no coinciden con los esperados. Verifica las condiciones, columnas y el ordenamiento solicitado.';
      }
    } else {
      score = 0;
      details = `Error de ejecución SQL: ${studentResult.error}`;
    }

    // 5. Integración con Gemini para retroalimentación cognitiva
    let aiFeedback = null;
    const clientKey = request.headers.get('x-gemini-key');
    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    if (isCorrect) {
      aiFeedback = "¡Gran trabajo! Has estructurado la consulta SQL a la perfección y obtenido los resultados esperados. Sigue así.";
    } else if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
          Eres un instructor experto en ingeniería de bases de datos del SENA (Colombia).
          Estás evaluando a un aprendiz en el ejercicio de SQL titulado: "${exercise.title}".

          **Descripción del Ejercicio:**
          ${exercise.description}

          **Esquema de la Base de Datos:**
          \`\`\`sql
          ${exercise.schemaSQL}
          \`\`\`

          **Datos Semilla (Ejemplo):**
          \`\`\`sql
          ${exercise.seedSQL}
          \`\`\`

          **Consulta Solución del Profesor (Referencia):**
          \`\`\`sql
          ${exercise.referenceSQL}
          \`\`\`

          **Consulta enviada por el Aprendiz:**
          \`\`\`sql
          ${query}
          \`\`\`

          **Resultado obtenido por el Aprendiz:**
          ${studentResult.success 
            ? `Lista de objetos devuelta (incorrecta): ${JSON.stringify(studentResult.rows)}`
            : `Error de compilación/sintaxis de SQLite: ${studentResult.error}`}

          **Instrucciones para tu respuesta:**
          1. Explica pedagógicamente al aprendiz cuál es su error (lógico, de sintaxis, falta de ordenamiento, columnas incorrectas, etc.).
          2. No le des la consulta SQL correcta directamente bajo ninguna circunstancia.
          3. Dale pistas o haz preguntas reflexivas para que identifique cómo corregir su código.
          4. Dirígete en español con un tono motivador, amable y profesional acorde al entorno educativo del SENA.
          5. Mantén la respuesta breve (máximo 3 párrafos cortos).
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });

        aiFeedback = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (geminiError) {
        console.error('Error llamando a la API de Gemini:', geminiError);
        aiFeedback = `[Nota: Error al conectar con el Tutor de IA] ${details}`;
      }
    } else {
      // Mensaje educativo por defecto si no hay API Key configurada
      aiFeedback = `[Tutor de IA desactivado: Configura la variable de entorno GEMINI_API_KEY para activar la tutoría interactiva].\n\n${details}`;
    }

    return NextResponse.json({
      success: true,
      correcto: isCorrect,
      score,
      datosEstudiante: studentResult.success ? studentResult.rows : null,
      datosEsperados: refResult.rows,
      isDDL: studentResult.isDDL,
      rowsModified: studentResult.rowsModified,
      ddlMessage: studentResult.message,
      errorSQL: studentResult.success ? null : studentResult.error,
      feedback: aiFeedback
    });

  } catch (error) {
    console.error('Error en API /api/evaluate:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
