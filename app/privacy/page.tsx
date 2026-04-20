import Link from 'next/link'

export const metadata = { title: 'Política de Privacidad — SLOVO AI' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Volver
        </Link>

        <h1 className="text-3xl font-black mt-8 mb-2">Política de Privacidad</h1>
        <p className="text-white/40 text-sm mb-10">Última actualización: abril 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Información que recopilamos</h2>
            <p>Recopilamos información que nos proporcionas al crear tu cuenta (nombre, correo electrónico), datos de uso del Servicio (scripts generados, créditos consumidos) e información de pago procesada de forma segura por PayPal.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Cómo usamos tu información</h2>
            <p>Usamos tu información para proveer y mejorar el Servicio, procesar pagos, enviarte notificaciones relacionadas con tu cuenta y gestionar el programa de referidos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Compartir información</h2>
            <p>No vendemos ni compartimos tu información personal con terceros, excepto con proveedores de servicio necesarios para operar la plataforma (autenticación, pagos, base de datos) bajo estrictos acuerdos de confidencialidad.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Pagos</h2>
            <p>Los pagos son procesados por PayPal. No almacenamos datos de tarjetas de crédito o débito en nuestros servidores. Consulta la política de privacidad de PayPal para más detalles sobre el manejo de tu información de pago.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Seguridad</h2>
            <p>Implementamos medidas de seguridad estándar de la industria para proteger tu información. Sin embargo, ningún método de transmisión por Internet es 100% seguro.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Tus derechos</h2>
            <p>Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. Para ejercer estos derechos, contáctanos en <span className="text-white">juandevsv503@gmail.com</span>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Cookies</h2>
            <p>Usamos cookies esenciales para la autenticación y el funcionamiento del Servicio. No usamos cookies de rastreo publicitario de terceros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Contacto</h2>
            <p>Para consultas sobre privacidad, escríbenos a <span className="text-white">juandevsv503@gmail.com</span>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
