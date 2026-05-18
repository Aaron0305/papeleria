"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";

export default function InventarioPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="flex justify-between items-center bg-card border border-card-border p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventario</h2>
          <p className="text-brand-4 text-sm mt-1">Gestiona todos los productos de tu papelería</p>
        </div>
        <button className="bg-brand-5 hover:bg-brand-4 text-background font-bold py-2 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-card-border text-brand-4 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Nombre del Producto</th>
                <th className="p-4 font-semibold">Precio Venta</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-4">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando inventario...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-4">
                    <div className="bg-background inline-flex p-4 rounded-full mb-3 border border-card-border">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-3 dark:text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p>No tienes ningún producto registrado todavía.</p>
                    <p className="text-sm mt-1">Haz clic en "Nuevo Producto" para empezar.</p>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-background/30 transition-colors text-foreground">
                    <td className="p-4 text-sm font-mono text-brand-4">{producto.codigo_barras || '---'}</td>
                    <td className="p-4 font-medium">{producto.nombre}</td>
                    <td className="p-4 text-emerald-500 dark:text-emerald-400 font-semibold">${producto.precio_venta}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        producto.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : 
                        producto.stock > 0 ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {producto.stock} en tienda
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-brand-4 hover:text-brand-5 transition-colors p-2">
                        Editar
                      </button>
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
