"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

// Inline light-weight class merger utility
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for SmoothTab KokonutUI Sliding Indicator
  const [dimensions, setDimensions] = useState({ width: 0, left: 0 });
  const buttonRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verificar si hay sesión activa
    const storedUser = localStorage.getItem("pos_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Guardia de roles para cajero
    if (parsedUser?.rol === "cajero") {
      const allowedPaths = ["/dashboard/pos", "/dashboard/reportes"];
      if (!allowedPaths.includes(pathname)) {
        router.replace("/dashboard/pos");
        return;
      }
    }

    setLoading(false);
  }, [router, pathname]);

  // Detección dinámica y activa en caliente del modo oscuro/claro del dispositivo
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const storedTheme = localStorage.getItem("theme");
      if (!storedTheme) {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    // Evaluar estado inicial en la hidratación cliente
    handleThemeChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

  // KokonutUI: Actualizar dimensiones del indicador deslizante al cambiar ruta o redimensionar ventana
  useEffect(() => {
    const updateDimensions = () => {
      const selectedButton = buttonRefs.current.get(pathname);
      const container = containerRef.current;

      if (selectedButton && container) {
        setDimensions({
          width: selectedButton.offsetWidth,
          left: selectedButton.offsetLeft,
        });
      }
    };

    // Use requestAnimationFrame to ensure layout styling is parsed
    const rafId = requestAnimationFrame(updateDimensions);

    window.addEventListener("resize", updateDimensions);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [pathname]);

  // Desplazar horizontalmente el contenedor para centrar la pestaña activa (Evita alterar el scroll vertical global)
  useEffect(() => {
    const selectedButton = buttonRefs.current.get(pathname);
    const container = containerRef.current;

    if (selectedButton && container) {
      const containerWidth = container.offsetWidth;
      const buttonWidth = selectedButton.offsetWidth;
      const buttonLeft = selectedButton.offsetLeft;

      container.scrollTo({
        left: buttonLeft - containerWidth / 2 + buttonWidth / 2,
        behavior: "smooth",
      });
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("pos_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const menuItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      color: "bg-brand-3 shadow-md shadow-brand-3/25",
    },
    { 
      name: "Punto de Venta", 
      href: "/dashboard/pos", 
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
      color: "bg-teal-500 shadow-md shadow-teal-500/25",
    },
    { 
      name: "Inventario", 
      href: "/dashboard/inventario", 
      icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
      color: "bg-brand-4 shadow-md shadow-brand-4/25",
    },
    { 
      name: "Usuarios", 
      href: "/dashboard/usuarios", 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "bg-cyan-600 shadow-md shadow-cyan-500/25",
    },
    { 
      name: "Reportes", 
      href: "/dashboard/reportes", 
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: "bg-brand-5 shadow-md shadow-brand-5/25",
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.rol === "cajero") {
      return item.name === "Punto de Venta" || item.name === "Reportes";
    }
    return true;
  });

  const selectedItem = filteredMenuItems.find((item) => item.href === pathname);;

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground transition-colors duration-300 relative overflow-clip">

      
      {/* Luces Ambientales Globales */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-4/5 filter blur-[120px] pointer-events-none -z-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-5/5 filter blur-[120px] pointer-events-none -z-20"></div>

      {/* Top Navbar Horizontal con KokonutUI SmoothTab */}
      <header className="w-full bg-card/90 dark:bg-[#002946]/90 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] sticky top-0 z-30 shadow-[0_1px_15px_rgba(0,0,0,0.01)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 flex flex-col lg:flex-row justify-between items-center py-4 lg:py-0 gap-4 lg:gap-6">
          
          {/* Logo & Brand Area */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-3 to-brand-5 rounded-xl flex items-center justify-center shadow-lg shadow-brand-5/20 text-white flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-500"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5 transform group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="font-extrabold text-foreground text-[16px] tracking-tight leading-none">
                Ciber<span className="text-brand-5 font-black">-Papelería</span>
              </h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="h-1 w-1 rounded-full bg-brand-5 animate-pulse"></span>
                <span className="text-[9px] text-brand-4 font-black uppercase tracking-[0.2em] leading-none">
                  Top-Running
                </span>
              </div>
            </div>
          </div>

          {/* Navegación por Módulos con KokonutUI SmoothTab (Sliding Background) */}
          <div 
            ref={containerRef}
            className="relative flex items-center bg-slate-500/[0.04] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-none gap-1 snap-x justify-start lg:snap-none"
          >
            {/* Sliding Spring-Animated Active Indicator */}
            {dimensions.width > 0 && (
              <motion.div
                animate={{
                  width: dimensions.width,
                  x: dimensions.left,
                }}
                className={cn(
                  "absolute top-1 bottom-1 rounded-xl z-0 transition-colors duration-300",
                  selectedItem?.color || "bg-brand-3"
                )}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href;
              const isLightBg = (item.name === "Punto de Venta" || item.name === "Reportes") && isActive;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  ref={(el) => {
                    if (el) buttonRefs.current.set(item.href, el);
                    else buttonRefs.current.delete(item.href);
                  }}
                  className={cn(
                    "relative z-10 flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl transition-all duration-300 font-extrabold text-[13.5px] whitespace-nowrap snap-center",
                    isActive 
                      ? isLightBg ? "text-brand-2" : "text-white" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={cn(
                      "h-4.5 w-4.5 flex-shrink-0 transition-transform duration-300",
                      isActive 
                        ? isLightBg ? "text-brand-2 scale-110" : "text-white scale-110" 
                        : "text-slate-400 dark:text-slate-500"
                    )}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Perfil de Usuario y Logout Limpio */}
          <div className="flex items-center gap-3.5 flex-shrink-0 ml-auto lg:ml-0">
            {/* Píldora del Perfil de Sesión */}
            <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 bg-slate-500/[0.02] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.04] rounded-xl shadow-inner group">
              <div className="text-right hidden sm:block">
                <span className="text-[12px] font-black text-foreground block group-hover:text-brand-3 dark:group-hover:text-white transition-colors">
                  {user?.nombre || user?.email?.split('@')[0] || 'Administrador'}
                </span>
              </div>
              
              {/* Avatar circular con presencia verde agua */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-3 to-brand-5 rounded-lg flex items-center justify-center font-black text-[11px] text-white shadow-sm border border-white/10 transform group-hover:scale-105 transition-transform duration-300">
                  {user?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="absolute bottom-[-1px] right-[-1px] block h-2.5 w-2.5 rounded-full ring-2 ring-card bg-brand-5 animate-pulse"></span>
              </div>
            </div>

            {/* Botón de Cerrar Sesión Ultra-Limpio */}
            <button 
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2.5 text-red-500/90 dark:text-red-400/90 border border-red-500/10 hover:border-red-500/20 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* Contenido Dinámico de las Rutas */}
      <main className="flex-1 relative w-full bg-background min-w-0">
        <div className="p-4 md:p-8 z-10 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>
      
    </div>
  );
}




