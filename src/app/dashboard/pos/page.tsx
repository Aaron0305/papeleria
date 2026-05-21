"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";

export default function POSPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [modalCobrarOpen, setModalCobrarOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [ventaExitosa, setVentaExitosa] = useState(false);
  
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
      setProductos(data);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Agregar al carrito
  const agregarAlCarrito = (producto: any) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      // Validar stock
      if (existe.cantidad >= producto.stock) {
        alert("No hay suficiente stock para agregar más.");
        return;
      }
      setCarrito(carrito.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ));
    } else {
      if (producto.stock <= 0) {
        alert("Este producto está agotado.");
        return;
      }
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setBusqueda(""); // Limpiar búsqueda
    setModalSearchTerm("");
  };

  // Remover del carrito
  const removerDelCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  // Actualizar cantidad
  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > item.stock) {
          alert("Stock máximo alcanzado.");
          return item;
        }
        return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
      }
      return item;
    }));
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
        alert("Producto no encontrado");
      }
    }
  };

  const [procesandoPago, setProcesandoPago] = useState(false);

  const handleCompletarVenta = async () => {
    if (carrito.length === 0) return;
    setProcesandoPago(true);
    
    // Obtener vendedor
    let vendedorId = null;
    try {
      const userStr = localStorage.getItem("pos_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        vendedorId = user.id;
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
      alert("Error al registrar la venta.");
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
      subtotal: item.precio_venta * item.cantidad
    }));

    const { error: detallesError } = await supabase
      .from("detalles_venta")
      .insert(detalles);

    if (detallesError) {
      console.error("Error al guardar detalles:", detallesError);
    }

    // 3. Descontar Stock
    for (const item of carrito) {
      await supabase
        .from("productos")
        .update({ stock: item.stock - item.cantidad })
        .eq("id", item.id);
    }

    // Finalizar
    setCarrito([]);
    setModalCobrarOpen(false);
    setEfectivoRecibido("");
    fetchProductos(); // Recargar productos para actualizar stock visual
    setProcesandoPago(false);
    
    // Mostrar modal premium
    setVentaExitosa(true);
    setTimeout(() => {
      setVentaExitosa(false);
    }, 2500);
  };

  // Productos filtrados para el modal
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
    p.codigo_barras?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const cambio = Number(efectivoRecibido) - total;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-10rem)]">
      
      {/* PANEL IZQUIERDO: Búsqueda y Acciones Rápidas */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Buscador */}
        <div className="bg-card border-none p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
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
      <div className="w-full lg:w-[450px] xl:w-[500px] bg-card border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-col overflow-hidden">
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
              <div key={item.id} className="bg-card dark:bg-card/50 border-none p-4 rounded-2xl flex gap-4 relative group shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all">
                <button 
                  onClick={() => removerDelCarrito(item.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                  title="Eliminar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-12 h-12 bg-brand-4/10 rounded-xl flex items-center justify-center text-brand-4 font-bold flex-shrink-0">
                  {item.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-sm truncate">{item.nombre}</h4>
                  <p className="text-brand-4 text-xs font-mono mt-0.5">{item.codigo_barras || 'Sin código'}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 bg-brand-4/5 dark:bg-brand-4/10 rounded-xl p-1">
                      <button onClick={() => actualizarCantidad(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-background hover:shadow-sm rounded-md text-foreground transition-all">-</button>
                      <span className="text-sm font-extrabold w-8 text-center">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-background hover:shadow-sm rounded-md text-foreground transition-all">+</button>
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
              <div className="text-center bg-card border-none p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)]">
                <p className="text-brand-4 font-medium mb-1">Total a cobrar</p>
                <h3 className="text-5xl font-black text-emerald-500">${total.toFixed(2)}</h3>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-brand-5 text-white font-bold py-3 rounded-2xl border-none shadow-md shadow-brand-5/20 transition-transform hover:scale-[1.02]">
                    Efectivo
                  </button>
                  <button className="bg-card dark:bg-card/50 text-foreground hover:bg-brand-4/10 font-bold py-3 rounded-2xl border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all">
                    Tarjeta / Transf.
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)]">
              <button 
                onClick={handleCompletarVenta}
                disabled={procesandoPago}
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

      {/* MODAL: Venta Exitosa Premium */}
      {ventaExitosa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setVentaExitosa(false)}></div>
          <div className="relative bg-card border-none w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col items-center justify-center p-10 animate-in zoom-in-50 duration-300">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-foreground mb-2 text-center">¡Cobro Exitoso!</h2>
            <p className="text-brand-4 text-center font-medium">La venta ha sido registrada correctamente.</p>
          </div>
        </div>
      )}

    </div>
  );
}
