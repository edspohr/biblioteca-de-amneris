import type { Anexo } from "@/lib/schema";

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Collapsed by default so supplementary material never competes with the
// recipe itself.
export function AnexosBlock({ anexos }: { anexos: Anexo[] }) {
  if (anexos.length === 0) return null;
  return (
    <details className="receta__anexos">
      <summary>
        <span className="receta__anexos-title">Información adicional</span>
        <span className="receta__anexos-count">{anexos.length}</span>
      </summary>
      <ul className="anexos" role="list">
        {anexos.map((a) => (
          <li key={a.id} className={`anexo anexo--${a.tipo}`}>
            <h3 className="anexo__title">{a.titulo}</h3>
            {a.tipo === "texto" && <p className="anexo__texto">{a.texto}</p>}
            {a.tipo === "imagen" && a.url && (
              <figure className="anexo__figure">
                <a href={a.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.texto || a.titulo} loading="lazy" />
                </a>
                {a.texto && <figcaption className="muted">{a.texto}</figcaption>}
              </figure>
            )}
            {a.tipo === "documento" && a.url && (
              <a className="anexo__file" href={a.url} target="_blank" rel="noreferrer">
                <span aria-hidden="true">📄</span> {a.nombreArchivo ?? "Abrir documento"}
                {a.bytes ? <span className="muted"> · {formatBytes(a.bytes)}</span> : null}
              </a>
            )}
            {a.tipo === "enlace" && a.url && (
              <a className="anexo__file" href={a.url} target="_blank" rel="noreferrer">
                <span aria-hidden="true">🔗</span> {dominio(a.url)} ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
