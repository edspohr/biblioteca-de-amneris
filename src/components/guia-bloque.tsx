import type { Bloque } from "@/lib/schema";

// Renderer discriminado de bloques de guía (párrafo, lista, tabla, aviso).
// Sin dependencias externas.
export function GuiaBloque({ bloque }: { bloque: Bloque }) {
  switch (bloque.kind) {
    case "parrafo":
      return <p className="guia-bloque guia-bloque--parrafo">{bloque.texto}</p>;
    case "lista":
      return bloque.ordenada ? (
        <ol className="guia-bloque guia-bloque--lista">
          {bloque.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      ) : (
        <ul className="guia-bloque guia-bloque--lista">
          {bloque.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "tabla":
      return (
        <div className="guia-bloque guia-bloque--tabla">
          <table>
            <thead>
              <tr>
                {bloque.columnas.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloque.filas.map((fila, r) => (
                <tr key={r}>
                  {fila.map((cell, c) => (
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "aviso":
      return (
        <div
          className={`guia-bloque guia-bloque--aviso guia-bloque--aviso-${bloque.tipo}`}
        >
          <span className="guia-bloque__aviso-icon" aria-hidden="true">
            {bloque.tipo === "tip" ? "💡" : "⚠️"}
          </span>
          <span>{bloque.texto}</span>
        </div>
      );
  }
}
