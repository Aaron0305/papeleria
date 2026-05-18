"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Verificar si hay sesión activa
    const storedUser = localStorage.getItem("pos_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
  }, [router]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("pos_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-brand-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { name: "Punto de Venta", href: "/dashboard/pos", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Inventario", href: "/dashboard/inventario", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
    { name: "Usuarios", href: "/dashboard/usuarios", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { name: "Reportes", href: "/dashboard/reportes", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ];

  return (
    <div className="min-h-screen bg-background flex text-foreground transition-colors duration-300 overflow-hidden relative">
      
      {/* Overlay para móviles cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Lateral (Responsivo) */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 md:w-64 bg-card flex flex-col transition-transform duration-300 flex-shrink-0 shadow-[4px_0_24px_rgba(0,41,70,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 md:z-30 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-4 border-b border-black/5 dark:border-white/5 relative">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-3 to-brand-5 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-4/20 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold tracking-tight text-lg text-foreground leading-tight truncate">CIBER-PAPELERÍA</h1>
            <p className="text-brand-4 text-xs font-bold tracking-widest uppercase">Top-Running</p>
          </div>
          
          {/* Botón cerrar en móvil */}
          <button 
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 text-brand-4 hover:bg-brand-4/10 rounded-full"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                  ? "bg-gradient-to-r from-brand-3 to-brand-4 text-white shadow-md shadow-brand-4/30 scale-[1.02]" 
                  : "text-brand-3 dark:text-brand-4 hover:bg-brand-4/10 hover:text-brand-3 dark:hover:text-brand-5"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="font-semibold truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 px-4 py-3.5 rounded-2xl transition-all font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative w-full bg-background min-w-0">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-brand-4/5 to-transparent pointer-events-none -z-10"></div>
        
        {/* Top Header */}
        <header className="bg-card/70 backdrop-blur-xl p-4 md:p-6 flex justify-between items-center sticky top-0 z-20 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            {/* Botón Menú Móvil */}
            <button 
              className="md:hidden p-2 text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-none">Panel Administrativo</h2>
              <p className="text-brand-4 text-xs md:text-sm font-medium mt-1">Ciber-Papelería Top-Running</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right">
              <p className="text-[10px] md:text-xs text-brand-4 font-semibold uppercase tracking-wider mb-0.5">Bienvenido</p>
              <p className="text-xs md:text-sm font-bold text-foreground truncate max-w-[120px] md:max-w-[200px]">{user?.nombre || user?.email?.split('@')[0] || 'Usuario'}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-brand-3 to-brand-5 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-lg md:text-xl text-white shadow-lg shadow-brand-4/20 border border-white/10 flex-shrink-0">
              {user?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Contenido Dinámico de las Rutas */}
        <div className="p-4 md:p-8 z-10 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
