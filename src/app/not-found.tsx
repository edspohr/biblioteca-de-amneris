import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>No encontrado</h1>
      <p>No pudimos encontrar lo que estabas buscando.</p>
      <p>
        <Link href="/">← Volver al inicio</Link>
      </p>
    </>
  );
}
