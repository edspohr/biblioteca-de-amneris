// Precios aprobados por Amneris el 2026-09-01.
// $1.990/mes o $19.990/año (10 meses efectivos: ahorra 2 meses).
// Trial de 30 días sin tarjeta.

export const MONTHLY_PRICE_CLP = 1990;
export const ANNUAL_PRICE_CLP = 19990;
export const ANNUAL_SAVINGS_MONTHS = 2;

// Suggested default when a superadmin gifts a cortesía access: 1 mes × precio
// mensual. El superadmin puede editar el monto en el formulario.
export function defaultCortesiaValueCLP(months = 1): number {
  return MONTHLY_PRICE_CLP * months;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
