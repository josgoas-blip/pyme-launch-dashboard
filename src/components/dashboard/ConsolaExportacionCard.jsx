import { useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { derivarResumenGlobal } from '../../utils/resumenDiagnostico.js'
import {
  construirCsvModeloEconomico,
  descargarCsv,
  MESES_PROYECCION,
  NOMBRE_FICHERO_CSV,
} from '../../utils/exportarCsv.js'

/**
 * Cuadrante "Consola de Exportación".
 *
 * Las dos exportaciones son reales:
 *   - Informe Ejecutivo en PDF: abre el diálogo de impresión sobre
 *     `InformeEjecutivo`, que se monta oculto en App.jsx. Se eligió la
 *     impresión nativa frente a una librería de captura para que el PDF
 *     lleve texto vectorial y no sume ~600 kB al bundle.
 *   - Modelo económico en CSV: se construye en el cliente con las
 *     variables financieras declaradas y la proyección de caja, y se
 *     descarga como Blob. Sin dependencias.
 *
 * Se ha retirado el botón "Cambiar Contraseña / Gestionar Sesión": la
 * aplicación opera de forma anónima y no tiene flujo de autenticación, así
 * que ofrecer gestión de sesión prometía algo que no existe.
 */
export default function ConsolaExportacionCard() {
  const { respuestas } = useOnboarding()
  const [avisoCsv, setAvisoCsv] = useState(null)

  // Sin diagnóstico no hay nada que exportar: los botones quedan
  // deshabilitados en lugar de generar ficheros vacíos.
  const hayDiagnostico = derivarResumenGlobal(respuestas) !== null
  const csv = hayDiagnostico ? construirCsvModeloEconomico(respuestas) : null

  /**
   * Abre el diálogo de impresión. Las reglas `@media print` de index.css
   * ocultan la aplicación y dejan solo el Informe Ejecutivo, así que el
   * usuario elige "Guardar como PDF" en el destino del diálogo.
   */
  const descargarInforme = () => {
    if (!hayDiagnostico) return
    window.print()
  }

  /** Genera y descarga el CSV del modelo económico. */
  const descargarModelo = () => {
    if (!csv) return

    const ok = descargarCsv(NOMBRE_FICHERO_CSV, csv)
    setAvisoCsv(
      ok
        ? `Descargado ${NOMBRE_FICHERO_CSV}`
        : 'No se pudo generar el fichero en este navegador.',
    )
    setTimeout(() => setAvisoCsv(null), 4000)
  }

  return (
    <Card>
      <CardTitle>Consola de Exportación</CardTitle>

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
              {hayDiagnostico
                ? 'PDF · guardar desde el diálogo de impresión'
                : 'Requiere diagnóstico completado'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={descargarModelo}
          disabled={!csv}
          title={
            csv
              ? `Descarga ${NOMBRE_FICHERO_CSV}`
              : 'Declara tu inversión y tus plazos en el diagnóstico para exportar el modelo'
          }
          className="flex items-center gap-3 rounded-lg border border-card-border bg-canvas p-4 text-left transition-colors hover:bg-accent-green/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-canvas"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1F2937]">Exportar Modelo Económico</p>
            <p className="text-xs text-[#4B5563]">
              {csv ? 'CSV · abre en Excel o Google Sheets' : 'Requiere variables financieras'}
            </p>
          </div>
        </button>
      </div>

      {hayDiagnostico && (
        <p className="mt-3 text-xs leading-snug text-[#4B5563]">
          El informe recoge tu score y fase, las cuatro dimensiones, el margen de tesorería y las
          acciones críticas de los primeros 30 días. El CSV añade tus variables financieras
          declaradas y la proyección de saldo de caja del mes 0 al {MESES_PROYECCION} en los tres
          escenarios.
        </p>
      )}

      {avisoCsv && <p className="mt-2 text-xs font-semibold text-accent-green">{avisoCsv}</p>}
    </Card>
  )
}
