import { Menu, FlaskConical, LogOut } from 'lucide-react'
import BotonNuevoDiagnostico from './BotonNuevoDiagnostico.jsx'
import { calcularEstadoGlobal } from '../../utils/estadoGlobal.js'
import { derivarResumenGlobal } from '../../utils/resumenDiagnostico.js'
import { usePlan } from '../../context/PlanContext.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { PLANES, PLAN_INFO } from '../../utils/planes.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useModoLectura } from '../../context/ModoLecturaContext.jsx'
import { cerrarSesion } from '../../services/authService.js'

/**
 * Barra superior del área de contenido.
 *
 * Recoge lo que antes vivía en la cabecera verde y que no es navegación:
 * el distintivo de fase, la bienvenida, el selector de plan de pruebas y
 * el botón de nuevo diagnóstico. La navegación se ha ido a la barra
 * lateral, así que aquí solo queda el botón de hamburguesa que la abre en
 * pantallas pequeñas.
 *
 * El distintivo cita el mismo score y la misma fase que el Resumen
 * General, para que el usuario no vea dos cifras distintas.
 *
 * @param {{ nombreUsuario: string, onAbrirMenu: () => void }} props
 */
export default function TopBar({ nombreUsuario, onAbrirMenu }) {
  const { plan, setPlan, planContratado, simulando, puedeSimular } = usePlan()
  const { respuestas, reiniciarOnboarding } = useOnboarding()
  const { authDisponible } = useAuth()
  const { soloLectura } = useModoLectura()

  const resumen = derivarResumenGlobal(respuestas)
  const estadoGlobal = calcularEstadoGlobal(resumen?.score ?? 0)

  return (
    <header className="no-imprimir sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Izquierda: hamburguesa (solo móvil) + estado del proyecto */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenu}
            aria-label="Abrir menú de navegación"
            className="rounded-lg p-2 text-[#4B5563] transition-colors hover:bg-gray-100 hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span
            className="flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-[#1F2937]"
            title={`${estadoGlobal.porcentaje}% de avance del recorrido`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: estadoGlobal.colorSemaforo }}
            />
            <span className="truncate">
              {resumen?.fase ?? 'Sin diagnóstico'} · {estadoGlobal.calificativo}
            </span>
          </span>
        </div>

        {/* Derecha: perfil, plan de pruebas y nuevo diagnóstico */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="hidden text-sm text-[#4B5563] sm:block">
            Bienvenido, <span className="font-semibold text-[#1F2937]">{nombreUsuario}</span>
          </p>

          {/* En Modo Consultor se ocultan las acciones de cliente: el
              selector de plan, el reinicio del diagnóstico y el cierre de
              sesión. El mentor no tiene cuenta ni debe poder alterar el
              expediente que está revisando.

              El selector, además, solo existe en modo demo: simula planes en
              local para probar los bloqueos, sin tocar
              profiles.plan_contratado. Un punto marca el plan contratado. */}
          {!soloLectura && puedeSimular && (
            <div
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
              title={
                simulando
                  ? 'Modo prueba: estás simulando un plan distinto del contratado'
                  : 'Selector de pruebas — simula otro plan sin cambiar el contratado'
              }
            >
              <FlaskConical
                className={`ml-1.5 h-3.5 w-3.5 shrink-0 ${simulando ? 'text-amber-600' : 'text-[#4B5563]'}`}
              />
              {PLANES.map((p) => {
                const contratado = p === planContratado
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    aria-pressed={plan === p}
                    title={contratado ? `${PLAN_INFO[p].nombre} · plan contratado` : `Simular ${PLAN_INFO[p].nombre}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      plan === p ? 'bg-primary text-white' : 'text-[#4B5563] hover:text-[#1F2937]'
                    }`}
                  >
                    {PLAN_INFO[p].nombre}
                    {contratado && (
                      <>
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${plan === p ? 'bg-white' : 'bg-primary'}`}
                        />
                        <span className="sr-only">(contratado)</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {!soloLectura && <BotonNuevoDiagnostico onConfirmar={reiniciarOnboarding} />}

          {/* El cierre de sesión solo aparece si hay autenticación: en una
              instalación sin credenciales no habría nada que cerrar. */}
          {authDisponible && !soloLectura && (
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] transition-colors hover:bg-gray-100 hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <LogOut className="h-3 w-3 shrink-0" />
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
