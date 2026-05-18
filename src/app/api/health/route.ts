import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/services/health.service";

/**
 * GET /api/health
 * Controlador de ruta HTTP. En Next.js, las URLs se definen creando carpetas en 'app'.
 * Esta carpeta 'app/api/health' simplemente crea la URL '/api/health'.
 * La lógica de negocio está completamente separada en 'src/services'.
 */
export async function GET() {
  // Toda la lógica del backend viene de la carpeta services
  const result = await checkDatabaseHealth();
  
  if (result.status === "error") {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
