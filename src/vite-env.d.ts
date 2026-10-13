/// <reference types="vite/client" />

// Variables de entorno del frontend (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_N8N_WEBHOOK_URL?: string
  readonly VITE_N8N_WEBHOOK_SOLICITAR_CITA?: string
  /** Nombre antiguo de VITE_N8N_WEBHOOK_SOLICITAR_CITA. */
  readonly VITE_N8N_WEBHOOK_CITA_URL?: string
  readonly VITE_N8N_WEBHOOK_CANCELACION_URL?: string
  readonly VITE_URL_RESET_PASSWORD?: string
  readonly VITE_MODO_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
