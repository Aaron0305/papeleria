"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabase/client";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ingresosHoy: 0,
    transaccionesHoy: 0,
    totalProductos: 0,
    bajoStockCount: 0,
  });
  const [productosBajos, setProductosBajos] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Obtener productos para contar catálogo y verificar stock bajo
      const { data: prods, error: prodsError } = await supabase
        .from("productos")
        .select("*");

      let totalProds = 0;
      let stockCritico = 0;
      let listBajos: any[] = [];

      if (!prodsError && prods) {
        totalProds = prods.length;
        listBajos = prods
          .filter((p: any) => p.stock <= 5)
          .sort((a: any, b: any) => a.stock - b.stock);
        stockCritico = listBajos.length;
      }

      // 2. Obtener ventas para calcular ingresos del día
      const { data: sales, error: salesError } = await supabase
        .from("ventas")
        .select("*");

      let ingresos = 0;
      let transacciones = 0;

      if (!salesError && sales) {
        const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
        const todaySales = sales.filter((v: any) => {
          const dateStr = new Date(v.fecha).toLocaleDateString("en-CA");
          return dateStr === todayStr;
        });

        ingresos = todaySales.reduce((acc: number, v: any) => acc + Number(v.total), 0);
        transacciones = todaySales.length;
      }

      setStats({
        ingresosHoy: ingresos,
        transaccionesHoy: transacciones,
        totalProductos: totalProds,
        bajoStockCount: stockCritico,
      });
      // Mostrar solo los 5 productos más urgentes de resurtir
      setProductosBajos(listBajos.slice(0, 5));

    } catch (e) {
      console.error("Error al cargar estadísticas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Formatear la fecha actual de forma premium en español
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    const dateStr = new Date().toLocaleDateString("es-MX", options);
    // Capitalizar la primera letra
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  return (
    <section className="space-y-8">
      {/* BANNER DE BIENVENIDA PREMIUM */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-black/5 bg-card p-6 md:p-10 shadow-[0_15px_50px_rgba(0,41,70,0.04)] dark:border-white/5 dark:bg-card/40">
        {/* Luces de fondo ambientadas */}
        <div className="absolute right-[-10%] top-[-20%] h-72 w-72 rounded-full bg-brand-4/10 filter blur-[80px] pointer-events-none"></div>
        <div className="absolute left-[40%] bottom-[-30%] h-60 w-60 rounded-full bg-brand-5/10 filter blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-brand-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-5 animate-ping"></span>
              Resumen Operativo
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Hola, ¡buen día! 🎒
            </h1>
            <p className="text-sm md:text-base text-foreground/75 max-w-xl leading-relaxed">
              Este es el estado actual de tu Ciber-Papelería. Revisa las ventas del día y asegúrate de reabastecer los productos críticos.
            </p>
          </div>
          <div className="bg-brand-4/10 border border-brand-4/20 text-brand-4 font-bold py-3.5 px-6 rounded-2xl flex items-center gap-3 text-sm shadow-inner whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {getFormattedDate()}
          </div>
        </div>
      </div>

      {/* METRICAS KPI GRID (4 TARJETAS) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Ventas Hoy */}
        <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-4">Vendido Hoy</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 bg-foreground/10 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="mt-2 text-3xl font-black text-emerald-500">${stats.ingresosHoy.toFixed(2)}</h3>
          )}
          <p className="mt-2 text-xs font-medium text-foreground/50">Corte de caja en tiempo real</p>
        </div>

        {/* KPI 2: Transacciones Hoy */}
        <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl bg-brand-4/10 text-brand-4 flex items-center justify-center font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-4">Tickets Cobrados</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 bg-foreground/10 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="mt-2 text-3xl font-black text-foreground">{stats.transaccionesHoy} vts</h3>
          )}
          <p className="mt-2 text-xs font-medium text-foreground/50">Clientes atendidos el día de hoy</p>
        </div>

        {/* KPI 3: Total Productos */}
        <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-4">Catálogo Total</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 bg-foreground/10 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className="mt-2 text-3xl font-black text-foreground">{stats.totalProductos} arts</h3>
          )}
          <p className="mt-2 text-xs font-medium text-foreground/50">Productos activos en almacén</p>
        </div>

        {/* KPI 4: Alertas de Stock */}
        <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5">
          <div className={`absolute right-4 top-4 h-12 w-12 rounded-2xl flex items-center justify-center font-bold ${stats.bajoStockCount > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-brand-5/10 text-brand-5'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-4">Alertas de Stock</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 bg-foreground/10 animate-pulse rounded-lg"></div>
          ) : (
            <h3 className={`mt-2 text-3xl font-black ${stats.bajoStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {stats.bajoStockCount}
            </h3>
          )}
          <p className="mt-2 text-xs font-medium text-foreground/50">Productos con 5 uds o menos</p>
        </div>
      </div>

      {/* DETALLE PRINCIPAL DEL DASHBOARD: Columnas Bajo Stock / Accesos */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* PANEL IZQUIERDO (2/3): Productos con Bajo Stock */}
        <div className="lg:col-span-2 bg-card rounded-[2rem] border border-black/5 p-6 shadow-md dark:border-white/5 dark:bg-card/40 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-5 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-xl font-bold text-foreground">Productos a Resurtir</h3>
                <p className="text-xs text-brand-4 mt-0.5">Control preventivo para evitar desabasto</p>
              </div>
              {productosBajos.length > 0 && (
                <span className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Nivel Crítico
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-foreground/5 animate-pulse rounded-2xl w-full"></div>
                ))}
              </div>
            ) : productosBajos.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-brand-5/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-extrabold text-foreground text-lg">¡Todo en orden! 🎒✨</h4>
                <p className="text-sm text-foreground/50 mt-1 max-w-sm">No tienes ningún producto con stock crítico en este momento. ¡Excelente gestión de inventario!</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {productosBajos.map((prod) => {
                  const stockPct = Math.min((prod.stock / 5) * 100, 100);
                  const isAgotado = prod.stock === 0;

                  return (
                    <div key={prod.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 group transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner ${isAgotado ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'}`}>
                          {prod.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground leading-snug group-hover:text-brand-5 transition-colors">{prod.nombre}</h4>
                          <span className="text-xs font-mono text-foreground/50">{prod.codigo_barras || "Sin código de barras"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 min-w-[150px]">
                        {/* Barra de progreso de stock */}
                        <div className="flex-1 hidden sm:block">
                          <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isAgotado ? 'bg-red-500' : 'bg-yellow-500'}`}
                              style={{ width: `${stockPct}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-xl whitespace-nowrap ${isAgotado ? 'bg-red-500/15 text-red-500' : 'bg-yellow-500/15 text-yellow-600'}`}>
                          {isAgotado ? "Agotado" : `${prod.stock} uds`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {productosBajos.length > 0 && (
            <div className="pt-5 border-t border-black/5 dark:border-white/5">
              <Link 
                href="/dashboard/inventario" 
                className="w-full inline-flex items-center justify-center gap-2 text-brand-5 hover:text-brand-4 font-bold text-sm transition-colors py-2"
              >
                <span>Administrar todo el almacén</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* PANEL DERECHO (1/3): Accesos Rápidos Premium */}
        <div className="bg-card rounded-[2rem] border border-black/5 p-6 shadow-md dark:border-white/5 dark:bg-card/40 flex flex-col justify-between">
          <div>
            <div className="pb-5 border-b border-black/5 dark:border-white/5">
              <h3 className="text-xl font-bold text-foreground">Módulos Rápidos</h3>
              <p className="text-xs text-brand-4 mt-0.5">Acceso veloz para agilizar la operación</p>
            </div>

            <div className="grid gap-3.5 mt-5">
              {/* Acceso Caja */}
              <Link 
                href="/dashboard/pos"
                className="group flex items-center justify-between p-4 bg-gradient-to-br from-brand-3/5 to-transparent border border-black/5 dark:border-white/5 hover:border-brand-5/20 hover:from-brand-3/10 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-5/10 text-brand-5 rounded-xl flex items-center justify-center font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Caja de Ventas</h4>
                    <p className="text-xs text-foreground/50">Cobrar tickets y clientes</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Acceso Inventario */}
              <Link 
                href="/dashboard/inventario"
                className="group flex items-center justify-between p-4 bg-gradient-to-br from-brand-3/5 to-transparent border border-black/5 dark:border-white/5 hover:border-brand-5/20 hover:from-brand-3/10 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-4/10 text-brand-4 rounded-xl flex items-center justify-center font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Inventario</h4>
                    <p className="text-xs text-foreground/50">Alta de productos y stock</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Acceso Reportes */}
              <Link 
                href="/dashboard/reportes"
                className="group flex items-center justify-between p-4 bg-gradient-to-br from-brand-3/5 to-transparent border border-black/5 dark:border-white/5 hover:border-brand-5/20 hover:from-brand-3/10 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Reportes</h4>
                    <p className="text-xs text-foreground/50">Historial y corte de caja</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5 text-center">
            <span className="text-[10px] text-foreground/35 uppercase font-bold tracking-widest leading-none">Ciber-Papelería V1.2</span>
          </div>
        </div>

      </div>
    </section>
  );
}
