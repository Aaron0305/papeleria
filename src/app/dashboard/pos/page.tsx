"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/services/supabase/client";
import { cn } from "@/lib/utils";

export default function POSPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const ticketImpresoRef = useRef<string | null>(null);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [modalCobrarOpen, setModalCobrarOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [ultimoCambio, setUltimoCambio] = useState(0);
  const [ticketActivo, setTicketActivo] = useState<any>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"catalogo" | "ticket">("catalogo");

  // Estados para el Modal de Servicio Variable
  const [modalServicioOpen, setModalServicioOpen] = useState(false);
  const [servicioConcepto, setServicioConcepto] = useState("");
  const [servicioPrecio, setServicioPrecio] = useState("");
  const [servicioCantidad, setServicioCantidad] = useState("1");
  
  // Estados para Gestión Asíncrona de Servicios Rápidos (Atajos)
  const [serviciosRapidos, setServiciosRapidos] = useState<any[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [creandoAtajo, setCreandoAtajo] = useState(false);
  const [nuevoAtajoNombre, setNuevoAtajoNombre] = useState("");
  const [nuevoAtajoPrecio, setNuevoAtajoPrecio] = useState("");
  const [nuevoAtajoColor, setNuevoAtajoColor] = useState("purple");
  const colorMap: {[key: string]: { bg: string, text: string, border: string, hover: string }} = {
    purple: { bg: 'bg-purple-500/10 hover:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20 hover:border-purple-500', hover: 'hover:bg-purple-500/10' },
    indigo: { bg: 'bg-indigo-500/10 hover:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20 hover:border-indigo-500', hover: 'hover:bg-indigo-500/10' },
    emerald: { bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500', hover: 'hover:bg-emerald-500/10' },
    pink: { bg: 'bg-pink-500/10 hover:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20 hover:border-pink-500', hover: 'hover:bg-pink-500/10' },
    amber: { bg: 'bg-amber-500/10 hover:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20 hover:border-amber-500', hover: 'hover:bg-amber-500/10' },
    rose: { bg: 'bg-rose-500/10 hover:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20 hover:border-rose-500', hover: 'hover:bg-rose-500/10' },
    cyan: { bg: 'bg-cyan-500/10 hover:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20 hover:border-cyan-500', hover: 'hover:bg-cyan-500/10' },
    teal: { bg: 'bg-teal-500/10 hover:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20 hover:border-teal-500', hover: 'hover:bg-teal-500/10' },
    violet: { bg: 'bg-violet-500/10 hover:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20 hover:border-violet-500', hover: 'hover:bg-violet-500/10' }
  };

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
  
  // Totales
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  const total = subtotal;

  // Cargar productos para el modal de búsqueda visual
  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });

    if (!error && data) {
      // Excluir el comodín de servicios del catálogo visual general de productos físicos
      setProductos(data.filter((p: any) => p.id !== 9999 && p.codigo_barras !== "SERVICIOS"));
    }
  };

  // Cargar servicios rápidos desde base de datos e integrar con localStorage
  const fetchServiciosRapidos = async () => {
    setCargandoServicios(true);
    
    // Obtener locales de respaldo
    const respaldo = [
      { id: 1, nombre: "Impresión BN", color: "purple", precio_sugerido: 2.00 },
      { id: 2, nombre: "Impresión Color", color: "indigo", precio_sugerido: 5.00 },
      { id: 3, nombre: "Copia BN", color: "emerald", precio_sugerido: 2.00 },
      { id: 4, nombre: "Copia Color", color: "pink", precio_sugerido: 5.00 },
      { id: 5, nombre: "Escaneo / PDF", color: "amber", precio_sugerido: 10.00 },
      { id: 6, nombre: "Trámite de Acta", color: "rose", precio_sugerido: 50.00 },
      { id: 7, nombre: "Uso de Computadora", color: "cyan", precio_sugerido: 15.00 },
      { id: 8, font: "", nombre: "Recibo de Luz / Pago", color: "teal", precio_sugerido: 10.00 },
      { id: 9, nombre: "Servicio General", color: "violet", precio_sugerido: 0.00 }
    ];

    const localesStr = localStorage.getItem("pos_servicios_locales");
    const locales = localesStr ? JSON.parse(localesStr) : [];

    const { data, error } = await supabase
      .from("servicios_rapidos")
      .select("*")
      .order("nombre", { ascending: true });

    if (!error && data) {
      // Evitar duplicar si por casualidad ya están en la base de datos
      const dbNombres = new Set(data.map((s: any) => s.nombre.toLowerCase()));
      const filtradosLocales = locales.filter((s: any) => !dbNombres.has(s.nombre.toLowerCase()));
      setServiciosRapidos([...data, ...filtradosLocales].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)));
    } else {
      console.warn("No se pudieron cargar servicios rápidos dinámicos de BD, usando predefinidos y locales:", error);
      setServiciosRapidos([...respaldo, ...locales].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }
    setCargandoServicios(false);
  };

  // Eliminar un servicio rápido de forma asíncrona
  const eliminarServicioRapido = (id: any) => {
    // Si es un id local de respaldo (número <= 9) no intentamos BD
    if (typeof id === 'number' && id <= 9) {
      setServiciosRapidos(prev => prev.filter(s => s.id !== id));
      return;
    }
    
    showConfirm(
      "¿Eliminar Atajo?",
      "¿Seguro que deseas eliminar este atajo de servicio?",
      async () => {
        // Si es un id generado en localStorage
        if (typeof id === 'string' && id.startsWith('local-')) {
          const localesStr = localStorage.getItem("pos_servicios_locales");
          if (localesStr) {
            const locales = JSON.parse(localesStr);
            const filtrados = locales.filter((s: any) => s.id !== id);
            localStorage.setItem("pos_servicios_locales", JSON.stringify(filtrados));
          }
          fetchServiciosRapidos();
          return;
        }

        const { error } = await supabase
          .from("servicios_rapidos")
          .delete()
          .eq("id", id);

        if (!error) {
          // Remover también de localStorage por redundancia
          const localesStr = localStorage.getItem("pos_servicios_locales");
          if (localesStr) {
            const locales = JSON.parse(localesStr);
            const filtrados = locales.filter((s: any) => s.id !== id);
            localStorage.setItem("pos_servicios_locales", JSON.stringify(filtrados));
          }
          fetchServiciosRapidos();
        } else {
          // Si falló Supabase por tabla inexistente pero estaba en local storage
          const localesStr = localStorage.getItem("pos_servicios_locales");
          if (localesStr) {
            const locales = JSON.parse(localesStr);
            const filtrados = locales.filter((s: any) => s.id !== id);
            localStorage.setItem("pos_servicios_locales", JSON.stringify(filtrados));
          }
          fetchServiciosRapidos();
        }
      }
    );
  };

  // Guardar nuevo servicio rápido de forma asíncrona (Con local storage fallback)
  const guardarNuevoServicioRapido = async () => {
    if (!nuevoAtajoNombre.trim()) {
      showAlert("Nombre Requerido", "Por favor introduce el nombre del atajo.");
      return;
    }

    const precio = nuevoAtajoPrecio ? Number(nuevoAtajoPrecio) : 0.00;
    if (isNaN(precio) || precio < 0) {
      showAlert("Precio Inválido", "El precio sugerido debe ser un número válido mayor o igual a 0.");
      return;
    }

    const { error } = await supabase
      .from("servicios_rapidos")
      .insert([{
        nombre: nuevoAtajoNombre.trim(),
        precio_sugerido: precio,
        color: nuevoAtajoColor
      }]);

    if (!error) {
      setNuevoAtajoNombre("");
      setNuevoAtajoPrecio("");
      setNuevoAtajoColor("purple");
      setCreandoAtajo(false);
      fetchServiciosRapidos();
    } else {
      console.warn("Fallo inserción en BD de servicios_rapidos, insertando en localStorage local:", error);
      const nuevoLocal = {
        id: `local-${Date.now()}`,
        nombre: nuevoAtajoNombre.trim(),
        color: nuevoAtajoColor,
        precio_sugerido: precio
      };
      
      // Guardar en localStorage
      const localesStr = localStorage.getItem("pos_servicios_locales");
      const locales = localesStr ? JSON.parse(localesStr) : [];
      locales.push(nuevoLocal);
      localStorage.setItem("pos_servicios_locales", JSON.stringify(locales));
      
      setNuevoAtajoNombre("");
      setNuevoAtajoPrecio("");
      setNuevoAtajoColor("purple");
      setCreandoAtajo(false);
      fetchServiciosRapidos();
      
      showAlert("Atajo Guardado", "Servicio guardado de forma persistente en tu navegador.");
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchServiciosRapidos();
  }, []);

  // Función de impresión por ventana emergente — Resuelve el problema de 43 páginas
  const imprimirTicketPopup = (ticket: any) => {
    if (!ticket) return;
    const productosHTML = ticket.productos.map((item: any) => `
      <div style="margin-bottom:4px;">
        <div style="font-weight:bold;text-transform:uppercase;">${item.nombre}</div>
        <div style="display:flex;justify-content:space-between;">
          <span>${item.cantidad} x $${item.precio_venta.toFixed(2)}</span>
          <span style="font-weight:bold;">$${(item.precio_venta * item.cantidad).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ticket</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 72mm;
    margin: 0 auto;
    padding: 1mm 2mm 3mm 2mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-bottom: 1px dashed #000; margin: 4px 0; }
  .sep2 { border-bottom: 2px solid #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; }
  .total-row {
    display: flex; justify-content: space-between;
    font-size: 14px; font-weight: bold;
    padding: 4px 0;
    border-top: 1px dashed #000;
    border-bottom: 1px dashed #000;
    margin: 3px 0;
  }
  .big { font-size: 14px; font-weight: bold; }
</style></head><body>
  <div class="center bold" style="font-size:14px;text-transform:uppercase;">PAPELERÍA Y CIBER</div>
  <div class="center bold" style="font-size:18px;text-transform:uppercase;margin-bottom:2px;">TOP-RUNNING</div>
  <div class="center" style="font-size:10px;line-height:1.3;">San Jerónimo Ixtapantongo Centro, Mza 2<br>Tel: 7121654867</div>
  <div class="sep"></div>
  <div class="center" style="margin:3px 0;">
    Folio: <strong>${ticket.ticket_numero}</strong><br>
    ${ticket.fecha}<br>
    Atendió: <strong style="text-transform:uppercase;">${ticket.vendedor}</strong>
  </div>
  <div class="sep2"></div>
  ${productosHTML}
  <div class="sep2"></div>
  <div class="row"><span>SUBTOTAL:</span><span class="bold">$${ticket.total.toFixed(2)}</span></div>
  <div class="total-row"><span>TOTAL:</span><span>$${ticket.total.toFixed(2)}</span></div>
  <div class="row"><span>EFECTIVO:</span><span>$${ticket.efectivo.toFixed(2)}</span></div>
  <div class="row big"><span>CAMBIO:</span><span>$${ticket.cambio.toFixed(2)}</span></div>
  <div class="sep"></div>
  <div class="center bold" style="margin:3px 0;">¡Gracias por su compra!</div>
  <div class="center" style="font-size:9px;">Conserve este ticket para cualquier aclaración.</div>
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

  // Efecto para imprimir el ticket automáticamente cuando esté listo y evitar duplicados
  useEffect(() => {
    if (ticketActivo && ticketImpresoRef.current !== ticketActivo.id) {
      ticketImpresoRef.current = ticketActivo.id;
      const timer = setTimeout(() => {
        imprimirTicketPopup(ticketActivo);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ticketActivo]);

  // Agregar al carrito
  const agregarAlCarrito = (producto: any) => {
    if (producto.id === 9999) return; // Ignorar el comodín si intenta agregarse directo

    const existe = carrito.find(item => item.id === producto.id && !item.es_servicio);
    if (existe) {
      // Validar stock
      if (existe.cantidad >= producto.stock) {
        showAlert("Sin Stock", "No hay suficiente stock para agregar más de este producto.");
        return;
      }
      setCarrito(carrito.map(item => 
        (item.id === producto.id && !item.es_servicio)
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ));
    } else {
      if (producto.stock <= 0) {
        showAlert("Agotado", "Este producto está agotado.");
        return;
      }
      setCarrito([...carrito, { 
        ...producto, 
        shadow: false,
        cantidad: 1, 
        es_servicio: false, 
        carritoId: `prod-${producto.id}` 
      }]);
    }
    setBusqueda(""); // Limpiar búsqueda
    setModalSearchTerm("");
  };

  // Remover del carrito
  const removerDelCarrito = (carritoId: string) => {
    setCarrito(carrito.filter(item => item.carritoId !== carritoId));
  };

  // Actualizar cantidad
  const actualizarCantidad = (carritoId: string, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.carritoId === carritoId) {
        const nuevaCantidad = item.cantidad + delta;
        if (!item.es_servicio && nuevaCantidad > item.stock) {
          showAlert("Sin Stock", "Stock máximo alcanzado para este producto.");
          return item;
        }
        return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
      }
      return item;
    }));
  };

  // Agregar Servicio Rápido al Carrito
  const agregarServicioAlCarrito = () => {
    if (!servicioConcepto.trim()) {
      showAlert("Concepto Requerido", "Por favor escribe el concepto del servicio.");
      return;
    }
    const precio = Number(servicioPrecio);
    if (isNaN(precio) || precio <= 0) {
      showAlert("Precio Requerido", "Por favor ingresa un precio válido mayor a 0.");
      return;
    }
    const cantidad = Number(servicioCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      showAlert("Cantidad Requerida", "Por favor ingresa una cantidad válida.");
      return;
    }

    const nuevoServicio = {
      id: 9999, // ID del producto comodín de servicios en Supabase
      codigo_barras: 'SERVICIOS',
      nombre: servicioConcepto.trim(),
      precio_venta: precio,
      stock: 999999,
      cantidad: cantidad,
      es_servicio: true,
      carritoId: `serv-${Date.now()}-${Math.random()}`
    };

    setCarrito([...carrito, nuevoServicio]);
    
    // Limpiar y cerrar
    setServicioConcepto("");
    setServicioPrecio("");
    setServicioCantidad("1");
    setModalServicioOpen(false);
  };

  // Búsqueda principal
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) return;

    // 1. Coincidencia exacta de código de barras
    const productoPorCodigo = productos.find(p => 
      p.codigo_barras?.toLowerCase() === busqueda.toLowerCase()
    );

    if (productoPorCodigo) {
      agregarAlCarrito(productoPorCodigo);
    } else {
      // 2. Coincidencias por nombre
      const productosSimilares = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );

      if (productosSimilares.length === 1) {
        agregarAlCarrito(productosSimilares[0]);
      } else if (productosSimilares.length > 1) {
        setModalSearchTerm(busqueda);
        setModalProductosOpen(true);
      } else {
        showAlert("No Encontrado", "Producto no encontrado en inventario.");
      }
    }
  };

  const [procesandoPago, setProcesandoPago] = useState(false);

  const handleCompletarVenta = async () => {
    if (carrito.length === 0) return;
    
    const finalEfectivo = efectivoRecibido ? Number(efectivoRecibido) : total;
    const finalCambio = finalEfectivo - total;
    
    setProcesandoPago(true);
    
    // Obtener vendedor
    let vendedorId = null;
    let vendedorNombre = "Cajero";
    try {
      const userStr = localStorage.getItem("pos_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        vendedorId = user.id;
        vendedorNombre = user.nombre || "Cajero";
      }
    } catch(e) {}

    // 1. Crear Venta
    const { data: ventaData, error: ventaError } = await supabase
      .from("ventas")
      .insert([{
        vendedor_id: vendedorId,
        total: total,
        metodo_pago: 'Efectivo'
      }])
      .select()
      .single();

    if (ventaError || !ventaData) {
      showAlert("Error al Cobrar", "No se pudo registrar la venta en el sistema.");
      console.error(ventaError);
      setProcesandoPago(false);
      return;
    }

    // 2. Crear Detalles
    const detalles = carrito.map(item => ({
      venta_id: ventaData.id,
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_venta,
      subtotal: item.precio_venta * item.cantidad,
      descripcion_personalizada: item.es_servicio ? item.nombre : null
    }));

    const { error: detallesError } = await supabase
      .from("detalles_venta")
      .insert(detalles);

    if (detallesError) {
      console.error("Error al guardar detalles:", detallesError);
    }

    // 3. Descontar Stock (Sólo para productos físicos reales)
    for (const item of carrito) {
      if (!item.es_servicio && item.id !== 9999) {
        await supabase
          .from("productos")
          .update({ stock: item.stock - item.cantidad })
          .eq("id", item.id);
      }
    }

    // Guardar información para el ticket y la pantalla de éxito antes de limpiar
    const ticketData = {
      id: ventaData.id,
      ticket_numero: ventaData.ticket_numero || `TK-${ventaData.id.toString().padStart(6, '0')}`,
      fecha: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
      vendedor: vendedorNombre,
      productos: [...carrito],
      total: total,
      efectivo: finalEfectivo,
      cambio: finalCambio
    };
    
    setTicketActivo(ticketData);
    setUltimoCambio(finalCambio);

    // Finalizar y Limpiar Carrito
    setCarrito([]);
    setModalCobrarOpen(false);
    setEfectivoRecibido("");
    fetchProductos(); // Recargar productos para actualizar stock visual
    setProcesandoPago(false);
    
    // Mostrar modal premium persistentemente para ver cambio y poder reimprimir
    setVentaExitosa(true);
  };

  // Productos filtrados para el modal
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
    p.codigo_barras?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const cambio = efectivoRecibido ? (Number(efectivoRecibido) - total) : 0;

  // Generar sugerencias de pago para billetes comunes de México ($20, $50, $100, $200, $500)
  const sugerenciasEfectivo = (() => {
    const sugerencias = new Set<number>();
    sugerencias.add(Math.ceil(total)); // Importe exacto
    
    const denominaciones = [20, 50, 100, 200, 500];
    denominaciones.forEach(d => {
      if (d > total) sugerencias.add(d);
    });
    
    return Array.from(sugerencias).sort((a, b) => a - b).slice(0, 4);
  })();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-10rem)]">
      
      {/* Selector de Pestañas Móvil (Segmented Controls) */}
      <div className="lg:hidden flex bg-card/85 backdrop-blur-md p-1.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-sm mb-4 w-full select-none">
        <button
          type="button"
          onClick={() => setActiveMobileTab("catalogo")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
            activeMobileTab === "catalogo"
              ? "bg-brand-3 text-white shadow-md shadow-brand-3/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Catálogo / Servicios</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("ticket")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 relative",
            activeMobileTab === "ticket"
              ? "bg-brand-5 text-brand-2 shadow-md shadow-brand-5/25"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
          </svg>
          <span>Ver Ticket</span>
          {carrito.length > 0 && (
            <span className="absolute -top-1 right-2 bg-red-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
              {carrito.reduce((acc, item) => acc + item.cantidad, 0)}
            </span>
          )}
        </button>
      </div>

      {/* PANEL IZQUIERDO: Búsqueda y Acciones Rápidas */}
      <div className={cn("flex-1 flex flex-col gap-6", activeMobileTab !== "catalogo" && "hidden lg:flex")}>
        
        {/* Buscador */}
        <div className="bg-card border-none p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escanear código de barras o buscar..."
                className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all text-lg font-medium shadow-inner"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setModalServicioOpen(true)}
              className="bg-brand-5 hover:bg-brand-4 text-brand-2 dark:text-[#001524] font-black px-6 rounded-2xl shadow-lg shadow-brand-5/10 hover:shadow-brand-4/10 transition-all flex items-center gap-2 flex-shrink-0 text-base border-none dark:bg-brand-5 dark:hover:bg-brand-4 dark:shadow-brand-5/25"
              title="Cobrar Copias, Impresiones, Trámites o Servicios"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Servicio Variable</span>
            </button>
          </form>
        </div>

        {/* Catálogo de Productos (Grid) */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-6">
            {(busqueda.trim() ? productos.filter(p => 
              p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
              p.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
            ) : productos).map((producto) => (
              <div 
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                className={`bg-card dark:bg-card/60 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,41,70,0.12)] cursor-pointer transition-all flex flex-col h-full border border-transparent hover:border-brand-5/30 ${producto.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-4/10 to-brand-5/10 rounded-2xl flex items-center justify-center text-brand-5 font-bold mb-3 shadow-sm">
                  {producto.nombre.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-foreground text-sm line-clamp-2 mb-2 flex-1 leading-snug">{producto.nombre}</h4>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-black text-emerald-500 text-lg">${producto.precio_venta}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${producto.stock > 0 ? 'bg-brand-4/10 text-brand-4' : 'bg-red-500/10 text-red-500'}`}>
                    {producto.stock > 0 ? `${producto.stock} uds` : 'Agotado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {productos.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-brand-4 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="font-medium text-lg">No hay productos en inventario</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Carrito (Ticket) */}
      <div className={cn(
        "w-full lg:w-[450px] xl:w-[500px] bg-card border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden",
        activeMobileTab !== "ticket" && "hidden lg:flex"
      )}>
        <div className="p-5 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-brand-5/20 text-brand-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            Ticket Actual
          </h2>
          {carrito.length > 0 && (
            <span className="bg-brand-4/10 text-brand-4 text-xs font-bold px-3 py-1 rounded-full">
              {carrito.length} {carrito.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30 dark:bg-background/10">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-4 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-medium text-lg">El carrito está vacío</p>
              <p className="text-sm">Escanea un producto para comenzar</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div 
                key={item.carritoId} 
                className={cn(
                  "bg-card dark:bg-card/50 border-none p-4 rounded-2xl flex gap-4 relative group shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all border border-transparent",
                  item.es_servicio && "border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/10"
                )}
              >
                <button 
                  onClick={() => removerDelCarrito(item.carritoId)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-md z-10"
                  title="Eliminar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className={cn(
                  "w-12 h-12 bg-brand-4/10 rounded-xl flex items-center justify-center text-brand-4 font-bold flex-shrink-0",
                  item.es_servicio && "bg-purple-500/20 text-purple-500"
                )}>
                  {item.es_servicio ? "⚡" : item.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-foreground text-sm truncate flex-1">{item.nombre}</h4>
                    {item.es_servicio && (
                      <span className="bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 animate-pulse">
                        Servicio
                      </span>
                    )}
                  </div>
                  <p className="text-brand-4 text-xs font-mono mt-0.5">{item.es_servicio ? "Concepto Libre" : (item.codigo_barras || 'Sin código')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 bg-brand-4/5 dark:bg-brand-4/10 rounded-xl p-1">
                      <button onClick={() => actualizarCantidad(item.carritoId, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-background hover:shadow-sm rounded-md text-foreground transition-all">-</button>
                      <span className="text-sm font-extrabold w-8 text-center">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.carritoId, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-background hover:shadow-sm rounded-md text-foreground transition-all">+</button>
                    </div>
                    <span className="font-extrabold text-emerald-500 text-lg">${(item.precio_venta * item.cantidad).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen y Cobro */}
        <div className="p-6 bg-card dark:bg-card/50 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] z-10">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-brand-4 font-medium">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {/* Si hubiera IVA, se pondría aquí */}
            <div className="flex justify-between text-3xl font-black text-foreground pt-4 border-t border-brand-4/10">
              <span>Total</span>
              <span className="text-emerald-500">${total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={carrito.length === 0}
            onClick={() => setModalCobrarOpen(true)}
            className="w-full bg-gradient-to-r from-brand-3 to-brand-5 hover:from-brand-4 hover:to-brand-5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-brand-5/30 transition-all text-xl flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cobrar Venta
          </button>
        </div>
      </div>

      {/* MODAL: Servicio Variable */}
      {modalServicioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalServicioOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Modal */}
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-brand-5/20 text-brand-5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Servicio Variable / Libre
              </h2>
              <button 
                onClick={() => setModalServicioOpen(false)} 
                className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh] bg-background/30 dark:bg-background/10 custom-scrollbar">
              
              {/* Sugerencias Rápidas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-brand-4 uppercase tracking-wider block">Servicios Predefinidos Rápidos</label>
                  {!creandoAtajo && (
                    <button
                      type="button"
                      onClick={() => setCreandoAtajo(true)}
                      className="text-brand-5 hover:text-brand-4 dark:text-brand-5 dark:hover:text-brand-4 text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Añadir Atajo</span>
                    </button>
                  )}
                </div>

                {/* Formulario de Nuevo Atajo en Línea */}
                {creandoAtajo && (
                  <div className="bg-brand-5/5 dark:bg-brand-5/10 border border-brand-5/20 p-4 rounded-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-200 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-brand-5 uppercase tracking-wider">Crear Nuevo Atajo</span>
                      <button 
                        type="button" 
                        onClick={() => setCreandoAtajo(false)}
                        className="text-brand-4 hover:text-red-500 text-xs font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-foreground block mb-1">Nombre del Atajo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Copia Oficio BN"
                          value={nuevoAtajoNombre}
                          onChange={(e) => setNuevoAtajoNombre(e.target.value)}
                          className="w-full bg-card border border-brand-4/10 text-foreground text-xs font-semibold rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-5 transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-foreground block mb-1">Precio Sugerido ($)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00 (Opcional)"
                          value={nuevoAtajoPrecio}
                          onChange={(e) => setNuevoAtajoPrecio(e.target.value)}
                          className="w-full bg-card border border-brand-4/10 text-foreground text-xs font-semibold rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-5 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Selector de Colores del Atajo */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-foreground block">Color del Botón</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(colorMap).map((colorName) => (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => setNuevoAtajoColor(colorName)}
                            className={cn(
                              "w-6 h-6 rounded-full border transition-all active:scale-90",
                              colorName === 'purple' && "bg-purple-500 border-purple-600",
                              colorName === 'indigo' && "bg-indigo-500 border-indigo-600",
                              colorName === 'emerald' && "bg-emerald-500 border-emerald-600",
                              colorName === 'pink' && "bg-pink-500 border-pink-600",
                              colorName === 'amber' && "bg-amber-500 border-amber-600",
                              colorName === 'rose' && "bg-rose-500 border-rose-600",
                              colorName === 'cyan' && "bg-cyan-500 border-cyan-600",
                              colorName === 'teal' && "bg-teal-500 border-teal-600",
                              colorName === 'violet' && "bg-violet-500 border-violet-600",
                              nuevoAtajoColor === colorName ? "ring-2 ring-offset-2 ring-brand-5 scale-110" : "opacity-75"
                            )}
                            title={colorName}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={guardarNuevoServicioRapido}
                      className="w-full bg-brand-5 hover:bg-brand-4 text-brand-2 dark:text-[#001524] font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-brand-5/10 active:scale-95"
                    >
                      Guardar Atajo
                    </button>
                  </div>
                )}

                {/* Grid de Atajos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cargandoServicios ? (
                    <div className="col-span-3 py-6 text-center text-xs font-bold text-brand-4 animate-pulse">
                      Cargando atajos...
                    </div>
                  ) : serviciosRapidos.length === 0 ? (
                    <div className="col-span-3 py-6 text-center text-xs font-bold text-brand-4 border border-dashed border-brand-4/10 rounded-xl">
                      No hay atajos guardados. ¡Haz clic en "Añadir Atajo" para crear uno!
                    </div>
                  ) : (
                    serviciosRapidos.map((serv) => (
                      <div key={serv.id} className="relative group/btn">
                        <button
                          type="button"
                          onClick={() => {
                            setServicioConcepto(serv.nombre);
                            if (serv.precio_sugerido > 0) {
                              setServicioPrecio(serv.precio_sugerido.toString());
                            }
                          }}
                          className={cn(
                            "w-full border text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm active:scale-95 text-center truncate pr-6",
                            colorMap[serv.color]?.bg || "bg-brand-4/10 hover:bg-brand-4/20",
                            colorMap[serv.color]?.text || "text-foreground",
                            colorMap[serv.color]?.border || "border-brand-4/20",
                            colorMap[serv.color]?.hover || "",
                            servicioConcepto === serv.nombre && "ring-2 ring-brand-5 font-extrabold"
                          )}
                          title={`${serv.nombre} (${serv.precio_sugerido > 0 ? `$${serv.precio_sugerido}` : 'Precio Variable'})`}
                        >
                          {serv.nombre}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarServicioRapido(serv.id);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all shadow-sm z-10 w-4.5 h-4.5 flex items-center justify-center text-[8px] opacity-0 group-hover/btn:opacity-100"
                          title="Eliminar atajo"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4 pt-4 border-t border-brand-4/10">
                {/* Concepto input */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Concepto o Descripción de Cobro</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 5 Impresiones color e Investigación de imágenes"
                    value={servicioConcepto}
                    onChange={(e) => setServicioConcepto(e.target.value)}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground font-bold rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all shadow-inner"
                  />
                </div>

                {/* Grid Precio e Cantidad */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Precio input */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Precio de Cobro ($)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-brand-4 font-black">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={servicioPrecio}
                        onChange={(e) => setServicioPrecio(e.target.value)}
                        className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground font-black rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Cantidad input */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={servicioCantidad}
                      onChange={(e) => setServicioCantidad(e.target.value)}
                      className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground font-bold rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] flex gap-3">
              <button
                type="button"
                onClick={agregarServicioAlCarrito}
                className="flex-1 bg-gradient-to-r from-brand-3 to-brand-5 hover:from-brand-4 hover:to-brand-5 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-brand-5/20 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar al Carrito
              </button>
              <button 
                type="button"
                onClick={() => setModalServicioOpen(false)}
                className="bg-card dark:bg-card/50 hover:bg-brand-4/10 text-foreground font-bold px-5 py-4 rounded-xl border border-brand-4/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Catálogo de Productos */}
      {modalProductosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pt-24 sm:pt-24">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalProductosOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-5xl h-[80vh] sm:h-[75vh] rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="bg-brand-5/20 text-brand-5 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  </svg>
                </span>
                Catálogo de Productos
              </h2>
              <button onClick={() => setModalProductosOpen(false)} className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 bg-card z-10 shadow-sm">
               <div className="relative max-w-2xl mx-auto">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
                 <input
                    type="text"
                    placeholder="Buscar producto por nombre o código..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium shadow-inner"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background/30 dark:bg-background/10">
              {productosFiltrados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-brand-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xl font-semibold">No se encontraron productos</p>
                  <p>Intenta con otra palabra clave</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {productosFiltrados.map(producto => (
                    <div 
                      key={producto.id} 
                      onClick={() => { agregarAlCarrito(producto); setModalProductosOpen(false); }}
                      className="group bg-card dark:bg-card/50 border-none p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 bg-brand-4/10 rounded-lg flex items-center justify-center text-brand-5 font-bold">
                            {producto.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${producto.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : producto.stock > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                            Stock: {producto.stock}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg leading-tight mb-1 group-hover:text-brand-5 transition-colors">{producto.nombre}</h3>
                        <p className="text-brand-4 text-xs font-mono">{producto.codigo_barras || 'Sin código'}</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-brand-4/10 flex justify-between items-center">
                        <span className="text-foreground font-medium text-sm">Precio:</span>
                        <span className="text-emerald-500 font-black text-xl">${producto.precio_venta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cobrar / Checkout */}
      {modalCobrarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalCobrarOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Completar Pago
              </h2>
              <button onClick={() => setModalCobrarOpen(false)} className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6 bg-background/30 dark:bg-background/10">
              <div className="text-center bg-card border-none p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] relative">
                <p className="text-brand-4 font-medium mb-1">Total a cobrar</p>
                <h3 className="text-4xl font-black text-emerald-500">${total.toFixed(2)}</h3>
                <span className="absolute top-3 right-4 bg-brand-5/10 text-brand-5 text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Solo Efectivo
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Efectivo Recibido</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-brand-4 text-2xl font-black">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      autoFocus
                      placeholder="0.00"
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(e.target.value)}
                      className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground font-black text-3xl rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Sugerencias Rápidas */}
                <div className="grid grid-cols-4 gap-2">
                  {sugerenciasEfectivo.map(monto => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => setEfectivoRecibido(monto.toString())}
                      className="bg-card dark:bg-card/40 border border-brand-4/10 text-foreground hover:bg-brand-5/10 hover:border-brand-5 text-sm font-extrabold py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      ${monto}
                    </button>
                  ))}
                </div>

                {/* Cambio */}
                {efectivoRecibido && Number(efectivoRecibido) >= total ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Cambio a entregar:</span>
                    <span className="text-emerald-500 font-black text-2xl">${(Number(efectivoRecibido) - total).toFixed(2)}</span>
                  </div>
                ) : efectivoRecibido && Number(efectivoRecibido) < total ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex justify-between items-center text-red-500 font-bold text-sm transition-all animate-in fade-in duration-200">
                    <span>Monto insuficiente</span>
                    <span>Resta: ${(total - Number(efectivoRecibido)).toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="bg-brand-4/5 dark:bg-brand-4/5 border border-transparent p-4 rounded-2xl flex justify-between items-center text-brand-4 text-xs font-bold transition-all">
                    <span>Escribe el monto recibido o selecciona un botón rápido.</span>
                    <span>Pago exacto por defecto.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)]">
              <button 
                onClick={handleCompletarVenta}
                disabled={procesandoPago || (efectivoRecibido !== "" && Number(efectivoRecibido) < total)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 disabled:from-brand-4 disabled:to-brand-4 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all text-xl flex items-center justify-center gap-3"
              >
                {procesandoPago ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {procesandoPago ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Venta Exitosa Premium con Cambio y Ticket */}
      {ventaExitosa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setVentaExitosa(false)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col items-center p-8 animate-in zoom-in-50 duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-foreground mb-1 text-center">¡Cobro Exitoso!</h2>
            <p className="text-brand-4 text-center font-medium text-sm mb-6">La venta ha sido registrada y el ticket enviado a la impresora.</p>
            
            {/* Visualizador del Cambio */}
            <div className="w-full bg-brand-4/5 dark:bg-brand-4/10 rounded-2xl p-5 text-center mb-6 shadow-inner border border-brand-4/10">
              <p className="text-xs text-brand-4 font-bold uppercase tracking-wider mb-1">Cambio a entregar</p>
              <h3 className="text-4xl font-black text-emerald-500">${ultimoCambio.toFixed(2)}</h3>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => imprimirTicketPopup(ticketActivo)}
                className="flex-1 bg-card dark:bg-card/50 border border-brand-5 text-brand-5 hover:bg-brand-5/10 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Reimprimir
              </button>
              <button 
                onClick={() => setVentaExitosa(false)}
                className="flex-1 bg-gradient-to-r from-brand-3 to-brand-5 text-white font-extrabold py-4 rounded-xl shadow-md transition-all text-center"
              >
                Nueva Venta
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



    </div>
  );
}
