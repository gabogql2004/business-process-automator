// El nodo Trigger es el punto de partida: simplemente deja pasar el input
// inicial (texto que el usuario escribió al ejecutar el flujo) al siguiente nodo.
export async function execute({ input }) {
  return input ?? ''
}
