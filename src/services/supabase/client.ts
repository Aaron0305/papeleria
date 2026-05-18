import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en componentes del lado del cliente (Client Components).
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
