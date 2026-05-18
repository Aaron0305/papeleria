export default function POSPage() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-4">Punto de Venta (Caja)</h2>
      <p className="text-brand-4">
        Esta será la pantalla principal donde escanearás o buscarás los productos para cobrarlos al cliente.
        <br/><br/>
        (Primero necesitamos agregar productos en el Inventario para que aparezcan aquí).
      </p>
    </div>
  );
}
