import { useState } from 'react'
import { FileText, FileSpreadsheet, KeyRound } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { derivarResumenGlobal } from '../../utils/resumenDiagnostico.js'

/**
 * Cuadrante "Consola de Exportación & Seguridad".
 *
 * El Informe Ejecutivo sí se genera de verdad: abre el diálogo de
 * impresión del navegador sobre `InformeEjecutivo`, que se monta oculto en
 * App.jsx. Se eligió la impresión nativa en vez de una librería de captura
 * (html2pdf / html2canvas + jsPDF) por tres motivos: el PDF sale con texto
 * vectorial —seleccionable y buscable, no una imagen—, la fidelidad de
 * estilos es exacta porque lo compone el propio motor del navegador, y no
 * añade ~600 kB a un bundle que ya supera el umbral de aviso de Vite.
 *
 * La exportación a Excel sigue siendo una simulación, y se etiqueta como
 * tal para no prometer un fichero que todavía no existe.
 */
export default function ConsolaExportacionCard() {
  const { respuestas } = useOnboarding()
  const [estado, setEstado] = useState(null) // 'excel' | 'auth' | null

  // Sin diagnóstico no hay informe: el botón queda deshabilitado en lugar
  // de abrir un diálogo de impresión con una hoja en blanco.
  const hayDiagnostico = derivarResumenGlobal(respuestas) !== null

  const simular = (clave) => {
    setEstado(clave)
    setTimeout(() => setEstado(null), 1800)
  }

  /**
   * Abre el diálogo de impresión. Las reglas `@media print` de index.css
   * ocultan la aplicación y dejan solo el Informe Ejecutivo, así que el
   * usuario elige "Guardar como PDF" en el destino del diálogo.
   */
  const descargarInforme = () => {
    if (!hayDiagnostico) return
    window.print()
  }

  return (
    <Card>
      <CardTitle>Consola de Exportación &amp; Seguridad</CardTitle>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={descargarInforme}
          disabled={!hayDiagnostico}
          title={
            hayDiagnostico
              ? 'Abre el diálogo de impresión: elige "Guardar como PDF" como destino'
              : 'Completa el diagnóstico para generar tu informe'
          }
          className="flex items-center gap-3 rounded-lg border border-card-border bg-canvas p-4 text-left transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-canvas"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1F2937]">Descargar Informe Ejecutivo</p>
            <p className="text-xs text-[#4B5563]">
              {hayDiagnostico ? 'PDF · guardar desde el diálogo de impresión' : 'Requiere diagnóstico completado'}
            </p>
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
            <p className="text-sm font-bold text-[#1F2937]">Exportar Modelo Económico</p>
            <p className="text-xs text-[#4B5563]">Excel · pendiente de implementar</p>
          </div>
        </button>
      </div>

      {hayDiagnostico && (
        <p className="mt-3 text-xs leading-snug text-[#4B5563]">
          El informe recoge tu score y fase, las cuatro dimensiones, el margen de tesorería y las
          acciones críticas de los primeros 30 días. En el diálogo que se abre, selecciona
          <span className="font-semibold text-[#1F2937]"> Guardar como PDF</span> en el destino.
        </p>
      )}

      {estado === 'excel' && (
        <p className="mt-3 text-xs font-medium text-accent-amber">
          La exportación del modelo económico a Excel aún no está implementada.
        </p>
      )}

      {/* Seguridad */}
      <div className="mt-5 border-t border-card-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">Seguridad</p>
        <button
          type="button"
          onClick={() => simular('auth')}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-canvas px-4 py-2.5 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-gray-200 sm:w-auto"
        >
          <KeyRound className="h-4 w-4" />
          Cambiar Contraseña / Gestionar Sesión (Supabase Auth)
        </button>
        {estado === 'auth' && (
          <p className="mt-2 text-xs font-medium text-[#4B5563]">
            La gestión de sesión se habilitará al conectar Supabase Auth (Fase 5).
          </p>
        )}
      </div>
    </Card>
  )
}
