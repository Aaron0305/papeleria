"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/services/supabase/client";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

// ─── SpotlightCard Constants ─────────────────────────────────────────────────
const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

// ─── KPI SpotlightCard Component ─────────────────────────────────────────────
interface KpiCardProps {
  color: string;
  label: string;
  icon: string;
  value: React.ReactNode;
  subtitle: string;
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  loading?: boolean;
}

function KpiCard({ color, label, icon, value, subtitle, dimmed, onHoverStart, onHoverEnd, loading }: KpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  return (
    <motion.div
      ref={cardRef}
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.45 : 1,
      }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 border-black/[0.06] bg-card dark:border-white/[0.06] dark:bg-card/40 transition-[border-color] duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.14] cursor-default shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Static accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${color}18, transparent 65%)`,
        }}
      />

      {/* Dynamic hover glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${color}30, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Header: label + icon */}
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">{label}</p>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}15`,
            boxShadow: `inset 0 0 0 1px ${color}25`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-[18px] w-[18px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        {loading ? (
          <div className="h-9 w-28 rounded-lg animate-pulse" style={{ background: `${color}15` }}></div>
        ) : (
          <h3 className="text-[28px] font-black tracking-tight leading-none text-foreground">
            {value}
          </h3>
        )}
        <p className="mt-2 text-[11px] font-medium text-foreground/40">{subtitle}</p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${color}90, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function ReportesPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [eliminandoVenta, setEliminandoVenta] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Estados para ver el detalle de un ticket
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null);
  const [detallesCargando, setDetallesCargando] = useState(false);
  const [detallesTicket, setDetallesTicket] = useState<any[]>([]);
  
  // Estados para edición de ventas y listado de cajeros (asíncrono)
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [editVentaModalOpen, setEditVentaModalOpen] = useState(false);
  const [selectedVentaForEdit, setSelectedVentaForEdit] = useState<any | null>(null);
  const [editVendedorId, setEditVendedorId] = useState<any>("");
  const [editMetodoPago, setEditMetodoPago] = useState("Efectivo");
  const [editTotal, setEditTotal] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  
  // Estados para el Modal de Alerta/Confirmación Personalizado
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isAlert: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isAlert: false,
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      isAlert: true,
      onConfirm: () => {}
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({
      isOpen: true,
      title,
      message,
      isAlert: false,
      onConfirm: () => {
        onConfirm();
        setCustomConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Estados para Corte de Caja
  const [corteModalOpen, setCorteModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<"ticket" | "corte">("ticket");

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

  // Función para imprimir ticket histórico usando ventana emergente (elimina el problema de las 43 páginas)
  const imprimirTicketHistorico = (venta: any, detalles: any[]) => {
    if (!venta || !detalles || detalles.length === 0) return;
    
    const productosHTML = detalles.map((item: any) => `
      <div style="margin-bottom:4px;">
        <div style="font-weight:bold;text-transform:uppercase;">${item.descripcion_personalizada || item.productos?.nombre || 'Producto Eliminado'}</div>
        <div style="display:flex;justify-content:space-between;">
          <span>${item.cantidad} x $${Number(item.precio_unitario).toFixed(2)}</span>
          <span style="font-weight:bold;">$${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    const folio = venta.ticket_numero || `TK-${venta.id.toString().padStart(6, '0')}`;
    const fechaFormateada = new Date(venta.fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const vendedor = venta.usuarios?.nombre || 'ANÓNIMO';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket Reimpreso</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 80mm;
    padding: 1mm 3mm 3mm 3mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #000;
    font-weight: 900;
    -webkit-text-stroke: 0.3px #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-bottom: 1px dashed #000; margin: 3px 0; }
  .sep2 { border-bottom: 2px solid #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; }
  .total-row {
    display: flex; justify-content: space-between;
    font-size: 15px; font-weight: 900;
    padding: 3px 0;
    border-top: 1px dashed #000;
    border-bottom: 1px dashed #000;
    margin: 2px 0;
  }
  .big { font-size: 15px; font-weight: 900; }
</style></head><body>
  <div class="center bold" style="font-size:14px;text-transform:uppercase;">PAPELERÍA Y CIBER</div>
  <div class="center bold" style="font-size:18px;text-transform:uppercase;margin-bottom:2px;">TOP-RUNNING</div>
  <div class="center" style="font-size:10px;line-height:1.3;">San Jerónimo Ixtapantongo Centro, Mza 2<br>Tel: 7121654867</div>
  <div class="sep"></div>
  <div class="center" style="margin:3px 0;">
    Folio: <strong>${folio}</strong><br>
    ${fechaFormateada}<br>
    Atendió: <strong style="text-transform:uppercase;">${vendedor}</strong>
  </div>
  <div class="sep2"></div>
  ${productosHTML}
  <div class="sep2"></div>
  <div class="row"><span>SUBTOTAL:</span><span class="bold">$${Number(venta.total).toFixed(2)}</span></div>
  <div class="total-row"><span>TOTAL:</span><span>$${Number(venta.total).toFixed(2)}</span></div>
  <div class="row"><span>MÉTODO DE PAGO:</span><span style="text-transform:uppercase;">${venta.metodo_pago}</span></div>
  <div class="sep"></div>
  <div class="center bold" style="margin:3px 0; font-size:13px;">REIMPRESIÓN DE TICKET</div>
  <div class="center" style="font-size:10px;">Gracias por su preferencia.</div>
</body></html>`;

    // Eliminar iframe de impresión anterior si existiera
    const iframeExistente = document.getElementById("print-iframe");
    if (iframeExistente) {
      iframeExistente.remove();
    }

    // Crear un iframe invisible
    const iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.bottom = "0";
    iframe.style.right = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      const printWindow = iframe.contentWindow;
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // Remover el iframe después de un tiempo prudente
          setTimeout(() => {
            iframe.remove();
          }, 1000);
        }, 250);
      }
    }
  };

  const handleReimprimirDirecto = async (venta: any) => {
    setSelectedVenta(venta);
    setDetallesCargando(true);
    setDetallesTicket([]);
    
    const { data, error } = await supabase
      .from("detalles_venta")
      .select("*, productos(nombre, codigo_barras)")
      .eq("venta_id", venta.id);
      
    if (!error && data) {
      setDetallesTicket(data);
      imprimirTicketHistorico(venta, data);
    } else {
      console.error("Error al cargar detalles para reimprimir:", error);
      showAlert("Error", "No se pudieron obtener los detalles del ticket para reimprimir.");
    }
    setDetallesCargando(false);
  };

  const handleEliminarVenta = (ventaId: any) => {
    showConfirm(
      "¿Eliminar Ticket?",
      "¿Estás seguro de que deseas eliminar permanentemente este ticket? Esto cancelará la venta, RESTAURARÁ el stock de los productos físicos en tu inventario y borrará el registro de la base de datos.",
      async () => {
        setEliminandoVenta(true);
        try {
          // 1. Obtener detalles de venta para restaurar stock
          const { data: detalles, error: detallesError } = await supabase
            .from("detalles_venta")
            .select("*")
            .eq("venta_id", ventaId);

          if (detallesError) throw detallesError;

          // 2. Restaurar stock de productos físicos
          if (detalles && detalles.length > 0) {
            for (const item of detalles) {
              // Ignorar el comodín de servicios (id: 9999)
              if (item.producto_id !== 9999) {
                // Obtener stock actual
                const { data: prod, error: prodError } = await supabase
                  .from("productos")
                  .select("stock")
                  .eq("id", item.producto_id)
                  .single();

                if (!prodError && prod) {
                  const nuevoStock = (prod.stock || 0) + item.cantidad;
                  await supabase
                    .from("productos")
                    .update({ stock: nuevoStock })
                    .eq("id", item.producto_id);
                }
              }
            }
          }

          // 3. Eliminar de detalles_venta
          const { error: delDetallesError } = await supabase
            .from("detalles_venta")
            .delete()
            .eq("venta_id", ventaId);

          if (delDetallesError) throw delDetallesError;

          // 4. Eliminar de ventas
          const { error: delVentaError } = await supabase
            .from("ventas")
            .delete()
            .eq("id", ventaId);

          if (delVentaError) throw delVentaError;

          showAlert("Venta Eliminada", "Venta eliminada y stock restaurado exitosamente.");
          setSelectedVenta(null);
          fetchVentas();
        } catch (error: any) {
          console.error("Error al eliminar venta:", error);
          showAlert("Error", "Ocurrió un error al eliminar la venta: " + (error.message || error));
        } finally {
          setEliminandoVenta(false);
        }
      }
    );
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

  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    if (!error && data) {
      setUsuarios(data);
    }
  };

  const generateTicketBarcodePDF = (venta: any) => {
    const ticketNo = venta.ticket_numero || `TK-${venta.id.toString().padStart(6, '0')}`;
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, ticketNo, {
        format: "CODE128",
        width: 3,
        height: 80,
        displayValue: true,
        fontSize: 20,
        margin: 10
      });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [50, 50]
      });
      
      const imgWidth = 46;
      const ratio = canvas.height / canvas.width;
      const imgHeight = imgWidth * ratio; 
      const x = (50 - imgWidth) / 2;
      const y = (50 - imgHeight) / 2;
      
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`Codigo_Barras_${ticketNo}.pdf`);
    } catch (e) {
      showAlert("Error", "No se pudo generar el código de barras para este folio.");
      console.error(e);
    }
  };

  const openEditVentaModal = (venta: any) => {
    setSelectedVentaForEdit(venta);
    setEditVendedorId(venta.vendedor_id || "");
    setEditMetodoPago(venta.metodo_pago || "Efectivo");
    setEditTotal(Number(venta.total).toString());
    setEditVentaModalOpen(true);
  };

  const handleGuardarEdicionVenta = async () => {
    if (!selectedVentaForEdit) return;
    setGuardandoEdicion(true);
    try {
      const { error } = await supabase
        .from("ventas")
        .update({
          vendedor_id: editVendedorId || null,
          metodo_pago: editMetodoPago,
          total: Number(editTotal)
        })
        .eq("id", selectedVentaForEdit.id);

      if (error) throw error;

      showAlert("Venta Actualizada", "Venta actualizada exitosamente.");
      setEditVentaModalOpen(false);
      fetchVentas();
    } catch (error: any) {
      console.error("Error al actualizar venta:", error);
      showAlert("Error", "Error al actualizar la venta: " + (error.message || error));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchUsuarios();

    const storedUser = localStorage.getItem("pos_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
  const ticketPromedio = ventasFiltradas.length > 0 ? (ingresosDelDia / ventasFiltradas.length) : 0;

  // Desglose de métodos de pago para el Corte
  const desgloseMetodos = ventasFiltradas.reduce((acc, v) => {
    const metodo = v.metodo_pago || 'Efectivo';
    acc[metodo] = (acc[metodo] || 0) + Number(v.total);
    return acc;
  }, {} as Record<string, number>);

  const handleAbrirCorteModal = () => {
    if (ventasFiltradas.length === 0) {
      showAlert("Sin Ventas", "No hay ventas registradas en la fecha seleccionada para realizar un corte.");
      return;
    }
    setPrintMode("corte");
    setCorteModalOpen(true);
  };

  const handleImprimirCorte = () => {
    setPrintMode("corte");
    setTimeout(() => {
      window.print();
    }, 150);
  };

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
            onClick={handleAbrirCorteModal}
            className="bg-brand-5 hover:bg-brand-4 text-background font-black py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 h-[48px] self-end whitespace-nowrap"
            title="Generar Corte de Caja de esta Fecha"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Corte de Caja
          </button>
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

      {/* Tarjetas de Resumen Spotlight — 3D Tilt + Glow + Shimmer */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: "1200px" }}>
        <KpiCard
          color="#00dfb2"
          label="Ingresos Período"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          value={`$${ingresosDelDia.toFixed(2)}`}
          subtitle={fechaFiltro ? `Filtrado por fecha (${fechaFiltro})` : "Total acumulado general"}
          loading={loading}
          dimmed={hoveredCard !== null && hoveredCard !== "ingresos"}
          onHoverStart={() => setHoveredCard("ingresos")}
          onHoverEnd={() => setHoveredCard(null)}
        />
        <KpiCard
          color="#00a2f9"
          label="Tickets Emitidos"
          icon="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          value={ventasFiltradas.length}
          subtitle="Ventas registradas en el período"
          loading={loading}
          dimmed={hoveredCard !== null && hoveredCard !== "tickets"}
          onHoverStart={() => setHoveredCard("tickets")}
          onHoverEnd={() => setHoveredCard(null)}
        />
        <KpiCard
          color="#f59e0b"
          label="Ticket Promedio"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          value={`$${ticketPromedio.toFixed(2)}`}
          subtitle="Valor promedio de las ventas"
          loading={loading}
          dimmed={hoveredCard !== null && hoveredCard !== "promedio"}
          onHoverStart={() => setHoveredCard("promedio")}
          onHoverEnd={() => setHoveredCard(null)}
        />
        <KpiCard
          color="#006199"
          label="Total por Día"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          value={`$${ingresosDelDia.toFixed(2)}`}
          subtitle={fechaFiltro ? `Caja del día (${fechaFiltro})` : "Caja del día de hoy"}
          loading={loading}
          dimmed={hoveredCard !== null && hoveredCard !== "diario"}
          onHoverStart={() => setHoveredCard("diario")}
          onHoverEnd={() => setHoveredCard(null)}
        />
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
                <th className="p-5 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-4/5 dark:divide-brand-4/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-4 font-medium animate-pulse">
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-4">
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
                    <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {/* Reimprimir Ticket (Habilitado para todos, incluyendo Cajero) */}
                        <button
                          onClick={() => handleReimprimirDirecto(venta)}
                          className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          title="Reimprimir Ticket"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>

                        {/* Acciones de Administrador */}
                        {user?.rol !== "cajero" && (
                          <>
                            {/* Imprimir Código de Barras */}
                            <button
                              onClick={() => generateTicketBarcodePDF(venta)}
                              className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                              title="Imprimir Código de Barras del Ticket"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM9 16V8m3 8V8m3 8V8" />
                              </svg>
                            </button>
                            {/* Editar */}
                            <button
                              onClick={() => openEditVentaModal(venta)}
                              className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                              title="Editar Venta"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            {/* Eliminar */}
                            <button
                              onClick={() => handleEliminarVenta(venta.id)}
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                              title="Eliminar Venta"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
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
            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] flex flex-col sm:flex-row gap-3">
              {user?.rol !== "cajero" && (
                <button 
                  onClick={() => handleEliminarVenta(selectedVenta.id)}
                  disabled={eliminandoVenta}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-extrabold px-5 py-4 rounded-xl border border-red-500/20 shadow-sm transition-all flex items-center justify-center gap-2"
                  title="Eliminar Venta permanentemente y devolver stock"
                >
                  {eliminandoVenta ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  <span>Eliminar</span>
                </button>
              )}
              <button 
                onClick={() => imprimirTicketHistorico(selectedVenta, detallesTicket)}
                disabled={detallesCargando || detallesTicket.length === 0 || eliminandoVenta}
                className="flex-1 bg-gradient-to-r from-brand-3 to-brand-5 hover:from-brand-4 hover:to-brand-5 text-white disabled:opacity-50 disabled:cursor-not-allowed font-extrabold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Reimprimir
              </button>
              <button 
                onClick={() => setSelectedVenta(null)}
                disabled={eliminandoVenta}
                className="bg-card dark:bg-card/50 hover:bg-brand-4/10 text-foreground font-bold px-6 py-4 rounded-xl border border-brand-4/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Editar Venta */}
      {editVentaModalOpen && selectedVentaForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditVentaModalOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Modal */}
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar Información de Venta
              </h2>
              <button 
                onClick={() => setEditVentaModalOpen(false)} 
                className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-6 bg-background/30 dark:bg-background/10">
              
              {/* Información General (No Editable) */}
              <div className="bg-card border-none p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.08)] text-sm text-foreground">
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Folio original:</span>
                  <span className="font-mono font-bold text-brand-5">{selectedVentaForEdit.ticket_numero || `TK-${selectedVentaForEdit.id.toString().padStart(6, '0')}`}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-brand-4 font-bold">Fecha de Registro:</span>
                  <span className="font-medium">{new Date(selectedVentaForEdit.fecha).toLocaleString('es-MX')}</span>
                </div>
              </div>

              {/* Formulario Editable */}
              <div className="space-y-4">
                {/* Cajero / Vendedor */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-brand-4 mb-1.5 uppercase tracking-wider">Vendedor / Cajero</label>
                  <select
                    value={editVendedorId}
                    onChange={(e) => setEditVendedorId(e.target.value)}
                    className="w-full bg-card border border-brand-4/15 text-foreground rounded-xl py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-5 focus:border-transparent transition-all font-bold"
                  >
                    <option value="">Anónimo / Sin Cajero</option>
                    {usuarios.map((user) => (
                      <option key={user.id} value={user.id}>{user.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Método de Pago */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-brand-4 mb-1.5 uppercase tracking-wider">Método de Pago</label>
                  <select
                    value={editMetodoPago}
                    onChange={(e) => setEditMetodoPago(e.target.value)}
                    className="w-full bg-card border border-brand-4/15 text-foreground rounded-xl py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-5 focus:border-transparent transition-all font-bold"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Otros">Otros / Crédito</option>
                  </select>
                </div>

                {/* Monto Total */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-brand-4 mb-1.5 uppercase tracking-wider">Monto Total de Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full bg-card border border-brand-4/15 text-foreground rounded-xl py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-5 focus:border-transparent transition-all font-bold"
                    placeholder="Monto de la venta"
                  />
                </div>
              </div>

            </div>

            {/* Pie del Modal */}
            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] flex gap-3">
              <button 
                onClick={() => setEditVentaModalOpen(false)}
                disabled={guardandoEdicion}
                className="flex-1 bg-card dark:bg-card/50 hover:bg-brand-4/10 text-foreground font-bold py-4 rounded-xl border border-brand-4/10 transition-all text-center"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarEdicionVenta}
                disabled={guardandoEdicion || !editTotal || isNaN(Number(editTotal))}
                className="flex-1 bg-gradient-to-r from-brand-3 to-brand-5 hover:from-brand-4 hover:to-brand-5 text-white disabled:opacity-50 disabled:cursor-not-allowed font-extrabold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {guardandoEdicion ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>Guardar Cambios</span>
              </button>
            </div>

          </div>
        </div>
      )}



      {/* CORTE DE CAJA IMPRIMIBLE (Solo visible al imprimir) */}
      {printMode === "corte" && ventasFiltradas.length > 0 && (
        <div id="corte-print" className="font-mono text-[9px] text-black bg-white w-[72mm] p-2 leading-tight">
          <div className="text-center font-bold text-[10px] uppercase tracking-wider mb-0.5">
            *** CORTE DE CAJA DIARIO ***
          </div>
          <div className="text-center font-black text-xs uppercase tracking-widest mb-1 text-emerald-600">
            TOP-RUNNING
          </div>
          <div className="text-center text-[8px] text-gray-700 leading-tight mb-2">
            San Jerónimo Ixtapantongo Centro, Manzana 2<br />
            Teléfono: 7121654867
          </div>
          <div className="text-center text-[8px] mb-1.5 font-bold">
            ------------------------------------------
          </div>
          
          <div className="space-y-0.5 text-[8px] mb-2 font-medium">
            <div className="flex justify-between">
              <span>FECHA DEL CORTE:</span>
              <span className="font-bold">{fechaFiltro || new Date().toLocaleDateString('en-CA')}</span>
            </div>
            <div className="flex justify-between">
              <span>IMPRESO EL:</span>
              <span>{new Date().toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between">
              <span>TRANSACCIONES:</span>
              <span className="font-bold">{ventasFiltradas.length}</span>
            </div>
          </div>

          <div className="text-center text-[8px] mb-1 font-bold">
            ==========================================
          </div>

          <div className="text-[8px] font-bold text-center my-1 uppercase">
            RESUMEN DE INGRESOS
          </div>

          <div className="space-y-1 my-1.5 text-[8px]">
            <div className="flex justify-between">
              <span>EFECTIVO:</span>
              <span className="font-mono">${(desgloseMetodos["Efectivo"] || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>TARJETA:</span>
              <span className="font-mono">${(desgloseMetodos["Tarjeta"] || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>TRANSFERENCIA:</span>
              <span className="font-mono">${(desgloseMetodos["Transferencia"] || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>OTROS / CRÉDITO:</span>
              <span className="font-mono">${(desgloseMetodos["Otros"] || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-[8px] mb-1 font-bold">
            ------------------------------------------
          </div>

          <div className="flex justify-between font-bold text-[10px] pt-1">
            <span>TOTAL CAJA:</span>
            <span className="font-mono text-[11px]">${ingresosDelDia.toFixed(2)}</span>
          </div>

          <div className="text-center text-[8px] my-2 font-bold">
            ==========================================
          </div>

          <div className="text-[8px] font-bold text-center my-1 uppercase">
            DESGLOSE DE TRANSACCIONES
          </div>
          <div className="space-y-1 my-1.5 text-[7px] leading-tight">
            {ventasFiltradas.map((v, i) => (
              <div key={i} className="flex justify-between">
                <span>{v.ticket_numero || `TK-${v.id.toString().padStart(6, '0')}`} ({new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })})</span>
                <span className="font-mono">${Number(v.total).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-[8px] my-4 font-bold">
            ------------------------------------------
          </div>

          <div className="mt-8 flex flex-col gap-6 text-[8px] text-center uppercase">
            <div className="border-t border-black w-2/3 mx-auto pt-1 mt-4">
              FIRMA CAJERO
            </div>
            <div className="border-t border-black w-2/3 mx-auto pt-1 mt-4">
              FIRMA ADMINISTRADOR
            </div>
          </div>
          
          <div className="text-center text-[7px] text-gray-600 mt-6">
            Corte de caja generado correctamente.<br />
            ¡TOP-RUNNING Sistemas de Control!
          </div>
        </div>
      )}

      {/* MODAL: Corte de Caja Visual */}
      {corteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setCorteModalOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Corte de Caja Diario
              </h2>
              <button 
                onClick={() => setCorteModalOpen(false)} 
                className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] bg-background/30 dark:bg-background/10">
              
              {/* Información General */}
              <div className="bg-card border-none p-4 rounded-2xl shadow-sm space-y-2 text-sm text-foreground">
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Fecha del Corte:</span>
                  <span className="font-bold text-brand-5">{fechaFiltro || new Date().toLocaleDateString('en-CA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Total Transacciones:</span>
                  <span className="font-bold">{ventasFiltradas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-4 font-bold">Ticket Promedio:</span>
                  <span className="font-bold">${ticketPromedio.toFixed(2)}</span>
                </div>
              </div>

              {/* Desglose de Métodos de Pago */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-4 uppercase tracking-wider">Ingresos por Método de Pago</label>
                <div className="space-y-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia', 'Otros'].map((metodo) => (
                    <div key={metodo} className="bg-card dark:bg-card/50 border-none p-3.5 rounded-xl flex justify-between items-center shadow-sm">
                      <span className="font-bold text-foreground text-sm">{metodo === 'Otros' ? 'Otros / Crédito' : metodo}</span>
                      <span className="font-black text-emerald-500 text-base">${(desgloseMetodos[metodo] || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gran Total */}
              <div className="bg-card border-none p-5 rounded-2xl shadow-md flex justify-between items-center border border-emerald-500/10">
                <span className="text-foreground font-extrabold text-base">Caja Total del Día</span>
                <span className="text-3xl font-black text-emerald-500">${ingresosDelDia.toFixed(2)}</span>
              </div>

            </div>

            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] flex gap-3">
              <button 
                onClick={() => { setPrintMode("corte"); setTimeout(window.print, 100); }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-extrabold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Corte
              </button>
              <button 
                onClick={() => setCorteModalOpen(false)}
                className="bg-card dark:bg-card/50 hover:bg-brand-4/10 text-foreground font-bold px-6 py-4 rounded-xl border border-brand-4/10 shadow-sm transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Alerta / Confirmación Personalizado Premium */}
      {customConfirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setCustomConfirm(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="relative bg-card border-none w-full max-w-sm rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgb(0,0,0,0.3)] p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Icono decorativo */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${customConfirm.isAlert ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
              {customConfirm.isAlert ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">{customConfirm.title}</h3>
            <p className="text-sm text-brand-4 mb-6 leading-relaxed">{customConfirm.message}</p>
            
            <div className="flex gap-3 w-full">
              {!customConfirm.isAlert && (
                <button
                  type="button"
                  onClick={() => setCustomConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 bg-brand-4/5 dark:bg-brand-4/10 hover:bg-brand-4/15 text-foreground font-bold py-3 rounded-xl transition-all text-sm border border-brand-4/10"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!customConfirm.isAlert) {
                    customConfirm.onConfirm();
                  } else {
                    setCustomConfirm(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className={`flex-1 text-white font-extrabold py-3 rounded-xl transition-all text-sm shadow-md ${
                  customConfirm.isAlert 
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10' 
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                }`}
              >
                {customConfirm.isAlert ? 'Aceptar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión - Optimizado para POS80 (80mm) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            overflow: hidden !important;
          }
          
          body * {
            visibility: hidden !important;
          }
          
          #corte-print, #corte-print * {
            visibility: visible !important;
            color: black !important;
          }
          
          #corte-print {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 1mm 2mm 2mm 2mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          
          @page {
            margin: 0 !important;
            padding: 0 !important;
            size: 80mm auto !important;
          }
        }
        
        @media screen {
          #corte-print {
            display: none !important;
          }
        }
      `}} />

    </div>
  );
}
