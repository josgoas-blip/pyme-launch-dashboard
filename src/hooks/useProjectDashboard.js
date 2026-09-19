import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useModoLectura } from '../context/ModoLecturaContext.jsx'
import { leerDashboardProyecto, marcarHito, registrarSnapshot } from '../services/proyectoService.js'
import {
  evaluarMetricas,
  normalizarHitos,
  normalizarProyecto,
  normalizarSnapshot,
} from '../utils/proyectoDashboard.js'

/**
 * Datos de seguimiento del proyecto activo del usuario: el proyecto, su
 * snapshot de métricas más reciente y sus hitos.
 *
 * Estados (`estado`):
 *   - 'cargando'     primera consulta en curso.
 *   - 'ok'           hay proyecto (puede no tener snapshot ni hitos aún).
 *   - 'sin-proyecto' el usuario no tiene proyecto, o no hay sesión.
 *   - 'error'        no se pudo consultar; `recargar` lo reintenta.
 *   - 'no-disponible' Modo Consultor sin cuenta de cliente conocida: sin
 *                    ella no hay proyecto que consultar sin arriesgarse a
 *                    mostrar el de otra cuenta. Con cuenta conocida se lee
 *                    su proyecto, en solo lectura.
 *
 * `guardarMetricas` registra una medición nueva (INSERT, nunca UPDATE) y
 * la aplica al estado con la fila que devuelve Supabase.
 *
 * `alternarHito` marca o desmarca un hito con actualización optimista: la
 * casilla cambia al instante y, si Supabase rechaza el cambio, vuelve a su
 * estado anterior y se expone el motivo en `errorHito`.
 *
 * @returns {{
 *   estado: 'cargando'|'ok'|'sin-proyecto'|'error'|'no-disponible',
 *   proyecto: import('../utils/proyectoDashboard.js').ProyectoActivo|null,
 *   snapshot: import('../utils/proyectoDashboard.js').SnapshotMetricas|null,
 *   metricas: import('../utils/proyectoDashboard.js').MetricaOperativa[],
 *   hitos: import('../utils/proyectoDashboard.js').HitoProyecto[],
 *   hitosGuardando: string[],
 *   errorHito: string|null,
 *   recargar: () => void,
 *   alternarHito: (id: string) => Promise<void>,
 *   guardarMetricas: (fila: Record<string, number|null>) => Promise<{ ok: boolean, motivo?: string }>,
 * }}
 */
export function useProjectDashboard() {
  const { userId, cargando: cargandoSesion } = useAuth()
  const { soloLectura, clienteUserId } = useModoLectura()

  // En Modo Consultor el proyecto es el de la cuenta del cliente, nunca el
  // de la sesión que pudiera haber abierta en el navegador del mentor.
  const usuarioConsultado = soloLectura ? clienteUserId : userId

  const [lectura, setLectura] = useState({ estado: 'cargando', proyecto: null, snapshot: null, hitos: [] })
  const [intento, setIntento] = useState(0)
  const [hitosGuardando, setHitosGuardando] = useState([])
  const [errorHito, setErrorHito] = useState(null)

  /** Copia de los hitos para decidir el cambio y poder deshacerlo. */
  const hitosRef = useRef([])
  hitosRef.current = lectura.hitos

  useEffect(() => {
    if (soloLectura && !clienteUserId) {
      setLectura({ estado: 'no-disponible', proyecto: null, snapshot: null, hitos: [] })
      return undefined
    }

    // Mientras se recupera la sesión `userId` es null: no es "sin proyecto".
    if (!soloLectura && cargandoSesion) return undefined

    let vigente = true
    setLectura((actual) => ({ ...actual, estado: 'cargando' }))

    leerDashboardProyecto(usuarioConsultado).then((resultado) => {
      if (!vigente) return

      if (resultado.estado !== 'ok') {
        setLectura({ estado: resultado.estado, proyecto: null, snapshot: null, hitos: [] })
        return
      }

      setLectura({
        estado: 'ok',
        proyecto: normalizarProyecto(resultado.proyecto),
        snapshot: normalizarSnapshot(resultado.snapshot),
        hitos: normalizarHitos(resultado.hitos),
      })
    })

    return () => {
      vigente = false
    }
  }, [soloLectura, clienteUserId, cargandoSesion, usuarioConsultado, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  const alternarHito = useCallback(async (id) => {
    const hito = hitosRef.current.find((h) => h.id === id)
    if (!hito) return

    const completado = !hito.completado
    const conCambio = (lista, valores) => lista.map((h) => (h.id === id ? { ...h, ...valores } : h))

    setErrorHito(null)
    setHitosGuardando((ids) => [...ids, id])
    setLectura((actual) => ({ ...actual, hitos: conCambio(actual.hitos, { completado }) }))

    const resultado = await marcarHito(id, completado)

    setHitosGuardando((ids) => ids.filter((otro) => otro !== id))

    if (!resultado.ok) {
      // Se deshace solo este hito: otros cambios hechos mientras tanto se
      // conservan.
      setLectura((actual) => ({
        ...actual,
        hitos: conCambio(actual.hitos, { completado: hito.completado, completadoEn: hito.completadoEn }),
      }))
      setErrorHito(resultado.motivo)
      return
    }

    const [guardado] = normalizarHitos([resultado.hito])
    if (guardado) setLectura((actual) => ({ ...actual, hitos: conCambio(actual.hitos, guardado) }))
  }, [])

  /** Id del proyecto activo, legible desde el callback sin recrearlo. */
  const proyectoIdRef = useRef(null)
  proyectoIdRef.current = lectura.proyecto?.id ?? null

  /**
   * Registra una medición nueva y la aplica al estado.
   *
   * Se usa la fila que devuelve Supabase y no los valores del formulario:
   * así la tarjeta muestra exactamente lo guardado, fecha del servidor
   * incluida, y la evaluación (sana / vigilar / riesgo) se recalcula sola.
   * No hace falta otra consulta al servidor.
   *
   * @param {Record<string, number|null>} fila - Salida de `validarMetricas`.
   * @returns {Promise<{ ok: boolean, motivo?: string }>}
   */
  const guardarMetricas = useCallback(async (fila) => {
    const resultado = await registrarSnapshot(proyectoIdRef.current, fila)
    if (!resultado.ok) return resultado

    setLectura((actual) => ({ ...actual, snapshot: normalizarSnapshot(resultado.snapshot) }))
    return { ok: true }
  }, [])

  const metricas = useMemo(() => evaluarMetricas(lectura.snapshot), [lectura.snapshot])

  return {
    estado: lectura.estado,
    proyecto: lectura.proyecto,
    snapshot: lectura.snapshot,
    metricas,
    hitos: lectura.hitos,
    hitosGuardando,
    errorHito,
    recargar,
    alternarHito,
    guardarMetricas,
  }
}
