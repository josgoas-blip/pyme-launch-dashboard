import { useState } from 'react'
import { FileText, FileSpreadsheet, KeyRound } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'

/**
 * Cuadrante "Consola de Exportación & Seguridad": acciones ejecutivas para
 * descargar el informe en PDF, exportar el modelo económico a Excel, y
 * gestionar la contraseña / sesión de autenticación.
 *
 * Las acciones son simulaciones locales (sin generación de fichero real ni
 * llamada a Supabase Auth): la integración real se conectará en la Fase 5
 * del plan maestro, cuando existan backend y credenciales reales.
 */
export default function ConsolaExportacionCard() {
  const [estado, setEstado] = useState(null) // 'pdf' | 'excel' | 'auth' | null

  const simular = (clave) => {
    setEstado(clave)
    setTimeout(() => setEstado(null), 1800)
  }

  return (
    <Card>
      <CardTitle>Consola de Exportación &amp; Seguridad</CardTitle>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => simular('pdf')}
          className="flex items-center gap-3 rounded-lg border border-card-border bg-canvas p-4 text-left transition-colors hover:bg-primary/5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-main">Descargar Informe Ejecutivo</p>
            <p className="text-xs text-muted">Formato PDF</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => simular('excel')}
          className="flex items-center gap-3 rounded-lg border border-card-border bg-canvas p-4 text-left transition-colors hover:bg-accent-green/5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-main">Exportar Modelo Económico</p>
            <p className="text-xs text-muted">Formato Excel</p>
          </div>
        </button>
      </div>

      {(estado === 'pdf' || estado === 'excel') && (
        <p className="mt-3 text-xs font-medium text-accent-green">
          {estado === 'pdf' ? 'Informe Ejecutivo' : 'Modelo Económico'} generado — la exportación real se
          activará junto con la integración de Supabase (Fase 5).
        </p>
      )}

      {/* Seguridad */}
      <div className="mt-5 border-t border-card-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Seguridad</p>
        <button
          type="button"
          onClick={() => simular('auth')}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-canvas px-4 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-gray-200 sm:w-auto"
        >
          <KeyRound className="h-4 w-4" />
          Cambiar Contraseña / Gestionar Sesión (Supabase Auth)
        </button>
        {estado === 'auth' && (
          <p className="mt-2 text-xs font-medium text-muted">
            La gestión de sesión se habilitará al conectar Supabase Auth (Fase 5).
          </p>
        )}
      </div>
    </Card>
  )
}
