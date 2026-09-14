import { Home, BarChart3, Target, Wallet, Settings, X } from 'lucide-react'
import { TABS } from './TabNav.jsx'

/** Icono de cada pestaña, en el mismo orden del menú. */
const ICONO_POR_PESTANA = {
  inicio: Home,
  analisis: BarChart3,
  estrategia: Target,
  viabilidad: Wallet,
  configuracion: Settings,
}

/**
 * Barra lateral de navegación (patrón SaaS analítico).
 *
 * En escritorio es una columna fija de 256 px; por debajo de `lg` se
 * comporta como cajón deslizante que abre el botón de hamburguesa de la
 * barra superior. El mismo componente sirve para los dos casos: cambia el
 * posicionamiento, no el contenido, así que no hay dos menús que mantener
 * sincronizados.
 *
 * Va marcada con `no-imprimir`: el Informe Ejecutivo en PDF no debe llevar
 * la navegación de la aplicación.
 *
 * @param {{
 *   activeTab: string,
 *   onTabChange: (id: string) => void,
 *   abiertoEnMovil: boolean,
 *   onCerrar: () => void,
 * }} props
 */
export default function Sidebar({ activeTab, onTabChange, abiertoEnMovil, onCerrar }) {
  const elegir = (id) => {
    onTabChange(id)
    onCerrar()
  }

  return (
    <>
      {/* Velo oscuro del cajón en móvil. Cierra al tocarlo. */}
      {abiertoEnMovil && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'no-imprimir fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-primary text-white transition-transform duration-200',
          // En escritorio siempre visible; en móvil, fuera de pantalla
          // hasta que se abre el cajón.
          abiertoEnMovil ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        aria-label="Navegación principal del dashboard"
      >
        {/* Logotipo + cierre del cajón en móvil */}
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <button
            type="button"
            onClick={() => elegir('inicio')}
            aria-label="Pyme Launch — ir a Inicio"
            className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <img src="/logo-pymelaunch.png" alt="Pyme Launch" className="h-7 w-auto object-contain" />
          </button>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-5 pb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
          Panel de control
        </p>

        {/* Las 5 pestañas del Dashboard */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {TABS.map((tab) => {
              const Icono = ICONO_POR_PESTANA[tab.id] ?? Home
              const activa = tab.id === activeTab
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => elegir(tab.id)}
                    aria-current={activa ? 'page' : undefined}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                      activa ? 'bg-white text-primary shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                  >
                    <Icono className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <p className="border-t border-white/10 px-5 py-4 text-[10px] leading-relaxed text-white/50">
          Prediagnóstico asistido por IA. No constituye certificación de viabilidad.
        </p>
      </aside>
    </>
  )
}
