import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { PLANES, PLAN_POR_DEFECTO } from '../utils/planes.js'
import { MODO_DEMO } from '../utils/entorno.js'
import { leerPlanContratado } from '../services/planService.js'
import {
  cargarPlan,
  guardarPlan,
  borrarPlanPrueba,
  cargarPlanContratadoCache,
  guardarPlanContratadoCache,
} from '../utils/persistenciaNavegacion.js'

const PlanContext = createContext(null)

/** Lectura del plan contratado aún no resuelta. */
const SIN_LECTURA = { userId: null, plan: null }

/**
 * Proveedor del plan activo (Gating de las pestañas).
 *
 * Dos modos:
 *
 *   - `desdePerfil` (panel del cliente): la fuente de verdad es
 *     `profiles.plan_contratado` del usuario autenticado. Se lee al iniciar
 *     o recuperar la sesión; sin fila, con `null` o con un valor desconocido
 *     se aplica 'REPORT'.
 *
 *     En modo demo (`VITE_MODO_DEMO`, activo por defecto) el selector de la
 *     barra superior puede simular otro plan para probar los bloqueos. Esa
 *     simulación es solo local: vive en la pestaña del navegador (sobrevive
 *     a un F5), se olvida al cerrar sesión y nunca escribe en la base de
 *     datos. Elegir de nuevo el plan contratado deja de simular.
 *
 *   - Plan fijo (Modo Consultor): `planInicial`, sin consultar nada. El
 *     mentor revisa el expediente con acceso completo.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   planInicial?: 'report'|'assist'|'total',
 *   desdePerfil?: boolean,
 * }} props
 */
export function PlanProvider({ children, planInicial = PLAN_POR_DEFECTO, desdePerfil = false }) {
  const { userId, cargando: cargandoSesion } = useAuth()

  /** Plan leído de `profiles`, con el usuario al que pertenece. */
  const [lectura, setLectura] = useState(SIN_LECTURA)

  /** Plan simulado con el selector de pruebas (solo en modo demo). */
  const [planPrueba, setPlanPrueba] = useState(() =>
    desdePerfil && MODO_DEMO ? cargarPlan(PLANES) : null,
  )

  useEffect(() => {
    if (!desdePerfil || !userId) return undefined

    let vigente = true

    // Tras un F5 se aplica al instante la última lectura de este usuario;
    // la consulta la confirma o la corrige enseguida.
    const enCache = cargarPlanContratadoCache(userId, PLANES)
    if (enCache) setLectura({ userId, plan: enCache })

    leerPlanContratado(userId).then((resultado) => {
      if (!vigente) return
      setLectura({ userId, plan: resultado.plan })
      // Un error no se guarda: la próxima recarga debe volver a intentarlo
      // en lugar de arrastrar el plan de entrada aplicado por precaución.
      if (resultado.estado === 'ok') guardarPlanContratadoCache(userId, resultado.plan)
    })

    return () => {
      vigente = false
    }
  }, [desdePerfil, userId])

  // Al cerrar sesión se olvida la simulación en memoria (App borra la copia
  // de la pestaña): la siguiente cuenta no debe heredarla.
  //
  // Se espera a que termine de recuperarse la sesión: durante esa carga
  // `userId` también es `null`, y sin esta condición cada F5 borraba la
  // simulación en curso como si el usuario hubiera salido.
  useEffect(() => {
    if (desdePerfil && !cargandoSesion && !userId) setPlanPrueba(null)
  }, [desdePerfil, cargandoSesion, userId])

  const planContratado = desdePerfil
    ? lectura.userId === userId && lectura.plan
      ? lectura.plan
      : null
    : planInicial

  /**
   * ¿Falta saber el plan real? Mientras tanto App muestra la carga en lugar
   * del panel: pintar el plan de entrada mostraría muros de pago un
   * instante a quien ha contratado un plan superior.
   */
  const cargandoPlan = desdePerfil && Boolean(userId) && planContratado === null

  // Sin sesión (instalación sin Supabase) no hay perfil que leer: se usa
  // el plan inicial, que sigue siendo simulable en demo.
  const planBase = planContratado ?? planInicial
  const plan = (MODO_DEMO && planPrueba) || planBase

  const setPlan = (nuevo) => {
    if (!PLANES.includes(nuevo)) return

    // En producción el plan solo cambia en la base de datos (tras un pago):
    // los botones de simulación no pueden conceder acceso.
    if (desdePerfil && !MODO_DEMO) return

    if (!desdePerfil) {
      setPlanPrueba(nuevo)
      return
    }

    // Volver al plan contratado es dejar de simular.
    if (nuevo === planBase) {
      setPlanPrueba(null)
      borrarPlanPrueba()
      return
    }

    setPlanPrueba(nuevo)
    guardarPlan(nuevo)
  }

  return (
    <PlanContext.Provider
      value={{
        plan,
        setPlan,
        planContratado,
        simulando: Boolean(MODO_DEMO && planPrueba && planPrueba !== planBase),
        cargandoPlan,
        puedeSimular: MODO_DEMO,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

/** Hook de acceso al plan activo y su setter. Debe usarse dentro de `<PlanProvider>`. */
export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan debe usarse dentro de <PlanProvider>')
  return ctx
}
