/**
 * Cliente único de Supabase (Backend / BD: PostgreSQL + RLS).
 *
 * Las credenciales se leen de las variables de entorno con prefijo VITE_
 * (CLAUDE.md, regla 3: nunca hardcodear claves). Si faltan —por ejemplo en
 * un clon recién descargado sin .env— el cliente queda a `null` y la
 * aplicación sigue funcionando con los mocks: la persistencia es una
 * mejora, no un requisito para ver el Dashboard.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** ¿Hay credenciales para hablar con Supabase? */
export const haySupabase = Boolean(url && anonKey)

if (!haySupabase) {
  console.warn(
    '[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'La persistencia queda desactivada; el Dashboard sigue con datos locales.',
  )
}

/**
 * Instancia compartida del cliente, o `null` si no hay credenciales.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = haySupabase ? createClient(url, anonKey) : null
