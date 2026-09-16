import { useEffect, useState } from 'react'
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
import { PlanProvider } from './context/PlanContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { guardarDiagnostico, buscarDiagnosticoPrevio } from './services/diagnosticoService.js'
import { cerrarSesion } from './services/authService.js'
import {
  cargarDiagnosticoLocal,
  guardarDiagnosticoLocal,
  borrarDiagnosticoLocal,
  guardarExpedienteId,
  borrarExpedienteId,
} from './utils/persistenciaDiagnostico.js'
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

  const { id, respuestas, nombreCliente } = estado.resultado.expediente

  return (
    <ModoLecturaProvider expedienteId={id} nombreCliente={nombreCliente}>
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
   * Usuario recurrente: al iniciar sesión (o al cargar con una sesión ya
   * abierta) se busca su último diagnóstico en Supabase.
   *
   *   - Si lo tiene, va directo al panel con sus datos; el cuestionario no
   *     vuelve a aparecer salvo que pulse "Nuevo diagnóstico".
   *   - Si no lo tiene, va al cuestionario.
   *   - Si no se puede saber, se le dice y se le deja reintentar, en lugar
   *     de mandarle a repetir un cuestionario que quizá ya hizo.
   *
   * Solo se consulta cuando no hay copia local: si el navegador ya la
   * tiene, el destino es el panel igualmente y la consulta solo añadiría
   * espera antes de pintarlo.
   */
  useEffect(() => {
    if (!userId || respuestas || nuevoDiagnostico || mostrandoRecuperacion) return undefined
    if (busqueda.userId === userId) return undefined

    let vigente = true

    buscarDiagnosticoPrevio(userId).then((resultado) => {
      if (!vigente) return

      if (resultado.estado === 'encontrado') {
        guardarDiagnosticoLocal(resultado.respuestas)
        guardarExpedienteId(resultado.id)
        setRespuestas(resultado.respuestas)
      }

      setBusqueda({ userId, estado: resultado.estado })
    })

    return () => {
      vigente = false
    }
  }, [userId, respuestas, nuevoDiagnostico, mostrandoRecuperacion, busqueda])

  /**
   * Al cerrar sesión se limpia el diagnóstico en memoria y en el navegador.
   *
   * Sin esto, el siguiente usuario que entrara en el mismo equipo vería el
   * panel del anterior antes de que terminara ninguna consulta.
   */
  useEffect(() => {
    if (!authDisponible || cargandoSesion || userId) return

    setRespuestas(null)
    setBusqueda(BUSQUEDA_PENDIENTE)
    setNuevoDiagnostico(false)
    borrarDiagnosticoLocal()
    borrarExpedienteId()
    borrarCitaLocal()
    borrarHitosCompletados()
  }, [authDisponible, cargandoSesion, userId])

  /**
   * Recibe las respuestas del wizard y habilita la vista del Dashboard.
   *
   * La sesión se guarda en el navegador de forma síncrona —es lo que
   * sostiene la recarga— y la persistencia en Supabase va en segundo
   * plano, asociando el `user_id` real: el acceso al panel no espera a la
   * red, y si la escritura falla el servicio lo encola en memoria.
   */
  const handleOnboardingComplete = (nuevas) => {
    setRespuestas(nuevas)
    setNuevoDiagnostico(false)
    guardarDiagnosticoLocal(nuevas)
    guardarDiagnostico(nuevas)
  }

  /**
   * Nuevo diagnóstico: devuelve al cuestionario y borra la sesión guardada,
   * para que "empezar de cero" siga significando eso tras una recarga. El
   * histórico ya persistido en Supabase no se toca.
   */
  const handleReiniciarOnboarding = () => {
    setNuevoDiagnostico(true)
    borrarDiagnosticoLocal()
    // El avance de la hoja de ruta pertenece al diagnóstico que se borra:
    // conservarlo dejaría hitos marcados de un plan que ya no existe.
    borrarHitosCompletados()
    // La cita pertenece al expediente que se borra.
    borrarCitaLocal()
    borrarExpedienteId()
    setRespuestas(null)
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

  if (respuestas === null) {
    const busquedaResuelta = busqueda.userId === userId

    // No se pudo saber si tiene diagnóstico: ni panel ni cuestionario.
    if (userId && !nuevoDiagnostico && busquedaResuelta && ['error', 'ilegible'].includes(busqueda.estado)) {
      return (
        <HistorialNoDisponible
          motivo={busqueda.estado}
          onReintentar={() => setBusqueda(BUSQUEDA_PENDIENTE)}
          onNuevoDiagnostico={() => setNuevoDiagnostico(true)}
          onCerrarSesion={cerrarSesion}
        />
      )
    }

    // El cuestionario solo aparece cuando está claro que toca: no hay
    // historial, el usuario pidió uno nuevo, o no hay autenticación. Antes
    // de saberlo se muestra la carga; si no, el cuestionario asomaría un
    // instante a un usuario recurrente mientras se consulta su historial.
    const tocaCuestionario = !userId || nuevoDiagnostico || (busquedaResuelta && busqueda.estado === 'sin-diagnostico')

    if (!tocaCuestionario) {
      return <PantallaCargando mensaje="Cargando tu panel…" />
    }

    return (
      <OnboardingProvider respuestas={null} onReiniciar={handleReiniciarOnboarding}>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </OnboardingProvider>
    )
  }

  return (
    <OnboardingProvider respuestas={respuestas} onReiniciar={handleReiniciarOnboarding}>
      {/* La aplicación se oculta al imprimir: el PDF solo lleva el informe.
          Por eso el informe se monta fuera de este árbol. */}
      <div className="no-imprimir">
        <AppLayout nombreUsuario={nombreCompleto}>
          {(activeTab) => {
            const Vista = VISTAS_POR_PESTANA[activeTab]
            return <Vista />
          }}
        </AppLayout>
      </div>

      {/* Informe Ejecutivo: invisible en pantalla, es lo único que compone
          el navegador al generar el PDF. */}
      <InformeEjecutivo respuestas={respuestas} />
    </OnboardingProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider planInicial="report">
        <Enrutador />
      </PlanProvider>
    </AuthProvider>
  )
}
