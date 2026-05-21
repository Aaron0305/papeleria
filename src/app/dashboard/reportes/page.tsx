"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";

export default function ReportesPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para ver el detalle de un ticket
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null);
  const [detallesCargando, setDetallesCargando] = useState(false);
  const [detallesTicket, setDetallesTicket] = useState<any[]>([]);
  
  // Establecer la fecha de hoy por defecto (YYYY-MM-DD)
  const [fechaFiltro, setFechaFiltro] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  const handleVerDetalle = async (venta: any) => {
    setSelectedVenta(venta);
    setDetallesCargando(true);
    setDetallesTicket([]);
    
    const { data, error } = await supabase
      .from("detalles_venta")
      .select("*, productos(nombre, codigo_barras)")
      .eq("venta_id", venta.id);
      
    if (!error && data) {
      setDetallesTicket(data);
    } else {
      console.error("Error al cargar detalles del ticket:", error);
    }
    setDetallesCargando(false);
  };

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
    <div className="space-y-6">
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
                  <tr 
                    key={venta.id} 
                    onClick={() => handleVerDetalle(venta)}
                    className="hover:bg-brand-4/5 dark:hover:bg-brand-4/10 cursor-pointer transition-colors text-foreground group"
                    title="Hacer clic para ver el ticket detallado"
                  >
                    <td className="p-5 font-mono text-brand-5 font-bold group-hover:underline">{venta.ticket_numero || `TK-${venta.id.toString().padStart(6, '0')}`}</td>
                    <td className="p-5">
                      <div className="font-medium">{new Date(venta.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                      <div className="text-xs text-brand-4">{new Date(venta.fecha).toLocaleTimeString('es-MX')}</div>
                    </td>
                    <td className="p-5 font-medium">{venta.usuarios?.nombre || 'Anónimo'}</td>
                    <td className="p-5">
                      <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-xs font-bold">
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

      {/* MODAL: Detalle de Ticket / Reimpresión */}
      {selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedVenta(null)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Modal */}
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detalle del Ticket
              </h2>
              <button 
                onClick={() => setSelectedVenta(null)} 
                className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] bg-background/30 dark:bg-background/10">
              
              {/* Información General del Ticket */}
              <div className="bg-card border-none p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.08)] space-y-2 text-sm text-foreground">
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Folio:</span>
                  <span className="font-mono font-bold text-brand-5">{selectedVenta.ticket_numero || `TK-${selectedVenta.id.toString().padStart(6, '0')}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Fecha:</span>
                  <span className="font-medium">{new Date(selectedVenta.fecha).toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Atendido por:</span>
                  <span className="font-medium">{selectedVenta.usuarios?.nombre || 'Anónimo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Método de Pago:</span>
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs font-black px-2.5 py-0.5 rounded-md">
                    {selectedVenta.metodo_pago}
                  </span>
                </div>
              </div>

              {/* Lista de Productos Comprados */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-4 uppercase tracking-wider">Productos Vendidos</label>
                
                {detallesCargando ? (
                  <div className="py-8 text-center text-brand-4 font-medium animate-pulse flex justify-center items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando artículos...
                  </div>
                ) : detallesTicket.length === 0 ? (
                  <div className="text-center py-4 text-brand-4 text-sm bg-card rounded-2xl border border-dashed border-brand-4/10">
                    No se encontraron detalles para esta venta.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                    {detallesTicket.map((item: any) => (
                      <div key={item.id} className="bg-card dark:bg-card/50 border-none p-3.5 rounded-xl flex gap-3 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                        <div className="w-9 h-9 bg-brand-4/10 rounded-lg flex items-center justify-center text-brand-4 font-bold flex-shrink-0 text-sm">
                          {item.cantidad}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm truncate">{item.descripcion_personalizada || item.productos?.nombre || 'Producto Eliminado'}</h4>
                          <p className="text-brand-4 text-[10px] font-mono mt-0.5">
                            {item.descripcion_personalizada ? '⚡ Servicio Variable' : (item.productos?.codigo_barras || 'Sin código')}
                          </p>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                          <span className="font-black text-emerald-500 text-sm">${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
                          <span className="text-[10px] text-brand-4 font-medium">${Number(item.precio_unitario).toFixed(2)} c/u</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total del Ticket */}
              <div className="bg-card border-none p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.08)] flex justify-between items-center">
                <span className="text-foreground font-extrabold text-base">Total Cobrado</span>
                <span className="text-3xl font-black text-emerald-500">${Number(selectedVenta.total).toFixed(2)}</span>
              </div>

            </div>

            {/* Pie del Modal con Acciones */}
            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] flex gap-3">
              <button 
                onClick={() => window.print()}
                disabled={detallesCargando || detallesTicket.length === 0}
                className="flex-1 bg-gradient-to-r from-brand-3 to-brand-5 text-white disabled:opacity-50 disabled:cursor-not-allowed font-extrabold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Reimprimir Ticket
              </button>
              <button 
                onClick={() => setSelectedVenta(null)}
                className="bg-card dark:bg-card/50 hover:bg-brand-4/10 text-foreground font-bold px-6 py-4 rounded-xl border border-brand-4/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TICKET IMPRIMIBLE HISTÓRICO (Solo visible al imprimir) */}
      {selectedVenta && detallesTicket.length > 0 && (
        <div id="ticket-print" className="font-mono text-[9px] text-black bg-white w-[72mm] p-2 leading-tight">
          {/* Cabecera Estilo Comercial Premium */}
          <div className="text-center font-bold text-[10px] uppercase tracking-wider mb-0.5">
            *** CIBER-PAPELERÍA ***
          </div>
          <div className="text-center font-black text-xs uppercase tracking-widest mb-1 text-emerald-600">
            TOP-RUNNING
          </div>
          <div className="text-center text-[8px] text-gray-700 leading-tight mb-2">
            Calle Principal #123, Col. Centro<br />
            Apizaco, Tlaxcala, C.P. 90300<br />
            Teléfono: 241-123-4567
          </div>
          
          <div className="text-center text-[8px] mb-1.5 font-bold">
            ------------------------------------------
          </div>
          
          {/* Datos del Ticket */}
          <div className="space-y-0.5 text-[8px] mb-2 font-medium">
            <div className="flex justify-between">
              <span>FOLIO TICKET:</span>
              <span className="font-bold">{selectedVenta.ticket_numero || `TK-${selectedVenta.id.toString().padStart(6, '0')}`}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span>{new Date(selectedVenta.fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</span>
            </div>
            <div className="flex justify-between">
              <span>ATENDIÓ:</span>
              <span className="uppercase">{selectedVenta.usuarios?.nombre || 'ANÓNIMO'}</span>
            </div>
          </div>
          
          <div className="text-center text-[8px] mb-1 font-bold">
            ==========================================
          </div>
          
          {/* Tabla de Productos */}
          <div className="text-[8px] font-bold flex justify-between my-0.5 pb-0.5 border-b border-dashed border-black/40">
            <span className="w-[30px] text-left">CANT</span>
            <span className="flex-1 text-left px-1">PRODUCTO</span>
            <span className="w-[60px] text-right">IMPORTE</span>
          </div>
          
          <div className="space-y-1 my-1.5">
            {detallesTicket.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-[8px] leading-tight">
                <span className="w-[30px] text-left font-bold">{item.cantidad}x</span>
                <span className="flex-1 text-left px-1 uppercase break-words line-clamp-2">{item.descripcion_personalizada || item.productos?.nombre || 'Producto Eliminado'}</span>
                <span className="w-[60px] text-right font-mono">${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center text-[8px] my-1 font-bold">
            ------------------------------------------
          </div>
          
          {/* Totales */}
          <div className="space-y-1 text-[8px] pt-0.5">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span className="font-mono">${Number(selectedVenta.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[10px] pt-1 border-t border-dotted border-black/40">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-[11px]">${Number(selectedVenta.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[8px] pt-0.5 text-gray-700">
              <span>PAGO CON:</span>
              <span className="font-mono">${Number(selectedVenta.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[10px] pt-0.5 border-t border-dashed border-black/20">
              <span>CAMBIO:</span>
              <span className="font-mono text-[11px]">$0.00</span>
            </div>
          </div>
          
          <div className="text-center text-[8px] my-2 font-bold">
            ==========================================
          </div>
          
          {/* Pie de Ticket Emotivo */}
          <div className="text-center text-[9px] font-bold uppercase tracking-wider italic">
            *** REIMPRESIÓN DE TICKET ***
          </div>
          <div className="text-center text-[7px] text-gray-600 mt-0.5">
            Gracias por su preferencia e historial.<br />
            ¡Esperamos verle pronto!
          </div>
        </div>
      )}

      {/* Estilos para impresión del Ticket Histórico - Garantiza 1 Sola Página */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          
          /* Ocultar absolutamente todo en el DOM */
          body * {
            visibility: hidden !important;
          }
          
          /* Hacer visible únicamente el ticket y sus descendientes */
          #ticket-print, #ticket-print * {
            visibility: visible !important;
          }
          
          /* Colapsar el ticket en la posición fija 0,0 para que no sume espacio de otros elementos */
          #ticket-print {
            visibility: visible !important;
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 72mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 4mm 3mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          
          /* Ocultar cabeceras y pies de página por defecto del navegador */
          @page {
            margin: 0 !important;
            size: auto !important;
          }
        }
        
        @media screen {
          #ticket-print {
            display: none !important;
          }
        }
      `}} />

    </div>
  );
}
