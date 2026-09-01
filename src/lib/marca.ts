/**
 * Marca y catálogo de secciones de La Biblioteca de Amneris.
 *
 * La app entera lee los nombres, bajadas y fechas de lanzamiento desde aquí.
 * Cuando la sección "Batch Cooking Pollo" cambie de nombre (está previsto
 * reemplazarlo por un concepto más cálido en español), basta con editar
 * SECCION_PROXIMA.nombre y todas las superficies quedan al día.
 */

export const BRAND_NAME = "La Biblioteca de Amneris";
export const BRAND_TAGLINE =
  "Una suscripción, toda la biblioteca — recetas y planes para papás y mamás de bebés de 0 a 2 años.";
export const NICHO_LABEL = "para papás y mamás de bebés de 0 a 2 años";

export interface Seccion {
  id: string;
  nombre: string;
  bajada: string;
  problema: string;
  lanzamientoISO: string | null;
  lanzamientoLabel: string;
  disponible: boolean;
}

export const SECCION_ACTIVA: Seccion = {
  id: "bocaditos-del-corazon",
  nombre: "Bocaditos del Corazón",
  bajada: "recetas rápidas y nutritivas",
  problema:
    "para cuando no tienes nada preparado y tu bebé ya tiene hambre — recetas resueltas en minutos.",
  lanzamientoISO: "2026-09-01",
  lanzamientoLabel: "Disponible hoy",
  disponible: true,
};

export const SECCION_PROXIMA: Seccion = {
  id: "batch-cooking-pollo",
  // Nombre provisional. Al cambiarlo aquí se propaga a landing, próximos y copy.
  nombre: "Batch Cooking Pollo",
  bajada: "cocina 1 día, alimenta a tu bebé 1 mes",
  problema:
    "para dejar resuelta la alimentación de todo un mes en una sola tarde de cocina.",
  lanzamientoISO: "2026-10-05",
  lanzamientoLabel: "5 de octubre",
  disponible: false,
};

export const SECCION_FUTURA: Seccion = {
  id: "batch-cooking-pescado",
  nombre: "Batch Cooking Pescado",
  bajada: "el mismo método, ahora con pescado",
  problema:
    "para incorporar pescado azul y blanco al mes de tu bebé sin tener que pensarlo cada día.",
  lanzamientoISO: null,
  lanzamientoLabel: "Noviembre 2026",
  disponible: false,
};

export const SECCIONES: Seccion[] = [
  SECCION_ACTIVA,
  SECCION_PROXIMA,
  SECCION_FUTURA,
];
