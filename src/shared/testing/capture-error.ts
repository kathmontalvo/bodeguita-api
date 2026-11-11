/**
 * Ejecuta `fn` y devuelve el error que lanza, para revisar su `code` y `kind`
 * con `toMatchObject`. Si `fn` no lanza nada, el test falla.
 */
export function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba que la función lanzara un error');
}
