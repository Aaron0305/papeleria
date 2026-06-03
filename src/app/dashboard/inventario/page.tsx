"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

export default function InventarioPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  // Estados para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    codigo_barras: "",
    precio_costo: "",
    ganancia: "",
    stock: ""
  });

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

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) {
      setProductos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    if (formData.codigo_barras && modalOpen) {
      try {
        JsBarcode("#barcode-preview", formData.codigo_barras, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: true,
          background: "transparent",
          margin: 0
        });
      } catch (e) {
        // Ignorar si el código no es válido mientras escribe
      }
    }
  }, [formData.codigo_barras, modalOpen]);

  const openNewModal = () => {
    setFormData({ id: "", nombre: "", codigo_barras: "", precio_costo: "", ganancia: "", stock: "" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (producto: any) => {
    const costo = producto.precio_costo || 0;
    const venta = producto.precio_venta || 0;
    setFormData({
      id: producto.id,
      nombre: producto.nombre,
      codigo_barras: producto.codigo_barras || "",
      precio_costo: costo.toString(),
      ganancia: (venta - costo).toString(),
      stock: producto.stock.toString()
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const generateBarcodePDF = (producto: any) => {
    if (!producto.codigo_barras) {
      showAlert("Código de Barras Requerido", "Este producto no tiene código de barras registrado.");
      return;
    }
    
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, producto.codigo_barras, {
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
      pdf.save(`Etiqueta_${producto.codigo_barras}.pdf`);
    } catch (e) {
      showAlert("Formato Inválido", "Formato de código de barras no válido.");
    }
  };

  const downloadBarcodeCreation = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar que el form haga submit
    if (formData.codigo_barras) {
      try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, formData.codigo_barras, {
          format: "CODE128",
          width: 3,
          height: 80,
          displayValue: true,
          fontSize: 20,
          margin: 10
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [50, 50] });
        
        const imgWidth = 46;
        const ratio = canvas.height / canvas.width;
        const imgHeight = imgWidth * ratio; 
        const x = (50 - imgWidth) / 2;
        const y = (50 - imgHeight) / 2;
        
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.save(`Etiqueta_${formData.codigo_barras}.pdf`);
      } catch(err) {
        // ignore
      }
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "¿Eliminar Producto?",
      "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.",
      async () => {
        const { error } = await supabase.from("productos").delete().eq("id", id);
        if (!error) {
          fetchProductos();
        } else {
          console.error("Error al eliminar:", error);
          if (error.code === "23503") {
            showAlert(
              "No se puede eliminar", 
              "Este producto tiene ventas registradas en el historial de tu negocio. Para mantener tus reportes e ingresos correctos no es posible borrarlo físicamente. Te recomendamos editar su stock a 0."
            );
          } else {
            showAlert("Error al Eliminar", error.message || "Error al eliminar el producto.");
          }
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const costo = parseFloat(formData.precio_costo) || 0;
    const ganancia = parseFloat(formData.ganancia) || 0;
    const venta = costo + ganancia;
    
    const payload = {
      nombre: formData.nombre,
      codigo_barras: formData.codigo_barras || null,
      precio_costo: costo,
      precio_venta: venta,
      stock: parseInt(formData.stock) || 0
    };

    if (isEditing) {
      const { error } = await supabase
        .from("productos")
        .update(payload)
        .eq("id", formData.id);
        
      if (!error) {
        setModalOpen(false);
        fetchProductos();
      } else {
        console.error("Error update:", error);
        showAlert("Error al Actualizar", error.message || 'Error desconocido');
      }
    } else {
      const { error } = await supabase
        .from("productos")
        .insert([payload]);
        
      if (!error) {
        setModalOpen(false);
        fetchProductos();
      } else {
        console.error("Error insert:", error);
        showAlert("Error al Crear", error.message || 'Verifica si el código de barras ya existe.');
      }
    }
    setSaving(false);
  };

  const handleExportExcel = () => {
    if (productos.length === 0) {
      showAlert("Sin Productos", "No hay productos en el inventario para exportar.");
      return;
    }

    const headers = ["Código de Barras", "Producto", "Precio Costo", "Precio Venta", "Ganancia", "Existencias (Stock)"];
    const rows = productos.map(p => [
      p.codigo_barras || "",
      p.nombre,
      p.precio_costo?.toFixed(2) || "0.00",
      p.precio_venta?.toFixed(2) || "0.00",
      (p.precio_venta - p.precio_costo)?.toFixed(2) || "0.00",
      p.stock.toString()
    ]);
    
    // Generar formato CSV UTF-8 con BOM para soportar correctamente caracteres en español en Excel
    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventario_Papeleria_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card border-none p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventario</h2>
          <p className="text-brand-4 text-sm mt-1">Gestiona todos los productos de tu papelería</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar a Excel
          </button>
          <button 
            onClick={openNewModal}
            className="bg-brand-5 hover:bg-brand-4 text-background font-bold py-3 px-6 rounded-2xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de Productos (Pantallas grandes) */}
      <div className="hidden md:block bg-card border-none rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-4/5 dark:bg-brand-4/10 text-brand-4 text-sm uppercase tracking-wider">
                <th className="p-5 font-semibold">Código</th>
                <th className="p-5 font-semibold">Producto</th>
                <th className="p-5 font-semibold">Precio</th>
                <th className="p-5 font-semibold">Stock</th>
                <th className="p-5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-4/5 dark:divide-brand-4/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-brand-4">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando inventario...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-brand-4">
                    <div className="bg-brand-4/5 dark:bg-brand-4/10 inline-flex p-5 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-foreground">No se encontraron productos</p>
                    <p className="text-sm mt-1">Intenta con otra búsqueda o agrega uno nuevo.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-brand-4/5 dark:hover:bg-brand-4/10 transition-colors text-foreground group">
                    <td className="p-5 text-sm font-mono text-brand-4">{producto.codigo_barras || '---'}</td>
                    <td className="p-5 font-bold">{producto.nombre}</td>
                    <td className="p-5 text-emerald-500 dark:text-emerald-400 font-black">${Number(producto.precio_venta || 0).toFixed(2)}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        producto.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : 
                        producto.stock > 0 ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {producto.stock} uds
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button 
                        onClick={() => generateBarcodePDF(producto)}
                        className="text-black dark:text-brand-5 hover:bg-brand-4/10 dark:hover:bg-brand-5/10 p-2 rounded-xl transition-colors inline-flex"
                        title="Generar Etiqueta Código de Barras PDF"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => openEditModal(producto)}
                        className="text-black dark:text-brand-5 hover:bg-brand-4/10 dark:hover:bg-brand-5/10 p-2 rounded-xl transition-colors inline-flex"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(producto.id)}
                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors inline-flex"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Tarjetas para Móviles (Pantallas pequeñas) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <div className="bg-card p-10 rounded-3xl text-center text-brand-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando inventario...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="bg-card p-10 rounded-3xl text-center text-brand-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <div className="bg-brand-4/5 dark:bg-brand-4/10 inline-flex p-5 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otra búsqueda o agrega uno nuevo.</p>
          </div>
        ) : (
          productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-card border-none p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col gap-4 border border-brand-4/5 dark:border-brand-4/10 overflow-hidden">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-brand-4 block mb-1">
                    {producto.codigo_barras || 'Sin código'}
                  </span>
                  <h4 className="font-extrabold text-foreground text-base leading-snug break-words">
                    {producto.nombre}
                  </h4>
                </div>
                <span className="font-black text-emerald-500 text-xl flex-shrink-0">
                  ${Number(producto.precio_venta || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-brand-4/5 dark:bg-brand-4/10 p-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-4 font-bold uppercase tracking-wider leading-none mb-1">Costo / Ganancia</span>
                  <span className="text-xs font-semibold text-foreground/80">
                    ${Number(producto.precio_costo || 0).toFixed(2)} / ${Number((producto.precio_venta || 0) - (producto.precio_costo || 0)).toFixed(2)}
                  </span>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  producto.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : 
                  producto.stock > 0 ? 'bg-yellow-500/10 text-yellow-500' : 
                  'bg-red-500/10 text-red-500'
                }`}>
                  {producto.stock} uds
                </span>
              </div>
              
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => generateBarcodePDF(producto)}
                  className="flex-1 bg-brand-4/10 hover:bg-brand-4/15 text-foreground py-3 px-2 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-brand-4/5 dark:border-brand-4/10"
                  title="Generar Etiqueta Código de Barras PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Etiqueta</span>
                </button>
                <button
                  onClick={() => openEditModal(producto)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/15 text-blue-500 py-3 px-2 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-500/5"
                  title="Editar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(producto.id)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/15 text-red-500 py-3 px-2 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 border border-red-500/5"
                  title="Eliminar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Agregar/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-4 sm:pt-24 overflow-y-auto">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-3xl rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[70vh] sm:max-h-none">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Columna Izquierda: Detalles Básicos y Código */}
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-1 block">Nombre del Producto *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium"
                      placeholder="Ej. Cuaderno Profesional Scribe"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-foreground mb-1 block">Código de Barras</label>
                    <input 
                      type="text" 
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})}
                      className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-mono"
                      placeholder="Escanea o escribe el código"
                    />
                    
                    {/* Vista Previa del Código de Barras si hay código */}
                    {formData.codigo_barras && (
                      <div className="mt-4 p-4 bg-brand-4/5 dark:bg-background/50 border-none rounded-2xl shadow-inner flex flex-col items-center justify-center gap-3 overflow-hidden">
                        <div className="bg-white p-3 rounded-xl shadow-sm w-full flex items-center justify-center">
                          <canvas id="barcode-preview" className="h-16 w-auto max-w-full"></canvas>
                        </div>
                        <div className="flex flex-col items-center w-full">
                          <button 
                            type="button"
                            onClick={downloadBarcodeCreation}
                            className="w-full justify-center text-sm font-bold bg-white dark:bg-card text-brand-5 hover:text-brand-4 py-2 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar PDF (50x50mm)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Finanzas y Stock */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-foreground mb-1 block">Precio Costo *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-4 font-bold">$</span>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          min="0"
                          value={formData.precio_costo}
                          onChange={(e) => setFormData({...formData, precio_costo: e.target.value})}
                          className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-foreground mb-1 block">Ganancia *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-4 font-bold">$</span>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          min="0"
                          value={formData.ganancia}
                          onChange={(e) => setFormData({...formData, ganancia: e.target.value})}
                          className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-1 block">Venta (Total)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-5 font-bold">$</span>
                      <input 
                        disabled
                        type="text" 
                        value={((parseFloat(formData.precio_costo) || 0) + (parseFloat(formData.ganancia) || 0)).toFixed(2)}
                        className="w-full bg-brand-5/10 border border-brand-5/20 text-brand-5 rounded-2xl py-4 pl-8 pr-4 text-xl font-black opacity-90 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-1 block">Inventario (Stock) *</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>

              </div>

              <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)] mt-auto border-t border-brand-4/5 dark:border-brand-4/10">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-brand-5 hover:bg-brand-4 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-5/20 transition-all text-lg flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isEditing ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
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
