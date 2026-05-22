"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase/client";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    email: "",
    password: "",
    rol: "admin"
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const openNewModal = () => {
    setFormData({ id: "", nombre: "", email: "", password: "", rol: "admin" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (usuario: any) => {
    setFormData({
      id: usuario.id,
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      password: "",
      rol: usuario.rol || "admin"
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario? No podrá volver a iniciar sesión.")) {
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (!error) {
        fetchUsuarios();
      } else {
        alert("Error al eliminar el usuario");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const payload: any = {
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    if (isEditing) {
      const { error } = await supabase
        .from("usuarios")
        .update(payload)
        .eq("id", formData.id);
        
      if (!error) {
        setModalOpen(false);
        fetchUsuarios();
      } else {
        alert("Error al actualizar: " + (error.message || "Error desconocido"));
      }
    } else {
      if (!formData.password) {
        alert("La contraseña es obligatoria para nuevos usuarios.");
        setSaving(false);
        return;
      }
      payload.password = formData.password;
      const { error } = await supabase
        .from("usuarios")
        .insert([payload]);
        
      if (!error) {
        setModalOpen(false);
        fetchUsuarios();
      } else {
        alert("Error al registrar. Verifica si el correo ya existe.");
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card border-none p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h2>
          <p className="text-brand-4 text-sm mt-1">Registra y administra los accesos al sistema</p>
        </div>
        
        <button 
          onClick={openNewModal}
          className="bg-brand-5 hover:bg-brand-4 text-background font-bold py-3 px-6 rounded-2xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Registrar Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-card border-none rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-4/5 dark:bg-brand-4/10 text-brand-4 text-sm uppercase tracking-wider">
                <th className="p-5 font-semibold">Usuario</th>
                <th className="p-5 font-semibold">Correo</th>
                <th className="p-5 font-semibold">Rol</th>
                <th className="p-5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-4/5 dark:divide-brand-4/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-brand-4">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-brand-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-brand-4">
                    <p className="text-lg font-medium text-foreground">No hay usuarios registrados</p>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-brand-4/5 dark:hover:bg-brand-4/10 transition-colors text-foreground group">
                    <td className="p-5 font-bold flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-4/10 rounded-xl flex items-center justify-center text-brand-5 font-bold">
                        {usuario.nombre?.charAt(0).toUpperCase() || usuario.email?.charAt(0).toUpperCase()}
                      </div>
                      {usuario.nombre || 'Sin nombre'}
                    </td>
                    <td className="p-5 text-brand-4">{usuario.email}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        usuario.rol === 'admin' ? 'bg-brand-5/10 text-brand-5' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {usuario.rol || 'admin'}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(usuario)}
                        className="text-black dark:text-brand-5 hover:bg-brand-4/10 dark:hover:bg-brand-5/10 p-2 rounded-xl transition-colors inline-flex"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(usuario.id)}
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

      {/* Modal Agregar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-card border-none w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-brand-4/5 dark:bg-brand-4/10 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {isEditing ? "Editar Usuario" : "Registrar Usuario"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-brand-4 hover:bg-red-500 hover:text-white rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-foreground mb-1 block">Nombre Completo *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-1 block">Correo Electrónico *</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-1 block">
                    Contraseña {isEditing ? "(Dejar en blanco para no cambiar)" : "*"}
                  </label>
                  <input 
                    required={!isEditing}
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-medium"
                    placeholder={isEditing ? "Nueva contraseña (opcional)" : "••••••••"}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-1 block">Rol del Sistema</label>
                  <select 
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full bg-brand-4/5 dark:bg-brand-4/10 border-none text-foreground rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-5 transition-all font-bold cursor-pointer"
                  >
                    <option value="admin">Administrador</option>
                    <option value="cajero">Cajero / Ventas</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-card z-10 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgb(0,0,0,0.1)]">
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
                  {isEditing ? "Guardar Cambios" : "Registrar Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
