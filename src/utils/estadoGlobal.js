/**
 * Calcula el calificativo cualitativo del estado global del proyecto a
 * partir de `progreso_recorrido` (ControlProyecto). Mismos umbrales
 * semafóricos (33/66) usados en el resto del dashboard (Riesgo DAFO, etc.).
 *
 * @param {number} progresoRecorrido - % de avance global del recorrido (0-100).
 * @returns {{ calificativo: 'Inicial'|'Prometedor'|'Avanzado', colorSemaforo: string, porcentaje: number }}
 */
export function calcularEstadoGlobal(progresoRecorrido) {
  const porcentaje = Math.min(100, Math.max(0, progresoRecorrido))

  let calificativo
  let colorSemaforo
  if (porcentaje < 33) {
    calificativo = 'Inicial'
    colorSemaforo = '#E53E3E'
  } else if (porcentaje < 66) {
    calificativo = 'Prometedor'
    colorSemaforo = '#DD6B20'
  } else {
    calificativo = 'Avanzado'
    colorSemaforo = '#38A169'
  }

  return { calificativo, colorSemaforo, porcentaje }
}
