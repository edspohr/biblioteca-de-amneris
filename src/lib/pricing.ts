// Precios aprobados por Amneris el 2026-09-01 (borrador v1 firmado).
// Ver memory/project-pricing.md para el contexto de negocio.

export const MONTHLY_PRICE_CLP = 1990;
export const ANNUAL_PRICE_CLP = 29900;

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
