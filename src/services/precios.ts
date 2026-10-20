/** Calcula el precio luego de aplicar un porcentaje de descuento. */
export function calcularPrecioFinal(precio: number, descuento: number): number {
  //* Precio
  if (!Number.isFinite(precio) || precio < 0) {
    throw new RangeError("Precio invalido");
  }

  //* Descuento
  if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
    throw new RangeError("Descuento invalido");
  }

  return precio - (precio * descuento) / 100;
}
