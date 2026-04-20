import Link from 'next/link'

export const metadata = { title: 'Política de Reembolso — SLOVO AI' }

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Volver
        </Link>

        <h1 className="text-3xl font-black mt-8 mb-2">Política de Reembolso</h1>
        <p className="text-white/40 text-sm mb-10">Última actualización: abril 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Política general</h2>
            <p>En SLOVO AI nos comprometemos con la satisfacción de nuestros usuarios. Si no estás satisfecho con el Servicio, puedes solicitar un reembolso dentro de los primeros 7 días desde tu compra, siempre que no hayas consumido más del 20% de los créditos adquiridos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Créditos no consumidos</h2>
            <p>Si compraste un paquete de créditos y no has usado ninguno, puedes solicitar un reembolso completo dentro de los 7 días posteriores a la compra contactándonos directamente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Créditos parcialmente consumidos</h2>
            <p>Si has consumido parte de tus créditos, el reembolso será proporcional a los créditos no utilizados, descontando una tarifa de procesamiento del 10%.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Casos no elegibles</h2>
            <p>No se otorgan reembolsos cuando han transcurrido más de 7 días desde la compra, cuando se ha consumido más del 20% de los créditos, o cuando se detecta uso indebido del Servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Proceso de reembolso</h2>
            <p>Para solicitar un reembolso, envía un correo a <span className="text-white">juandevsv503@gmail.com</span> con el asunto "Solicitud de reembolso" incluyendo tu correo de cuenta y el número de transacción. Procesamos las solicitudes en un plazo de 3-5 días hábiles.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Problemas técnicos</h2>
            <p>Si experimentaste un problema técnico que consumió créditos sin generar un script correctamente, repondremos los créditos afectados sin costo adicional. Contáctanos con los detalles del incidente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Contacto</h2>
            <p>Para cualquier consulta sobre reembolsos, escríbenos a <span className="text-white">juandevsv503@gmail.com</span>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
