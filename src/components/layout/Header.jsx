import { FlaskConical, RotateCcw } from 'lucide-react'
import TabNav from './TabNav.jsx'
import { calcularEstadoGlobal } from '../../utils/estadoGlobal.js'
import { usePlan } from '../../context/PlanContext.jsx'
import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { PLANES, PLAN_INFO } from '../../utils/planes.js'

/**
 * Header principal del Dashboard (design.md: color primary #1B4D3E).
 * Incluye: logo/nombre + distintivo "PANEL DE CONTROL" + badge dinámico de
 * fase global (calculado desde el progreso del recorrido), bienvenida
 * personalizada, y la barra de navegación de las 5 pestañas.
 *
 * @param {{ nombreUsuario: string, activeTab: string, onTabChange: (id: string) => void }} props
 */
export default function Header({ nombreUsuario, activeTab, onTabChange }) {
  const { plan, setPlan } = usePlan()
  const { datos, reiniciarOnboarding } = useOnboarding()
  const { controlProyecto } = datos.inicio
  const estadoGlobal = calcularEstadoGlobal(controlProyecto.progreso_recorrido)

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Logotipo oficial (enlaza a Inicio) + distintivos de estado */}
          <div className="flex items-center gap-3">
            {/* El logotipo es verde corporativo sobre transparente: necesita
                fondo claro para tener contraste sobre la cabecera verde. */}
            <h1 className="shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('inicio')}
                aria-label="Pyme Launch — ir a Inicio"
                className="inline-flex items-center rounded-lg bg-white px-3 py-1 shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <img
                  src="/logo-pymelaunch.png"
                  alt="Pyme Launch"
                  className="h-8 w-auto object-contain md:h-9"
                />
              </button>
            </h1>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Panel de Control
              </span>
              <span
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90"
                title={`${estadoGlobal.porcentaje}% de avance del recorrido`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: estadoGlobal.colorSemaforo }}
                />
                {controlProyecto.fase_actual} · {estadoGlobal.calificativo}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {/* Bienvenida personalizada */}
            <p className="text-sm text-white/80">
              Bienvenido, <span className="font-semibold text-white">{nombreUsuario}</span>
            </p>

            {/* Selector temporal de pruebas: alterna el plan activo para QA/demo */}
            <div
              className="flex items-center gap-1.5 rounded-full bg-white/10 p-1"
              title="Selector temporal de pruebas — simula el plan contratado"
            >
              <FlaskConical className="ml-1.5 h-3.5 w-3.5 shrink-0 text-white/60" />
              {PLANES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  aria-pressed={plan === p}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    plan === p ? 'bg-white text-primary' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {PLAN_INFO[p].nombre}
                </button>
              ))}
            </div>

            {/* Utilidad temporal de desarrollo: repite el cuestionario sin recargar */}
            <button
              type="button"
              onClick={reiniciarOnboarding}
              title="Herramienta de desarrollo — vuelve al cuestionario de onboarding"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              Reiniciar Onboarding
            </button>
          </div>
        </div>

        {/* Navegación de las 5 pestañas */}
        <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  )
}
