import { exercises } from '@/lib/exercises';
import { NextResponse } from 'next/server';

export async function GET() {
  // Ocultamos la consulta de referencia (solución) del cliente por seguridad.
  // Así los estudiantes no podrán inspeccionar el tráfico de red en las herramientas de desarrollo del navegador para copiar la respuesta.
  const publicExercises = exercises.map(({ referenceSQL, ...rest }) => rest);
  return NextResponse.json({
    exercises: publicExercises,
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
}
