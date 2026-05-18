import Link from "next/link";

const quickActions = [
	{
		title: "Punto de Venta",
		href: "/dashboard/pos",
		description: "Registrar ventas y gestionar el carrito en caja.",
	},
	{
		title: "Inventario",
		href: "/dashboard/inventario",
		description: "Administrar productos, stock y códigos de barras.",
	},
	{
		title: "Usuarios",
		href: "/dashboard/usuarios",
		description: "Revisar y administrar cuentas del sistema.",
	},
	{
		title: "Reportes",
		href: "/dashboard/reportes",
		description: "Ver métricas y seguimiento de la operación.",
	},
];

export default function DashboardPage() {
	return (
		<section className="space-y-8">
			<div className="rounded-[2rem] border border-black/5 bg-card p-6 md:p-8 shadow-[0_10px_40px_rgba(0,41,70,0.06)] dark:border-white/5">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-4">
					Panel Principal
				</p>
				<div className="mt-4 max-w-3xl space-y-3">
					<h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
						Bienvenido al sistema de Papelería POS
					</h1>
					<p className="text-sm md:text-base text-foreground/70 leading-relaxed">
						Usa este panel para entrar rápido al punto de venta, controlar el inventario y revisar el estado general del negocio.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{quickActions.map((action) => (
					<Link
						key={action.href}
						href={action.href}
						className="group rounded-[1.75rem] border border-black/5 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,41,70,0.08)] dark:border-white/5"
					>
						<p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-4">
							Acceso rápido
						</p>
						<h2 className="mt-3 text-xl font-extrabold text-foreground group-hover:text-brand-3">
							{action.title}
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-foreground/70">
							{action.description}
						</p>
						<span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-4">
							Abrir módulo
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}
