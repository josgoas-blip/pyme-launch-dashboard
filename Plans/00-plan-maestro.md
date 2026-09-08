# Plan Maestro — Dashboard de Control Estratégico y Financiero (Pyme Launch)

> Documento de planificación. **No contiene código.** Define el orden de construcción del
> Dashboard según [CLAUDE.md](../CLAUDE.md), [design.md](../design.md) y la Especificación
> Técnica v2026. La construcción va **de dentro hacia fuera**: primero los datos y los tipos,
> después el esqueleto visual, y por último los cuadrantes de cada pestaña.

## 🎯 Objetivo
Construir un SaaS de dashboard en **React + Tailwind + Recharts + Lucide** (frontend Lovable),
respaldado por **Supabase** y orquestado por **n8n**, con **5 pestañas obligatorias**:
Inicio, Análisis, Estrategia, Viabilidad y Configuración.

## 🧭 Principios de trabajo (heredados de CLAUDE.md)
- **Fidelidad absoluta** a cuadrantes, nombres de variables y fórmulas de la Especificación Técnica v2026.
- **Modularidad**: cada cuadrante es un componente aislado en `src/components/dashboard/`.
- **Sin datos sensibles hardcodeados**: claves y tokens vía `.env`.
- **Validación por fases**: planear → implementar en bloque corto → probar a mano → continuar.
- **Idioma**: Español de España en toda la UI y los textos.

---

## FASE 0 — Andamiaje del proyecto (prerrequisito)
*Objetivo: dejar el entorno listo antes de escribir componentes.*

- Inicializar proyecto React (Vite) + Tailwind CSS.
- Cargar la fuente **Inter** y fijarla como `font-family` base.
- Trasladar la paleta de `design.md` a la configuración de Tailwind (tokens: `primary`,
  `primary-hover`, `accent-green`, `accent-amber`, `accent-red`, `bg-canvas`, `surface-card`,
  `text-main`, `text-muted`).
- Instalar dependencias: `recharts`, `lucide-react`.
- Crear `.env.example` con los nombres de variables (Supabase, n8n) — sin valores reales.
- **Entregable**: proyecto que arranca en blanco con estilos base aplicados.
- **Prueba manual**: `npm run dev` levanta la app y aplica fondo `bg-canvas` + fuente Inter.

---

## FASE 1 — Tipos / Mock Data (el núcleo)
*Objetivo: modelar todos los datos que consumirá el Dashboard antes de pintar nada.*

### 1.1 Definición de tipos (`src/types/`)
Modelar las estructuras de cada cuadrante conforme a la Especificación Técnica:
- **Plan y Fases**: 6 fases con estado (pendiente / en curso / completado).
- **Métricas Clave (KPIs)**: las 4 tarjetas de Inicio.
- **Punto de Equilibrio**: valor actual, umbral y zonas semafóricas.
- **Gantt**: 8 hitos × 6 meses (inicio, duración, fase asociada).
- **Inflación**: serie de indicadores.
- **Matriz Resultados vs Proyecciones**: matriz 5×5.
- **DAFO** + medidor de riesgo.
- **Mercado**: TAM / SAM / SOM / LTV / Churn / NPS.
- **PESTEL**: 6 ejes (radar hexagonal).
- **5 Fuerzas de Porter**: 5 ejes (radar pentagonal).
- **CAME**: ítems con Impacto vs Esfuerzo (scatter) + mitigación de riesgos.
- **Viabilidad**: escenarios VAN / Flujo de Caja (3 líneas) + VAN, TIR, Margen de Seguridad, Score.
- **Configuración**: perfil de cliente, suscripción, integraciones.

### 1.2 Datos simulados (`src/mocks/` o `src/data/`)
- Un fichero de mock por dominio, tipado con lo anterior, con datos realistas de ejemplo.
- Estos mocks serán el "contrato" que luego sustituirá Supabase sin tocar los componentes.
- **Entregable**: capa de datos completa y tipada, importable por cualquier componente.
- **Prueba manual**: los mocks compilan sin errores de tipo y cubren los 5 dominios de pestañas.

---

## FASE 2 — Layout Base y Header con 5 Pestañas (el esqueleto)
*Objetivo: navegación y estructura visual compartida, aún sin cuadrantes.*

