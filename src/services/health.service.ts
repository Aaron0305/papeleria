import { createClient } from "@supabase/supabase-js";

/**
 * Servicio para verificar el estado del backend y la base de datos.
 * Usa un cliente directo (sin cookies) porque solo necesita verificar la conexión.
 */
export async function checkDatabaseHealth() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data, error } = await supabase.from("usuarios").select("id").limit(1);

    if (error) {
      return { status: "error", message: error.message };
    }

    return {
      status: "ok",
      message: "Conexión con Supabase establecida correctamente",
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return { status: "error", message: "No se pudo conectar con Supabase" };
  }
}
