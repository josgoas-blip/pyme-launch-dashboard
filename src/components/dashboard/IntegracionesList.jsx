import { Plug, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { haySupabase } from '../../lib/supabaseClient.js'
import { hayWebhookAgente } from '../../services/agenteService.js'

/**
 * Cuadrante "Integraciones": estado real de las conexiones del sistema.
 *
 * Antes era una lista fija que marcaba n8n y Supabase como "Conectado"
 * pasara lo que pasara, y anunciaba un Stripe del que no existe ni una
 * línea de código. Un panel no puede afirmar que hay una integración viva
 * cuando no la hay: el usuario decidiría sobre un backend inexistente.
 *
 * Ahora cada fila lee la misma señal que usa el código en tiempo de
 * ejecución —`haySupabase` y `hayWebhookAgente`, derivadas de las
 * variables de entorno— y dice si está configurada o no, indicando qué
 * variable falta. Stripe se ha retirado por completo: no está integrado.
 *
 * "Configurado" describe lo que se puede comprobar sin salir a la red: que
 * las credenciales existen. No se afirma que el servicio responda.
 */
const INTEGRACIONES = [
  {
    id: 'supabase',
    nombre: 'Supabase',
    descripcion: 'Backend y base de datos (PostgreSQL + RLS)',
    configurado: haySupabase,
    variable: 'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY',
  },
  {
    id: 'n8n',
    nombre: 'n8n',
    descripcion: 'Orquestador del agente consultor (Webhooks + LLM)',
    configurado: hayWebhookAgente,
    variable: 'VITE_N8N_WEBHOOK_URL',
  },
]

export default function IntegracionesList() {
  return (
    <Card>
      <CardTitle>Integraciones</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">
        Estado de configuración leído de las variables de entorno de esta instalación
      </p>

      <ul className="mt-4 divide-y divide-card-border">
        {INTEGRACIONES.map((integracion) => (
          <li key={integracion.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  integracion.configurado ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-[#4B5563]'
                }`}
              >
                <Plug className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1F2937]">{integracion.nombre}</p>
                <p className="truncate text-xs text-[#4B5563]">{integracion.descripcion}</p>
                {!integracion.configurado && (
                  <p className="mt-0.5 truncate text-xs text-[#4B5563]">
                    Falta definir {integracion.variable}
                  </p>
                )}
              </div>
            </div>

            <Badge
              className={
                integracion.configurado
                  ? 'shrink-0 bg-accent-green/10 text-accent-green'
                  : 'shrink-0 bg-gray-100 text-[#4B5563]'
              }
            >
              {integracion.configurado ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {integracion.configurado ? 'Configurado' : 'No configurado'}
            </Badge>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-card-border pt-3 text-xs leading-snug text-[#4B5563]">
        &quot;Configurado&quot; significa que existen las credenciales en el entorno, no que el
        servicio haya respondido. El Dashboard funciona sin ninguna de las dos: el diagnóstico se
        guarda en este navegador y el consultor responde en local.
      </p>
    </Card>
  )
}
