/**
 * Seed inicial de utensilios de batch cooking. Basado en un set típico de
 * equipamiento para preparar 30 porciones congeladas. La lista definitiva
 * (B3-P1 del recetario Cocina en un Día) llega en Fase 2 con el import del
 * docx y podrá reemplazar o completar estos valores; hasta entonces, esta
 * base habilita la sección "Antes de empezar" del plan.
 *
 * Idempotente. Corre siempre --dry-run primero.
 *
 * Uso:
 *   npm run seed:utensilios -- --dry-run
 *   npm run seed:utensilios -- --apply
 */
import { utensilioSchema, type Utensilio } from "../src/lib/schema";
import { db, isApply, requireRecentBackup } from "./lib/admin";

const UTENSILIOS: Utensilio[] = [
  utensilioSchema.parse({
    id: "tarrito-vidrio-150ml",
    nombre: "Tarritos de vidrio 150ml",
    tipo: "envase",
    paraQue: "Guardar 1 porción de Etapa 1 en refrigerador o congelador.",
    aptoCongelador: true,
    capacidad: "150 ml",
  }),
  utensilioSchema.parse({
    id: "tarrito-vidrio-250ml",
    nombre: "Tarritos de vidrio 250ml",
    tipo: "envase",
    paraQue: "Guardar 1 porción de Etapa 2 o 3.",
    aptoCongelador: true,
    capacidad: "250 ml",
  }),
  utensilioSchema.parse({
    id: "cubiteras-silicona",
    nombre: "Cubiteras de silicona",
    tipo: "envase",
    paraQue: "Congelar puré en cubos individuales (10-15 g cada uno).",
    aptoCongelador: true,
    capacidad: "10-15 ml por cubo",
  }),
  utensilioSchema.parse({
    id: "bolsas-hermeticas-congelador",
    nombre: "Bolsas herméticas para congelador",
    tipo: "consumible",
    paraQue: "Guardar porciones ya congeladas (IQF) sin ocupar espacio de tarritos.",
    aptoCongelador: true,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "bandeja-metalica",
    nombre: "Bandeja metálica",
    tipo: "herramienta",
    paraQue: "Enfriado rápido y congelación individual (IQF) de bocaditos.",
    aptoCongelador: true,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "papel-horno",
    nombre: "Papel de horno",
    tipo: "consumible",
    paraQue: "Cubrir bandejas para hornear y evitar que se pegue.",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "procesadora-licuadora",
    nombre: "Procesadora o licuadora",
    tipo: "electrodomestico",
    paraQue: "Triturar purés y mezclar masas de manera homogénea.",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "balanza-cocina",
    nombre: "Balanza de cocina",
    tipo: "electrodomestico",
    paraQue: "Pesar porciones exactas (fundamental para el rendimiento del mes).",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "olla-vaporera",
    nombre: "Olla con vaporera",
    tipo: "herramienta",
    paraQue: "Cocer al vapor verduras y proteínas manteniendo nutrientes.",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "sarten-antiadherente",
    nombre: "Sartén antiadherente",
    tipo: "herramienta",
    paraQue: "Saltear y sellar sin necesidad de aceite abundante.",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "espatula-silicona",
    nombre: "Espátula de silicona",
    tipo: "herramienta",
    paraQue: "Mezclar y raspar sin dañar los recipientes.",
    aptoCongelador: false,
    capacidad: null,
  }),
  utensilioSchema.parse({
    id: "etiquetas-congelador",
    nombre: "Etiquetas para congelador",
    tipo: "consumible",
    paraQue: "Marcar fecha y contenido de cada porción (base de la rotación mensual).",
    aptoCongelador: true,
    capacidad: null,
  }),
];

async function main() {
  const apply = isApply();
  if (apply) requireRecentBackup();

  console.log(
    `Seed utensilios (${apply ? "APPLY" : "dry-run"}): ${UTENSILIOS.length} docs`
  );
  for (const u of UTENSILIOS) {
    console.log(`  · ${u.id} — ${u.nombre} (${u.tipo}, ${u.aptoCongelador ? "apto" : "no apto"} congelador)`);
  }

  if (!apply) {
    console.log("\nDry-run terminado. Corre con --apply.");
    return;
  }

  const database = db();
  for (const u of UTENSILIOS) {
    await database.collection("utensilios").doc(u.id).set(u);
  }
  console.log(`\n✓ ${UTENSILIOS.length} utensilios escritos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
