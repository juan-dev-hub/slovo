import Link from 'next/link'

export const metadata = { title: 'Términos de Servicio — SLOVO AI' }

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Volver
        </Link>

        <h1 className="text-3xl font-black mt-8 mb-2">Términos de Servicio</h1>
        <p className="text-white/40 text-sm mb-10">Última actualización: abril 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Aceptación de los términos</h2>
            <p>Al acceder y usar SLOVO AI ("el Servicio"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, no debes usar el Servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Descripción del servicio</h2>
            <p>SLOVO AI es una plataforma de generación de scripts de ventas mediante inteligencia artificial. Los usuarios compran créditos para generar scripts personalizados según su producto, nicho y audiencia objetivo.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Créditos y pagos</h2>
            <p>Los créditos se adquieren mediante pago y se acreditan inmediatamente en tu cuenta. Cada script generado consume un crédito. Los créditos no tienen fecha de expiración y no son reembolsables salvo lo indicado en nuestra Política de Reembolso.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Uso aceptable</h2>
            <p>Te comprometes a usar SLOVO AI únicamente para propósitos legales y legítimos de ventas y marketing. Está prohibido usar el Servicio para generar contenido engañoso, fraudulento o que viole derechos de terceros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Propiedad intelectual</h2>
            <p>Los scripts generados son de tu propiedad para uso comercial. SLOVO AI se reserva todos los derechos sobre la plataforma, algoritmos y tecnología subyacente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Limitación de responsabilidad</h2>
            <p>SLOVO AI no garantiza resultados específicos de ventas derivados del uso de los scripts generados. El Servicio se provee "tal cual" sin garantías expresas o implícitas de éxito comercial.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor al publicarse en esta página. El uso continuado del Servicio implica aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos, contáctanos en <span className="text-white">juandevsv503@gmail.com</span>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
