"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabase/client";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

// ─── SpotlightCard Constants ─────────────────────────────────────────────────

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

// ─── KPI SpotlightCard ──────────────────────────────────────────────────────

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
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 border-black/[0.06] bg-card dark:border-white/[0.06] dark:bg-card/40 transition-[border-color] duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.14] cursor-default"
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
          <h3 className="text-[30px] font-black tracking-tight leading-none text-foreground">
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

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ingresosHoy: 0,
    transaccionesHoy: 0,
    totalProductos: 0,
    bajoStockCount: 0,
  });
  const [productosBajos, setProductosBajos] = useState<any[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
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

      const { data: sales, error: salesError } = await supabase
        .from("ventas")
        .select("*");

      let ingresos = 0;
      let transacciones = 0;

      if (!salesError && sales) {
        const todayStr = new Date().toLocaleDateString("en-CA");
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

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    const dateStr = new Date().toLocaleDateString("es-MX", options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // KPI definitions con colores de la paleta del sitio
  const kpiCards = [
    {
      id: "ventas",
      color: "#006199",
      label: "Vendido Hoy",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      value: `$${stats.ingresosHoy.toFixed(2)}`,
      subtitle: "Corte de caja en tiempo real",
    },
    {
      id: "tickets",
      color: "#00a2f9",
      label: "Tickets",
      icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
      value: stats.transaccionesHoy,
      subtitle: "Clientes atendidos hoy",
    },
    {
      id: "catalogo",
      color: "#00dfb2",
      label: "Catálogo",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      value: stats.totalProductos,
      subtitle: "Productos en almacén",
    },
    {
      id: "alertas",
      color: stats.bajoStockCount > 0 ? "#ef4444" : "#00dfb2",
      label: "Alertas",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      value: stats.bajoStockCount,
      subtitle: "Stock bajo (≤5 uds)",
    },
  ];

  return (
    <section className="space-y-7">

      {/* BANNER DE BIENVENIDA */}
      <div className="relative overflow-hidden rounded-3xl border border-black/[0.04] dark:border-white/[0.06] bg-card/80 dark:bg-card/30 backdrop-blur-sm p-7 md:p-10">
        <div className="absolute right-[-8%] top-[-25%] h-64 w-64 rounded-full bg-brand-4/8 filter blur-[90px] pointer-events-none"></div>
        <div className="absolute left-[30%] bottom-[-35%] h-52 w-52 rounded-full bg-brand-5/8 filter blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2.5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-brand-5/90 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-5 animate-pulse"></span>
              Panel de Control
            </p>
            <h1 className="text-2xl md:text-4xl font-black tracking-[-0.02em] text-foreground leading-[1.15]">
              Resumen del día
            </h1>
            <p className="text-[13px] text-foreground/55 max-w-lg leading-relaxed font-medium">
              Monitorea ventas, inventario y alertas de tu Ciber-Papelería en tiempo real.
            </p>
          </div>
          <div className="bg-brand-3/8 dark:bg-brand-3/12 border border-brand-3/15 text-brand-4 font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2.5 text-[13px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {getFormattedDate()}
          </div>
        </div>
      </div>

      {/* KPI SPOTLIGHT CARDS — 3D Tilt + Glow + Shimmer + Dim Siblings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: "1200px" }}>
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.id}
            color={kpi.color}
            label={kpi.label}
            icon={kpi.icon}
            value={kpi.value}
            subtitle={kpi.subtitle}
            loading={loading}
            dimmed={hoveredCard !== null && hoveredCard !== kpi.id}
            onHoverStart={() => setHoveredCard(kpi.id)}
            onHoverEnd={() => setHoveredCard(null)}
          />
        ))}
      </div>

      {/* PRODUCTOS A RESURTIR — Ancho completo */}
      <div className="bg-card/80 dark:bg-card/30 backdrop-blur-sm rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
        <div className="flex justify-between items-center p-6 pb-0">
          <div>
            <h2 className="text-lg font-black tracking-[-0.01em] text-foreground">Productos a Resurtir</h2>
            <p className="text-[12px] text-foreground/45 mt-0.5 font-medium">Control preventivo de desabasto</p>
          </div>
          {productosBajos.length > 0 && (
            <span className="bg-red-500/10 text-red-500 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
              Crítico
            </span>
          )}
        </div>

        <div className="p-6 pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-foreground/[0.03] animate-pulse rounded-xl w-full"></div>
              ))}
            </div>
          ) : productosBajos.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-brand-5/10 rounded-2xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-brand-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-black text-foreground text-base tracking-[-0.01em]">¡Todo en orden!</h4>
              <p className="text-[13px] text-foreground/45 mt-1.5 max-w-xs leading-relaxed font-medium">
                No hay productos con stock crítico. Excelente gestión de inventario.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {productosBajos.map((prod) => {
                const stockPct = Math.min((prod.stock / 5) * 100, 100);
                const isAgotado = prod.stock === 0;

                return (
                  <div key={prod.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${isAgotado ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'}`}>
                        {prod.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[13px] text-foreground leading-snug truncate group-hover:text-brand-5 transition-colors">{prod.nombre}</h4>
                        <span className="text-[11px] font-mono text-foreground/40">{prod.codigo_barras || "Sin código"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 w-full bg-foreground/[0.06] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAgotado ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${stockPct}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg ${isAgotado ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'}`}>
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
          <div className="px-6 pb-5">
            <Link 
              href="/dashboard/inventario" 
              className="w-full inline-flex items-center justify-center gap-2 text-brand-5 hover:text-brand-4 font-bold text-[13px] transition-colors py-2.5 border-t border-black/[0.04] dark:border-white/[0.06] pt-4"
            >
              <span>Ir al inventario completo</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>

    </section>
  );
}