- **`AppLayout`**: contenedor general con fondo `bg-canvas`, ancho máximo y padding coherente.
- **`Header`**: barra superior en `primary` (#1B4D3E) con logo/título "Pyme Launch" y acentos.
- **Navegación de pestañas**: control de 5 tabs (Inicio, Análisis, Estrategia, Viabilidad,
  Configuración) con estado activo, gestionado por estado local o router.
- **Componentes base reutilizables** (siguiendo `design.md`):
  - `Card` (borde `#E5E7EB`, `rounded-xl`, `shadow-sm`, fondo `surface-card`).
  - `CardTitle` (uppercase, `tracking-wider`, `text-muted`).
  - `KpiNumber` (`text-3xl`, `font-extrabold`, `text-main`).
  - `Badge` (pill, `rounded-full`).
- **Entregable**: shell navegable con 5 pestañas conmutables y placeholders vacíos.
- **Prueba manual**: se puede cambiar entre las 5 pestañas; el header y los estilos respetan `design.md`.

---

## FASE 3 — Componentes de la Pestaña Inicio
*Objetivo: primer conjunto completo de cuadrantes, validando el patrón de trabajo.*

Ubicación: `src/components/dashboard/`. Cada cuadrante = 1 componente aislado.
1. **EstadoDelPlan** — visualización de las 6 fases con su estado (semáforo de colores).
2. **PuntoDeEquilibrio** — *Radial Gauge* semicircular con zonas semafóricas
   (`#E53E3E`, `#DD6B20`, `#38A169`) — Recharts.
3. **MetricasClave** — fila de **4 tarjetas** KPI (usa `Card` + `KpiNumber`).
4. **DiagramaGantt** — tabla matricial **8 hitos × 6 meses** con bloques `#1B4D3E`.
5. **IndicadoresInflacion** — visualización de la serie de inflación.
6. **Ensamblado** de la vista **Inicio** integrando los 5 cuadrantes en el layout.

- **Entregable**: pestaña Inicio funcional y fiel a la Especificación.
- **Prueba manual**: cada cuadrante lee de los mocks y respeta la paleta/tipografía.

---

## FASE 4 — Componentes de Análisis, Estrategia y Viabilidad
*Objetivo: completar los cuadrantes analíticos y financieros restantes.*

### 4.1 Pestaña Análisis
- **MatrizResultados** — Resultados vs Proyecciones (matriz **5×5**).
- **RiesgoDAFO** — cuadrantes DAFO + medidor de riesgo.
- **AnalisisMercado** — TAM / SAM / SOM / LTV / Churn / NPS.
- **RadarPESTEL** — radar de **6 ejes** (hexágono) — Recharts.
- **RadarPorter** — radar de **5 ejes** (pentágono) — Recharts.

### 4.2 Pestaña Estrategia
- **MatrizCAME** — *Scatter Plot* Impacto vs Esfuerzo con **4 cuadrantes pastel**
  (verde, azul, amarillo, rojo).
- **MitigacionRiesgos** — barra de mitigación de riesgos.

### 4.3 Pestaña Viabilidad
- **AnalisisEscenarios** — *Line Chart* de **3 líneas** (VAN / Flujo de Caja).
- **IndicadoresViabilidad** — tarjetas: **VAN, TIR, Margen de Seguridad, Score de Viabilidad**.

### 4.4 Pestaña Configuración
- **PerfilCliente**, **Suscripcion**, **Integraciones** (formularios/estado; sin lógica sensible).

- **Entregable**: las 5 pestañas completas y navegables con datos mock.
- **Prueba manual**: cada radar/scatter/line respeta ejes, colores y nº de series indicados.

---

## FASE 5 — Integración de datos reales (posterior)
*Fuera del alcance del maquetado inicial; se planificará aparte.*
- Sustituir mocks por **Supabase** (con RLS) manteniendo el contrato de tipos de la Fase 1.
- Conectar **n8n** (webhooks + LLM) para los flujos que lo requieran.
- Gestión de secretos por `.env`.

---

## ✅ Criterio de "Hecho" por fase
Una fase se cierra solo cuando: (a) compila sin errores de tipo, (b) respeta `design.md`,
(c) se ha probado a mano en el navegador, y (d) cada cuadrante es un componente aislado
reutilizable. Solo entonces se avanza a la siguiente fase.

## 📌 Orden de ejecución resumido
`Fase 0` (andamiaje) → `Fase 1` (tipos + mocks) → `Fase 2` (layout + 5 tabs) →
`Fase 3` (Inicio) → `Fase 4` (Análisis, Estrategia, Viabilidad, Configuración) →
`Fase 5` (datos reales).
