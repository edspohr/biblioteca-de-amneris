import type { Nutrientes } from "@/lib/schema";

// Grid 2×4 con los 8 valores de Nutrientes. Rinde solo si están los 8;
// caso contrario devuelve null (el llamador decide si mostrar aviso).
export function NutrientesGrid({ nutrientes }: { nutrientes: Nutrientes }) {
  const items: { label: string; value: string }[] = [
    { label: "Energía", value: `${nutrientes.energiaKcal} kcal` },
    { label: "Proteínas", value: `${nutrientes.proteinasG} g` },
    { label: "Carbohidratos", value: `${nutrientes.carbohidratosG} g` },
    { label: "Grasas", value: `${nutrientes.grasasG} g` },
    { label: "Hierro", value: `${nutrientes.hierroMg} mg` },
    { label: "Calcio", value: `${nutrientes.calcioMg} mg` },
    { label: "Fibra", value: `${nutrientes.fibraG} g` },
    { label: "Sodio", value: `${nutrientes.sodioMg} mg` },
  ];
  return (
    <div className="nutrientes-grid">
      <ul className="nutrientes-grid__list">
        {items.map((it) => (
          <li key={it.label} className="nutrientes-grid__item">
            <span className="nutrientes-grid__label">{it.label}</span>
            <span className="nutrientes-grid__value">{it.value}</span>
          </li>
        ))}
      </ul>
      {nutrientes.aproximado && (
        <p className="nutrientes-grid__disclaimer">
          Valores aproximados por porción cocida. Consultar con nutricionista antes de tomarlos como referencia.
        </p>
      )}
    </div>
  );
}
