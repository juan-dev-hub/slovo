import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(255) PRIMARY KEY,
      creditos INTEGER DEFAULT 1,
      referido_por VARCHAR(255),
      link_referido_activo BOOLEAN DEFAULT FALSE,
      fecha_registro TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS scripts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
      producto TEXT NOT NULL,
      nicho TEXT NOT NULL,
      problema TEXT NOT NULL,
      resultado TEXT NOT NULL,
      precio TEXT NOT NULL,
      canal TEXT NOT NULL,
      objecion TEXT NOT NULL,
      script_completo TEXT,
      desbloqueado BOOLEAN DEFAULT FALSE,
      fecha_creacion TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pagos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
      wompi_id_transaccion VARCHAR(255) UNIQUE,
      creditos_comprados INTEGER NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha TIMESTAMP DEFAULT NOW()
    )
  `
}

const ALLOWED_REFERIDO_CHARS = /^[a-zA-Z0-9_-]+$/

export async function getOrCreateUser(clerkId: string, referidoPor?: string) {
  // Validate referidoPor is a real user to prevent orphaned references
  let validatedRef: string | null = null
  if (referidoPor && ALLOWED_REFERIDO_CHARS.test(referidoPor) && referidoPor !== clerkId) {
    const refUser = await sql`SELECT id FROM usuarios WHERE id = ${referidoPor}`
    validatedRef = refUser.length > 0 ? referidoPor : null
  }

  const newUser = await sql`
    INSERT INTO usuarios (id, creditos, referido_por, link_referido_activo, fecha_registro)
    VALUES (${clerkId}, 1, ${validatedRef}, FALSE, NOW())
    ON CONFLICT (id) DO NOTHING
    RETURNING *
  `
  if (newUser.length > 0) return newUser[0]

  const existing = await sql`SELECT * FROM usuarios WHERE id = ${clerkId}`
  return existing[0]
}

export async function getUser(clerkId: string) {
  const result = await sql`SELECT * FROM usuarios WHERE id = ${clerkId}`
  return result[0] || null
}

export async function getCredits(clerkId: string): Promise<number> {
  const result = await sql`SELECT creditos FROM usuarios WHERE id = ${clerkId}`
  return result[0]?.creditos ?? 0
}

// Atomic check-and-deduct: returns true if a credit was successfully deducted
export async function atomicDeductCredit(clerkId: string): Promise<boolean> {
  const result = await sql`
    UPDATE usuarios
    SET creditos = creditos - 1
    WHERE id = ${clerkId} AND creditos > 0
    RETURNING creditos
  `
  return result.length > 0
}

export async function addCredits(clerkId: string, amount: number) {
  await sql`UPDATE usuarios SET creditos = creditos + ${amount} WHERE id = ${clerkId}`
}

export async function activateReferralLink(clerkId: string) {
  await sql`UPDATE usuarios SET link_referido_activo = TRUE WHERE id = ${clerkId}`
}

export async function hasReferralLinkActive(clerkId: string): Promise<boolean> {
  const result = await sql`SELECT link_referido_activo FROM usuarios WHERE id = ${clerkId}`
  return result[0]?.link_referido_activo ?? false
}

export async function saveScript(data: {
  usuarioId: string
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  objecion: string
  scriptCompleto?: string
  desbloqueado?: boolean
}) {
  const result = await sql`
    INSERT INTO scripts (usuario_id, producto, nicho, problema, resultado, precio, canal, objecion, script_completo, desbloqueado)
    VALUES (
      ${data.usuarioId}, ${data.producto}, ${data.nicho}, ${data.problema},
      ${data.resultado}, ${data.precio}, ${data.canal}, ${data.objecion},
      ${data.scriptCompleto || null}, ${data.desbloqueado ?? false}
    )
    RETURNING *
  `
  return result[0]
}

export async function unlockScript(scriptId: string, usuarioId: string) {
  const result = await sql`
    UPDATE scripts
    SET desbloqueado = TRUE
    WHERE id = ${scriptId} AND usuario_id = ${usuarioId}
    RETURNING *
  `
  return result[0]
}

export async function getScriptById(scriptId: string, usuarioId: string) {
  const result = await sql`
    SELECT * FROM scripts WHERE id = ${scriptId} AND usuario_id = ${usuarioId}
  `
  return result[0] || null
}

export async function getUserScripts(usuarioId: string) {
  return sql`
    SELECT * FROM scripts WHERE usuario_id = ${usuarioId}
    ORDER BY fecha_creacion DESC
  `
}

export async function savePago(data: {
  usuarioId: string
  wompiIdTransaccion: string
  creditosComprados: number
  monto: number
}) {
  await sql`
    INSERT INTO pagos (usuario_id, wompi_id_transaccion, creditos_comprados, monto)
    VALUES (${data.usuarioId}, ${data.wompiIdTransaccion}, ${data.creditosComprados}, ${data.monto})
    ON CONFLICT (wompi_id_transaccion) DO NOTHING
  `
}

export async function pagoYaProcesado(wompiId: string): Promise<boolean> {
  const result = await sql`SELECT id FROM pagos WHERE wompi_id_transaccion = ${wompiId}`
  return result.length > 0
}

export async function getReferralStats(clerkId: string) {
  const referidos = await sql`
    SELECT COUNT(*) as total FROM usuarios WHERE referido_por = ${clerkId}
  `
  const creditsEarned = await sql`
    SELECT COALESCE(SUM(p.creditos_comprados), 0) as total
    FROM pagos p
    INNER JOIN usuarios u ON p.usuario_id = u.id
    WHERE u.referido_por = ${clerkId}
  `
  return {
    totalReferidos: Number(referidos[0]?.total ?? 0),
    creditosGanados: Math.ceil(Number(creditsEarned[0]?.total ?? 0) * 0.2),
  }
}

export async function isFirstPurchase(clerkId: string): Promise<boolean> {
  const result = await sql`SELECT COUNT(*) as total FROM pagos WHERE usuario_id = ${clerkId}`
  return Number(result[0]?.total ?? 0) === 0
}

// ── Notifications ──────────────────────────────────────────────
async function ensureNotificationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
      mensaje TEXT NOT NULL,
      leida BOOLEAN DEFAULT FALSE,
      fecha TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function pushNotification(userId: string, mensaje: string) {
  await ensureNotificationsTable()
  await sql`INSERT INTO notificaciones (usuario_id, mensaje) VALUES (${userId}, ${mensaje})`
}

export async function getPendingNotifications(userId: string) {
  await ensureNotificationsTable()
  return sql`
    SELECT id, mensaje, fecha FROM notificaciones
    WHERE usuario_id = ${userId} AND leida = FALSE
    ORDER BY fecha DESC
  `
}

export async function markNotificationsRead(userId: string) {
  await ensureNotificationsTable()
  await sql`UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ${userId} AND leida = FALSE`
}

export { sql }
