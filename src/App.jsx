import { useCallback, useEffect, useRef, useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import AuthView from './components/auth/AuthView.jsx'
import PantallaCargando from './components/auth/PantallaCargando.jsx'
import RestablecerPasswordView from './components/auth/RestablecerPasswordView.jsx'
import HistorialNoDisponible from './components/auth/HistorialNoDisponible.jsx'
import OnboardingWizard from './components/onboarding/OnboardingWizard.jsx'
import InicioView from './components/dashboard/InicioView.jsx'
import AnalisisView from './components/dashboard/AnalisisView.jsx'
import EstrategiaView from './components/dashboard/EstrategiaView.jsx'
import ViabilidadView from './components/dashboard/ViabilidadView.jsx'
import ConfiguracionView from './components/dashboard/ConfiguracionView.jsx'
import InformeEjecutivo from './components/informe/InformeEjecutivo.jsx'
import { PlanProvider, usePlan } from './context/PlanContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { guardarDiagnostico, buscarDiagnosticoPrevio } from './services/diagnosticoService.js'
import { cerrarSesion } from './services/authService.js'
import { actualizarPuntuacionProyecto, tieneProyecto } from './services/proyectoService.js'
import {
  cargarDiagnosticoPendiente,
  guardarDiagnosticoPendiente,
  borrarDiagnosticoPendiente,
} from './utils/persistenciaPendientes.js'
import { AvisoSincronizacion, DiagnosticoPendiente } from './components/dashboard/AvisosPanel.jsx'
import {
  cargarDiagnosticoLocal,
  guardarDiagnosticoLocal,
  borrarDiagnosticoLocal,
  cargarExpedienteId,
  guardarExpedienteId,
  borrarExpedienteId,
} from './utils/persistenciaDiagnostico.js'
import { debeSustituirLocal } from './utils/hidratacionDiagnostico.js'
import { borrarPestanaActiva, borrarPlan } from './utils/persistenciaNavegacion.js'
import { borrarHitosCompletados } from './utils/persistenciaHitos.js'
import { borrarCitaLocal } from './utils/persistenciaCita.js'
import { leerParametrosConsultor } from './utils/modoConsultor.js'
import {
  llegoDesdeEnlaceRecuperacion,
  errorDelEnlaceRecuperacion,
  salirDeRutaRecuperacion,
} from './utils/recuperacionPassword.js'
import { cargarExpedienteConsultor } from './services/consultorService.js'
import { ModoLecturaProvider } from './context/ModoLecturaContext.jsx'
import BannerConsultor from './components/consultor/BannerConsultor.jsx'
import EnlaceNoValido from './components/consultor/EnlaceNoValido.jsx'

const VISTAS_POR_PESTANA = {
  inicio: InicioView,
  analisis: AnalisisView,
  estrategia: EstrategiaView,
  viabilidad: ViabilidadView,
  configuracion: ConfiguracionView,
}

/**
 * Pestañas que se calculan por completo a partir del diagnóstico. Sin él no
 * se pintan: el adaptador devolvería datos de ejemplo.
 */
const PESTANAS_DE_DIAGNOSTICO = ['analisis', 'estrategia', 'viabilidad']

/** Búsqueda de historial aún sin resolver. */
const BUSQUEDA_PENDIENTE = { userId: null, estado: null }

/**
 * Panel en Modo Consultor: el expediente de un cliente, en solo lectura.
 *
 * Se resuelve antes que la barrera de autenticación porque el mentor entra
 * por un enlace y no tiene cuenta en el producto. Las cinco pestañas son
 * las mismas que ve el cliente —el mentor necesita las métricas completas
 * para conducir la sesión—; lo que cambia es que `ModoLecturaProvider`
 * marca el árbol y cada componente esconde sus acciones.
 */
function PanelConsultor({ expedienteId, token }) {
  const [estado, setEstado] = useState({ cargando: true })

  useEffect(() => {
    let vigente = true

    cargarExpedienteConsultor(expedienteId, token).then((resultado) => {
      if (vigente) setEstado({ cargando: false, resultado })
    })

    return () => {
      vigente = false
    }
  }, [expedienteId, token])

  if (estado.cargando) return <PantallaCargando mensaje="Cargando el expediente…" />

  if (!estado.resultado?.ok) {
    return <EnlaceNoValido motivo={estado.resultado?.motivo} expedienteId={expedienteId} />
  }

  const { id, respuestas, nombreCliente, clienteUserId, completadoEn, enlaceAnterior } = estado.resultado.expediente

  return (
    <ModoLecturaProvider
      expedienteId={id}
      nombreCliente={nombreCliente}
      clienteUserId={clienteUserId}
      completadoEn={completadoEn}
      enlaceAnterior={enlaceAnterior}
    >
      {/* El mentor entra con acceso total: el selector de plan está oculto
          en solo lectura, y sin esto se quedaría en 'report' y no podría
          abrir Viabilidad ni Estrategia, que es justo lo que necesita para
          conducir la sesión. Este proveedor anida sobre el de App y gana. */}
      <PlanProvider planInicial="total">
        {/* `onReiniciar` es una función vacía: en solo lectura no hay nada
            que reiniciar, y el botón que la usaba está oculto. */}
        <OnboardingProvider respuestas={respuestas} onReiniciar={() => {}}>
          <div className="no-imprimir">
            <BannerConsultor />
            <AppLayout nombreUsuario={nombreCliente}>
              {(activeTab) => {
                const Vista = VISTAS_POR_PESTANA[activeTab]
                return <Vista />
              }}
            </AppLayout>
          </div>

          <InformeEjecutivo respuestas={respuestas} />
        </OnboardingProvider>
      </PlanProvider>
    </ModoLecturaProvider>
  )
}

function Enrutador() {
  const {
    userId,
    nombreCompleto,
    cargando: cargandoSesion,
    authDisponible,
    recuperandoPassword,
    finalizarRecuperacion,
  } = useAuth()
  const { cargandoPlan } = usePlan()

  /**
   * Parámetros del enlace de consultoría.
   *
   * Se leen una sola vez: la URL no cambia mientras el panel está abierto,
   * y releerla en cada render obligaría a memorizar el resultado para no
   * disparar el efecto de carga sin parar.
   */
  const [paramsConsultor] = useState(leerParametrosConsultor)

  /**
   * ¿Se abrió la aplicación desde el enlace del correo de recuperación?
   *
   * Se combina con el evento `PASSWORD_RECOVERY` de Supabase: cualquiera de
   * las dos señales basta para mostrar el cambio de contraseña.
   */
  const [enlaceRecuperacion, setEnlaceRecuperacion] = useState(llegoDesdeEnlaceRecuperacion)
  const mostrandoRecuperacion = enlaceRecuperacion || recuperandoPassword

  /** Modo con el que se abre la pantalla de acceso. */
  const [modoAcceso, setModoAcceso] = useState('login')

  /** Diagnóstico activo. `null` = aún no completado. */
  const [respuestas, setRespuestas] = useState(cargarDiagnosticoLocal)

  /**
   * Copia de `respuestas` legible desde callbacks asíncronos.
   *
   * La búsqueda en Supabase decide al volver si sustituye la copia local, y
   * tiene que comparar con la copia de ese momento, no con la del render en
   * que empezó la consulta.
   */
  const respuestasRef = useRef(respuestas)
  respuestasRef.current = respuestas

  /** De qué expediente salen los datos del panel y de dónde se cargaron. */
  const [expediente, setExpediente] = useState(() =>
    respuestas
      ? { id: cargarExpedienteId(), completadoEn: respuestas.meta?.completadoEn ?? null, origen: 'local' }
      : null,
  )

  /**
   * Resultado de buscar el historial del usuario en Supabase.
   *
   * Guarda para qué `userId` se resolvió: si en la misma pestaña entra otra
   * cuenta, la búsqueda anterior no le vale y se repite.
   */
  const [busqueda, setBusqueda] = useState(BUSQUEDA_PENDIENTE)

  /**
   * El usuario ha pulsado "Nuevo diagnóstico".
   *
   * Mientras está activo no se recupera el diagnóstico anterior de
   * Supabase. Sin esta marca, el reinicio dejaba `respuestas` en `null`, la
   * búsqueda de historial volvía a lanzarse, encontraba el diagnóstico
   * previo y devolvía al usuario al panel: el botón no hacía nada.
   */
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState(false)

  /**
   * Base de la reevaluación: el diagnóstico con el que se precarga el
   * cuestionario.
   *
   *   - `null`: no hay reevaluación en curso.
   *   - `{ estado: 'preparando' }`: consultando el último diagnóstico.
   *   - `{ estado: 'lista', respuestas, expedienteId }`: `respuestas` es
   *     `null` si no hay nada previo y el cuestionario va en blanco.
   */
  const [reevaluacion, setReevaluacion] = useState(null)

  /**
   * Estado de la subida del diagnóstico a Supabase.
   *
   *   - `{ estado: 'ok' }`: guardado o sin nada que subir.
   *   - `{ estado: 'guardando' }`
   *   - `{ estado: 'error', motivo }`: solo está en este navegador. El panel
   *     lo avisa y ofrece reintentar, en lugar de fallar en silencio como
   *     antes (el usuario solo lo descubría al cerrar sesión y ver otra vez
   *     el cuestionario).
   */
  const [sincronizacion, setSincronizacion] = useState({ estado: 'ok' })

  /** `userId` legible desde callbacks estables. */
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  /**
   * Sube un diagnóstico a Supabase.
   *
   * Antes de intentarlo lo deja registrado como pendiente para esta cuenta:
   * si la subida falla y el usuario cierra sesión, al volver a entrar se
   * recupera y se reintenta, en lugar de perderse con la copia del
   * navegador. Cuando Supabase confirma, se borra de pendientes, se
   * incorpora el id del expediente y se actualiza la puntuación del
   * proyecto activo.
   */
  const subirDiagnostico = useCallback((nuevas) => {
    const uid = userIdRef.current
    guardarDiagnosticoPendiente(uid, nuevas)
    setSincronizacion({ estado: 'guardando' })

    return guardarDiagnostico(nuevas).then((resultado) => {
      if (!resultado?.ok) {
        setSincronizacion({ estado: 'error', motivo: resultado?.motivo ?? 'error desconocido' })
        return resultado
      }

      borrarDiagnosticoPendiente(uid, nuevas)
      setSincronizacion({ estado: 'ok' })

      // El id se incorpora solo si el panel sigue mostrando esta evaluación.
      if (resultado.id) {
        setExpediente((actual) =>
          actual?.origen === 'cuestionario' && actual.completadoEn === (nuevas.meta?.completadoEn ?? null)
            ? { ...actual, id: resultado.id }
            : actual,
        )
      }

      // Solo con el diagnóstico ya guardado: si no, el proyecto mostraría
      // una puntuación que no está respaldada por ninguna evaluación.
      if (uid) actualizarPuntuacionProyecto(uid, nuevas.score_total)
      return resultado
    })
  }, [])

  /** Reintenta subir el diagnóstico que se está mostrando. */
  const reintentarSubida = useCallback(() => {
    if (respuestasRef.current) subirDiagnostico(respuestasRef.current)
  }, [subirDiagnostico])

  /**
   * Hidratación desde Supabase: al iniciar sesión, o al cargar con una
   * sesión ya abierta (incluido un F5), se busca el último diagnóstico del
   * usuario y se carga completo en el estado global.
   *
   *   - Si lo tiene, el panel se pinta con sus datos; el cuestionario no
   *     vuelve a aparecer salvo que pulse "Nuevo diagnóstico".
   *   - Si no lo tiene, va al cuestionario.
   *   - Si no se puede saber, se le dice y se le deja reintentar, en lugar
   *     de mandarle a repetir un cuestionario que quizá ya hizo.
   *
   * Con copia en el navegador el panel se pinta al instante con ella —una
   * recarga no pasa por pantallas de carga ni pierde la pestaña— y la
   * consulta corre igualmente en segundo plano: Supabase es la fuente de
   * verdad, y la copia local puede estar incompleta o ser de una
   * evaluación anterior a la última. `debeSustituirLocal` decide cuál gana.
   *
   * Se consulta una vez por usuario (`busqueda.userId`), no en cada cambio.
   */
  useEffect(() => {
    if (!userId || nuevoDiagnostico || mostrandoRecuperacion) return undefined
    if (busqueda.userId === userId) return undefined

    let vigente = true

    // Diagnóstico y proyecto se consultan a la vez: el usuario es un
    // cliente existente si tiene cualquiera de los dos.
    Promise.all([buscarDiagnosticoPrevio(userId), tieneProyecto(userId)]).then(([resultado, proyecto]) => {
      if (!vigente) return

      // Diagnóstico que se completó con esta cuenta pero no llegó a
      // subirse (por ejemplo, porque falló la escritura y luego se cerró
      // sesión). Se trata como la copia local más reciente.
      const pendiente = cargarDiagnosticoPendiente(userId)
      const local = {
        respuestas: respuestasRef.current ?? pendiente?.respuestas ?? null,
        expedienteId: cargarExpedienteId(),
      }

      if (resultado.estado === 'encontrado' && debeSustituirLocal(local, resultado)) {
        if (resultado.expediente.id) guardarExpedienteId(resultado.expediente.id)
        setExpediente(resultado.expediente)

        // Si Supabase trae lo mismo que ya se está pintando, no se
        // sustituye el objeto: evita recalcular todas las pestañas tras
        // cada recarga sin que cambie nada visible.
        if (JSON.stringify(local.respuestas) !== JSON.stringify(resultado.respuestas)) {
          guardarDiagnosticoLocal(resultado.respuestas)
          setRespuestas(resultado.respuestas)
        }
        // Lo que había pendiente es anterior a lo que ya está en Supabase.
        borrarDiagnosticoPendiente(userId)
      } else if (pendiente && !respuestasRef.current) {
        // Supabase no tiene nada más reciente (o no se pudo consultar): se
        // recupera el diagnóstico pendiente y se vuelve a intentar subirlo.
        guardarDiagnosticoLocal(pendiente.respuestas)
        setRespuestas(pendiente.respuestas)
        setExpediente({ id: null, completadoEn: pendiente.respuestas.meta?.completadoEn ?? null, origen: 'cuestionario' })
        subirDiagnostico(pendiente.respuestas)
        setBusqueda({ userId, estado: 'encontrado' })
        return
      }

      // Sin diagnóstico pero con proyecto: es un cliente existente y va al
      // panel, no al cuestionario de bienvenida. Si el proyecto tampoco se
      // pudo consultar, no se puede afirmar que sea nuevo.
      let estado = resultado.estado
      if (estado === 'sin-diagnostico') {
        if (proyecto === 'si') estado = 'solo-proyecto'
        else if (proyecto === 'error') estado = 'error'
      }

      setBusqueda({ userId, estado })
    })

    return () => {
      vigente = false
    }
    // `subirDiagnostico` es estable (useCallback sin dependencias).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, nuevoDiagnostico, mostrandoRecuperacion, busqueda])

  /**
   * Al cerrar sesión se limpia el diagnóstico en memoria y en el navegador.
   *
   * Sin esto, el siguiente usuario que entrara en el mismo equipo vería el
   * panel del anterior antes de que terminara ninguna consulta.
   */
  useEffect(() => {
    if (!authDisponible || cargandoSesion || userId) return

    setRespuestas(null)
    setExpediente(null)
    setBusqueda(BUSQUEDA_PENDIENTE)
    setNuevoDiagnostico(false)
    setReevaluacion(null)
    setSincronizacion({ estado: 'ok' })
    // Los diagnósticos pendientes de subir NO se borran: van asociados a
    // su cuenta y se recuperan cuando esa misma cuenta vuelve a entrar.
    borrarDiagnosticoLocal()
    borrarExpedienteId()
    borrarCitaLocal()
    borrarHitosCompletados()
    // El siguiente inicio de sesión entra siempre por Inicio.
    borrarPestanaActiva()
    borrarPlan()
  }, [authDisponible, cargandoSesion, userId])

  /**
   * Recibe las respuestas del wizard y habilita la vista del Dashboard.
   *
   * La sesión se guarda en el navegador de forma síncrona —es lo que
   * sostiene la recarga— y la persistencia en Supabase va en segundo
   * plano, asociando el `user_id` real: el acceso al panel no espera a la
   * red, y si la escritura falla el servicio lo encola en memoria.
   *
   * Cada diagnóstico es una fila nueva en `diagnosticos`, también al
   * reevaluar: el anterior queda en el histórico. Cuando Supabase confirma
   * la escritura se actualiza además `projects.overall_score` del proyecto
   * activo, para que el estado de madurez del proyecto refleje la última
   * evaluación.
   */
  const handleOnboardingComplete = (nuevas) => {
    // El expediente guardado apuntaba al diagnóstico anterior. Se olvida
    // antes de guardar el nuevo: si la escritura fallara y siguiera ahí, la
    // hidratación tomaría la fila anterior por "el mismo expediente" y
    // devolvería al usuario sus respuestas viejas tras recargar.
    borrarExpedienteId()
    // El panel se reabre por Inicio con la evaluación nueva.
    borrarPestanaActiva()

    setRespuestas(nuevas)
    setExpediente({ id: null, completadoEn: nuevas.meta?.completadoEn ?? null, origen: 'cuestionario' })
    setNuevoDiagnostico(false)
    setReevaluacion(null)
    guardarDiagnosticoLocal(nuevas)

    subirDiagnostico(nuevas)
  }

  /**
   * Nuevo diagnóstico como reevaluación: abre el cuestionario con las
   * respuestas del último diagnóstico ya marcadas.
   *
   * La base es el diagnóstico más reciente entre el de Supabase y el que se
   * está mostrando (que puede ser más nuevo si su escritura aún no ha
   * llegado): decide `debeSustituirLocal`, el mismo criterio que la
   * hidratación. Sin nada previo, el cuestionario va en blanco.
   *
   * No se borra nada al empezar: el diagnóstico actual, el avance de la
   * hoja de ruta y la cita siguen intactos hasta que se guarda la nueva
   * evaluación. Si el usuario vuelve al panel o recarga a mitad, encuentra
   * todo como estaba. Hitos y cita tampoco se borran al guardar: pertenecen
   * al mismo proyecto, que sigue siendo el suyo.
   */
  const handleReiniciarOnboarding = () => {
    const local = { respuestas: respuestasRef.current, expedienteId: cargarExpedienteId() }

    setNuevoDiagnostico(true)
    setReevaluacion({ estado: 'preparando' })

    const consulta = userId ? buscarDiagnosticoPrevio(userId) : Promise.resolve({ estado: 'sin-diagnostico' })
    // Si Supabase tarda, se parte de lo que ya hay en pantalla en lugar de
    // dejar al usuario esperando para empezar.
    const tiempoMaximo = new Promise((resolver) => setTimeout(() => resolver({ estado: 'error' }), 6000))

    Promise.race([consulta, tiempoMaximo]).then((resultado) => {
      const base =
        resultado.estado === 'encontrado' && debeSustituirLocal(local, resultado)
          ? { respuestas: resultado.respuestas, expedienteId: resultado.expediente.id }
          : { respuestas: local.respuestas, expedienteId: local.expedienteId }

      // Solo si la reevaluación sigue en marcha: el usuario puede haber
      // vuelto al panel mientras tanto.
      setReevaluacion((actual) => (actual?.estado === 'preparando' ? { estado: 'lista', ...base } : actual))
    })
  }

  /** Abandona la reevaluación sin guardar: el panel sigue como estaba. */
  const cancelarReevaluacion = () => {
    setNuevoDiagnostico(false)
    setReevaluacion(null)
  }

  /** Sale de la pantalla de recuperación y limpia la URL. */
  const terminarRecuperacion = (siguienteModoAcceso = 'login') => {
    salirDeRutaRecuperacion()
    finalizarRecuperacion()
    setEnlaceRecuperacion(false)
    setModoAcceso(siguienteModoAcceso)
  }

  // El Modo Consultor se resuelve antes que todo lo demás: el mentor llega
  // por enlace, sin cuenta, y no debe toparse con la pantalla de acceso.
  if (paramsConsultor.activo) {
    return (
      <PanelConsultor
        expedienteId={paramsConsultor.expedienteId}
        token={paramsConsultor.token}
      />
    )
  }

  // Cambio de contraseña desde el enlace del correo. Va antes que la
  // barrera de acceso y que el panel: el enlace abre sesión, y sin esta
  // prioridad el usuario entraría directo al panel sin poder cambiar la
  // contraseña que ha olvidado.
  if (mostrandoRecuperacion) {
    if (cargandoSesion) return <PantallaCargando mensaje="Verificando el enlace…" />

    return (
      <RestablecerPasswordView
        haySesion={Boolean(userId)}
        errorEnlace={errorDelEnlaceRecuperacion()}
        onTerminar={() => terminarRecuperacion()}
        onSolicitarOtroEnlace={() => terminarRecuperacion('recuperar')}
      />
    )
  }

  // Recuperando la sesión guardada.
  if (cargandoSesion) {
    return <PantallaCargando />
  }

  // Sin sesión: pantalla de acceso. Si la instalación no tiene credenciales
  // de Supabase, se deja pasar para que un clon sin `.env` siga siendo
  // ejecutable en local.
  if (authDisponible && !userId) {
    return <AuthView key={modoAcceso} modoInicial={modoAcceso} />
  }

  // Nuevo diagnóstico en curso (reevaluación o, sin datos previos, en blanco).
  if (nuevoDiagnostico) {
    if (reevaluacion?.estado === 'preparando') {
      return <PantallaCargando mensaje="Preparando tu reevaluación…" />
    }

    return (
      <OnboardingProvider respuestas={null} onReiniciar={handleReiniciarOnboarding}>
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          respuestasPrevias={reevaluacion?.respuestas ?? null}
          expedienteAnteriorId={reevaluacion?.expedienteId ?? null}
          // Solo se puede volver si hay un panel al que volver: con diagnóstico,
          // o como cliente con proyecto que aún no lo ha completado.
          onCancelar={respuestas || busqueda.estado === 'solo-proyecto' ? cancelarReevaluacion : null}
        />
      </OnboardingProvider>
    )
  }

  const busquedaResuelta = busqueda.userId === userId
  const soloProyecto = respuestas === null && busquedaResuelta && busqueda.estado === 'solo-proyecto'

  if (respuestas === null && !soloProyecto) {

    // No se pudo saber si tiene diagnóstico: ni panel ni cuestionario.
    if (userId && busquedaResuelta && ['error', 'ilegible'].includes(busqueda.estado)) {
      return (
        <HistorialNoDisponible
          motivo={busqueda.estado}
          onReintentar={() => setBusqueda(BUSQUEDA_PENDIENTE)}
          onNuevoDiagnostico={() => {
            setReevaluacion({ estado: 'lista', respuestas: null, expedienteId: null })
            setNuevoDiagnostico(true)
          }}
          onCerrarSesion={cerrarSesion}
        />
      )
    }

    // El cuestionario solo aparece cuando está claro que toca: sin
    // diagnóstico ni proyecto en Supabase, o sin autenticación. Antes de
    // saberlo se muestra la carga; si no, el cuestionario asomaría un
    // instante a un usuario recurrente mientras se consulta su historial.
    const tocaCuestionario = !userId || (busquedaResuelta && busqueda.estado === 'sin-diagnostico')

    if (!tocaCuestionario) {
      return <PantallaCargando mensaje="Cargando tu panel…" />
    }

    return (
      <OnboardingProvider respuestas={null} onReiniciar={handleReiniciarOnboarding}>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </OnboardingProvider>
    )
  }

  // El panel espera a conocer el plan contratado: con el plan de entrada
  // aplicado por defecto, quien ha contratado uno superior vería un instante
  // los muros de pago de Estrategia y Viabilidad.
  if (cargandoPlan) {
    return <PantallaCargando mensaje="Cargando tu panel…" />
  }

  return (
    <OnboardingProvider respuestas={respuestas} expediente={expediente} onReiniciar={handleReiniciarOnboarding}>
      {/* La aplicación se oculta al imprimir: el PDF solo lleva el informe.
          Por eso el informe se monta fuera de este árbol. */}
      <div className="no-imprimir">
        <AppLayout nombreUsuario={nombreCompleto}>
          {(activeTab) => {
            const Vista = VISTAS_POR_PESTANA[activeTab]
            const sinDiagnostico = respuestas === null
            return (
              <>
                <AvisoSincronizacion sincronizacion={sincronizacion} onReintentar={reintentarSubida} />
                {sinDiagnostico && activeTab === 'inicio' && (
                  <DiagnosticoPendiente compacto onEmpezar={handleReiniciarOnboarding} />
                )}
                {sinDiagnostico && PESTANAS_DE_DIAGNOSTICO.includes(activeTab) ? (
                  <DiagnosticoPendiente onEmpezar={handleReiniciarOnboarding} />
                ) : (
                  <Vista />
                )}
              </>
            )
          }}
        </AppLayout>
      </div>

      {/* Informe Ejecutivo: invisible en pantalla, es lo único que compone
          el navegador al generar el PDF. Sin diagnóstico no hay informe. */}
      {respuestas && <InformeEjecutivo respuestas={respuestas} />}
    </OnboardingProvider>
  )
}

export default function App() {
  /**
   * En Modo Consultor no se lee el plan del perfil: si en ese navegador
   * hubiera una sesión abierta, sería el plan de otra cuenta, y el visor ya
   * usa su propio plan fijo (el completo) anidado dentro.
   */
  const [modoConsultor] = useState(() => leerParametrosConsultor().activo)

  return (
    <AuthProvider>
      {/* El plan sale de profiles.plan_contratado del usuario. El del Modo
          Consultor, anidado dentro, es fijo y siempre el completo. */}
      <PlanProvider desdePerfil={!modoConsultor}>
        <Enrutador />
      </PlanProvider>
    </AuthProvider>
  )
}
