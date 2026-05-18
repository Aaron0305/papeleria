"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (queryError || !data) {
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // Guardar el usuario en localStorage para persistencia básica
      localStorage.setItem("pos_user", JSON.stringify(data));

      // Redirigir al dashboard
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300 z-0">
      {/* Fondo animado premium (Efecto Glassmorphism) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-brand-4/30 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-brand-5/30 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="w-full max-w-md bg-card/80 backdrop-blur-2xl p-6 sm:p-10 rounded-[32px] shadow-[0_8px_32px_rgba(0,41,70,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/5 z-10 transition-all duration-300">
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-3 to-brand-5 rounded-[24px] mx-auto flex items-center justify-center shadow-lg shadow-brand-4/30 mb-4 sm:mb-6 border border-white/10 transition-transform hover:scale-105 duration-300">
            {/* Ícono de Papelería (Documento y Lápiz) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight transition-colors">Ciber-Papelería</h1>
          <p className="text-brand-4 text-xs sm:text-sm mt-2 font-bold tracking-widest uppercase">Top-Running</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground/70 mb-2 ml-1" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="relative group">
              <input
                id="email"
                type="email"
                className="w-full bg-background border border-black/5 dark:border-white/5 text-foreground px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-5/50 focus:border-brand-5 transition-all shadow-inner group-hover:border-brand-4/30"
                placeholder="usuario@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground/70 mb-2 ml-1" htmlFor="password">
              Contraseña
            </label>
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full bg-background border border-black/5 dark:border-white/5 text-foreground px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-5/50 focus:border-brand-5 transition-all shadow-inner group-hover:border-brand-4/30 pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-4 hover:text-brand-5 transition-colors p-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-3 to-brand-5 hover:from-brand-4 hover:to-brand-5 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-brand-5/30 flex justify-center items-center mt-4"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
