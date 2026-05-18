"use client";

import Link from "next/link";

export default function DashboardSummaryPage() {
  return (
    <div className="space-y-10">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Stat Card 1 - Venta de Hoy */}
        <div className="bg-gradient-to-br from-brand-3 to-brand-4 p-[1px] rounded-3xl shadow-xl shadow-brand-4/20 transition-transform duration-300 hover:-translate-y-1">
          <div className="bg-card/90 backdrop-blur-sm h-full w-full rounded-[23px] p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-4/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-4/40 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <p className="text-brand-3 dark:text-brand-4 text-sm font-bold tracking-wide uppercase">Ventas de Hoy</p>
                <h3 className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">$0.00</h3>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-brand-4/10 to-brand-5/10 rounded-2xl text-brand-4 border border-brand-4/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-auto z-10 flex items-center gap-2 bg-emerald-500/10 self-start px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="text-emerald-500 text-xs font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                0%
              </span>
              <span className="text-xs text-foreground/60 font-medium">respecto a ayer</span>
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Total Productos */}
        <div className="bg-gradient-to-br from-brand-4 to-brand-5 p-[1px] rounded-3xl shadow-xl shadow-brand-5/20 transition-transform duration-300 hover:-translate-y-1">
          <div className="bg-card/90 backdrop-blur-sm h-full w-full rounded-[23px] p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-5/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-5/40 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <p className="text-brand-4 dark:text-brand-5 text-sm font-bold tracking-wide uppercase">Total Productos</p>
                <h3 className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">0</h3>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-brand-4/10 to-brand-5/10 rounded-2xl text-brand-5 border border-brand-5/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            
            <div className="mt-auto z-10 flex items-center gap-2 bg-brand-4/10 self-start px-3 py-1.5 rounded-full border border-brand-4/20">
              <span className="text-brand-4 text-xs font-bold">Catálogo Activo</span>
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Bajo Stock */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-[1px] rounded-3xl shadow-xl shadow-red-500/20 transition-transform duration-300 hover:-translate-y-1">
          <div className="bg-card/90 backdrop-blur-sm h-full w-full rounded-[23px] p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <p className="text-red-500 text-sm font-bold tracking-wide uppercase">Bajo Stock</p>
                <h3 className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">0</h3>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-auto z-10 flex items-center gap-2 bg-red-500/10 self-start px-3 py-1.5 rounded-full border border-red-500/20">
              <span className="text-red-500 text-xs font-bold">Requieren reabastecimiento</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mt-10">
        <h3 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-2">
          <span className="w-8 h-1 bg-gradient-to-r from-brand-3 to-brand-5 rounded-full inline-block"></span>
          Accesos Rápidos
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/dashboard/pos" className="relative group overflow-hidden rounded-3xl p-[1px] shadow-lg shadow-brand-4/10">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-3 to-brand-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card/95 backdrop-blur-xl h-full w-full rounded-[23px] p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-transparent">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-3/10 to-brand-4/10 group-hover:from-white/20 group-hover:to-white/10 border border-brand-3/20 group-hover:border-white/30 flex items-center justify-center mb-4 transition-all duration-300 shadow-inner group-hover:shadow-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-3 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground group-hover:text-white transition-colors">Punto de Venta</span>
            </div>
          </Link>

          <Link href="/dashboard/inventario" className="relative group overflow-hidden rounded-3xl p-[1px] shadow-lg shadow-brand-4/10">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-4 to-brand-5 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card/95 backdrop-blur-xl h-full w-full rounded-[23px] p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-transparent">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-4/10 to-brand-5/10 group-hover:from-white/20 group-hover:to-white/10 border border-brand-4/20 group-hover:border-white/30 flex items-center justify-center mb-4 transition-all duration-300 shadow-inner group-hover:shadow-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-4 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground group-hover:text-white transition-colors">Inventario</span>
            </div>
          </Link>
          
          <Link href="/dashboard/usuarios" className="relative group overflow-hidden rounded-3xl p-[1px] shadow-lg shadow-brand-4/10">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-3 to-brand-5 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card/95 backdrop-blur-xl h-full w-full rounded-[23px] p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-transparent">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-3/10 to-brand-5/10 group-hover:from-white/20 group-hover:to-white/10 border border-brand-5/20 group-hover:border-white/30 flex items-center justify-center mb-4 transition-all duration-300 shadow-inner group-hover:shadow-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-5 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground group-hover:text-white transition-colors">Usuarios</span>
            </div>
          </Link>

          <Link href="/dashboard/reportes" className="relative group overflow-hidden rounded-3xl p-[1px] shadow-lg shadow-brand-4/10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-brand-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card/95 backdrop-blur-xl h-full w-full rounded-[23px] p-6 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-transparent">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-brand-4/10 group-hover:from-white/20 group-hover:to-white/10 border border-indigo-500/20 group-hover:border-white/30 flex items-center justify-center mb-4 transition-all duration-300 shadow-inner group-hover:shadow-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 dark:text-indigo-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground group-hover:text-white transition-colors">Reportes</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
