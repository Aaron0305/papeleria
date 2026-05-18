"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";

export default function ReportesPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Establecer la fecha de hoy por defecto (YYYY-MM-DD)
  const [fechaFiltro, setFechaFiltro] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  const fetchVentas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ventas")
      .select("*, usuarios(nombre)")
      .order("fecha", { ascending: false });

    if (!error && data) {
      setVentas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  // Filtrado por fecha
  const ventasFiltradas = ventas.filter(v => {
    if (!fechaFiltro) return true;
    const fechaVenta = new Date(v.fecha).toLocaleDateString('en-CA');
    return fechaVenta === fechaFiltro;
  });

  // Totales
  const ingresosDelDia = ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0);
  const totalHistorico = ventas.reduce((acc, v) => acc + Number(v.total), 0);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Reportes y Ventas</h1>
          <p className="text-brand-4 font-medium">Historial completo de transacciones y cortes de caja.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-brand-4 mb-1 uppercase tracking-wider">Filtrar por Fecha</label>
            <input 
              type="date" 
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-card dark:bg-background border-none text-foreground font-bold rounded-xl py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all"
            />
          </div>
          <button 
            onClick={fetchVentas}
            className="bg-card dark:bg-background border-none text-brand-5 hover:bg-brand-5 hover:text-white font-bold py-3 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 h-[48px] self-end"
            title="Recargar Ventas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-400 border-none rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-emerald-50 font-bold mb-1 opacity-90">
            {fechaFiltro ? `Ingresos del Día (${fechaFiltro})` : 'Ingresos de Todas las Fechas'}
          </p>
          <h2 className="text-4xl font-black">${ingresosDelDia.toFixed(2)}</h2>
        </div>
        
        <div className="bg-card border-none rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <p className="text-brand-4 font-bold mb-1">
            {fechaFiltro ? 'Ventas Realizadas Hoy' : 'Total de Ventas'}
          </p>
          <h2 className="text-4xl font-black text-foreground">{ventasFiltradas.length}</h2>
        </div>

        <div className="bg-gradient-to-br from-brand-4/10 to-transparent dark:from-brand-4/5 border-none rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <p className="text-brand-4 font-bold mb-1">Total Histórico (Siempre)</p>
          <h2 className="text-3xl font-black text-foreground opacity-70">${totalHistorico.toFixed(2)}</h2>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-card border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden">
        <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-foreground">Últimas Ventas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-4/10 text-brand-4 text-xs uppercase tracking-wider">
                <th className="p-5 font-bold">Folio / ID</th>
                <th className="p-5 font-bold">Fecha y Hora</th>
                <th className="p-5 font-bold">Cajero</th>
                <th className="p-5 font-bold">Método</th>
                <th className="p-5 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-4/5 dark:divide-brand-4/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-4 font-medium animate-pulse">
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-4">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {fechaFiltro ? 'No hay ventas registradas en esta fecha.' : 'Aún no hay ventas registradas.'}
                    </div>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-brand-4/5 dark:hover:bg-brand-4/10 transition-colors text-foreground group">
                    <td className="p-5 font-mono text-brand-4 font-medium">#{venta.id.toString().padStart(6, '0')}</td>
                    <td className="p-5">
                      <div className="font-medium">{new Date(venta.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                      <div className="text-xs text-brand-4">{new Date(venta.fecha).toLocaleTimeString('es-MX')}</div>
                    </td>
                    <td className="p-5 font-medium">{venta.usuarios?.nombre || 'Anónimo'}</td>
                    <td className="p-5">
                      <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs font-bold">
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td className="p-5 text-right font-black text-emerald-500 text-lg">
                      ${Number(venta.total).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
