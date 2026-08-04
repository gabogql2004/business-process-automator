// El nodo Fin no transforma nada, solo marca el punto donde el executor
// debe detenerse y tomar el input acumulado como resultado final.
export async function execute({ input }) {
  return input
}
