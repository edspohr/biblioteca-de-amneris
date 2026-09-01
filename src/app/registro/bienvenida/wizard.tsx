"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AttributionSource, Etapa } from "@/lib/schema";
import { computeEtapaFromBirthdate, monthsSince } from "@/lib/etapa-activa/age";
import { TRIAL_DAYS } from "@/lib/schema";

type Step = 1 | 2 | 3;

interface Initial {
  displayName: string;
  babyName: string;
  babyBirthdate: string;
  phone: string;
  source: AttributionSource | null;
  consentAccepted: boolean;
}

const SOURCES: { value: AttributionSource; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "recomendacion", label: "Me la recomendaron" },
  { value: "flyer", label: "Flyer o QR" },
  { value: "google", label: "Buscando en Google" },
  { value: "otro", label: "Otro" },
];

export function OnboardingWizard({
  etapas,
  initial,
}: {
  etapas: Etapa[];
  initial: Initial;
}) {
  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [babyName, setBabyName] = useState(initial.babyName);
  const [babyBirthdate, setBabyBirthdate] = useState(initial.babyBirthdate);
  const [phone, setPhone] = useState(initial.phone);
  const [source, setSource] = useState<AttributionSource | "">(initial.source ?? "");
  const [consent, setConsent] = useState(initial.consentAccepted);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const etapaSugerida = useMemo(() => {
    if (!babyBirthdate) return null;
    return computeEtapaFromBirthdate(babyBirthdate, etapas);
  }, [babyBirthdate, etapas]);

  const trialEndText = useMemo(() => formatTrialEnd(TRIAL_DAYS), []);

  async function saveStep(patch: Record<string, unknown>): Promise<boolean> {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "No pudimos guardar tus datos.");
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!babyBirthdate) {
      setError("La fecha de nacimiento de tu bebé es necesaria para ajustar las recetas.");
      return;
    }
    if (!consent) {
      setError("Necesitamos tu autorización para guardar estos datos.");
      return;
    }
    const ok = await saveStep({
      displayName: displayName.trim() || null,
      babyName: babyName.trim() || null,
      babyBirthdate,
      consent: {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: new Date().toISOString().slice(0, 10),
      },
    });
    if (ok) setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    const patch: Record<string, unknown> = {};
    if (phone.trim()) patch.phone = phone.trim();
    if (source) patch.source = source;
    const ok = Object.keys(patch).length ? await saveStep(patch) : true;
    if (ok) setStep(3);
  }

  async function handleFinish() {
    const ok = await saveStep({
      onboardingCompletedAt: new Date().toISOString(),
      ...(etapaSugerida
        ? {
            manualEtapaOverride: null, // usar auto-follow por defecto
          }
        : {}),
    });
    if (ok) window.location.assign("/libro");
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Progress step={step} />

      {step === 1 && (
        <form onSubmit={handleStep1} className="card" style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
          <h1 style={{ margin: 0 }}>Cuéntame de tu bebé</h1>
          <p style={{ color: "var(--color-ink-muted)", margin: "0 0 0.5rem" }}>
            Con la fecha de nacimiento te muestro la etapa que corresponde a
            su edad y voy avanzando contigo.
          </p>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Tu nombre</span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como quieres que te llamemos"
              style={{ padding: "0.6rem 0.75rem" }}
            />
            <small style={{ color: "var(--color-ink-muted)" }}>
              Lo trajimos de tu cuenta de Google — puedes editarlo si quieres.
            </small>
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Nombre del bebé (opcional)</span>
            <input
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              style={{ padding: "0.6rem 0.75rem" }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Fecha de nacimiento del bebé</span>
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={babyBirthdate}
              onChange={(e) => setBabyBirthdate(e.target.value)}
              style={{ padding: "0.6rem 0.75rem", minHeight: 44 }}
            />
            {babyBirthdate && etapaSugerida && (
              <small style={{ color: "var(--color-ink-muted)" }}>
                {monthsSince(babyBirthdate)} meses cumplidos ·{" "}
                <strong>{etapaSugerida.nombre}</strong>
              </small>
            )}
          </label>

          <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: "0.25rem", minWidth: 20, minHeight: 20 }}
            />
            <span style={{ fontSize: "0.9rem" }}>
              Autorizo el uso de estos datos según la{" "}
              <Link href="/privacidad" target="_blank">política de privacidad</Link>.
            </span>
          </label>

          {error && <p role="alert" style={{ color: "var(--color-danger, #b3261e)" }}>{error}</p>}

          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
            style={{ width: "100%", minHeight: 44 }}
          >
            {saving ? "Guardando…" : "Continuar"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="card" style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
          <h1 style={{ margin: 0 }}>Un par de cosas más</h1>
          <p style={{ color: "var(--color-ink-muted)", margin: "0 0 0.5rem" }}>
            Nos ayuda saber cómo llegaste. Puedes saltar esta parte si prefieres.
          </p>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>WhatsApp (opcional)</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+56 9 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ padding: "0.6rem 0.75rem" }}
            />
          </label>

          <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: "0.4rem" }}>
            <legend>¿Cómo nos conociste?</legend>
            {SOURCES.map((s) => (
              <label key={s.value} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="source"
                  value={s.value}
                  checked={source === s.value}
                  onChange={() => setSource(s.value)}
                  style={{ minWidth: 20, minHeight: 20 }}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </fieldset>

          {error && <p role="alert" style={{ color: "var(--color-danger, #b3261e)" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setStep(3)}
              disabled={saving}
              style={{ flex: 1, minHeight: 44 }}
            >
              Saltar
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
              style={{ flex: 2, minHeight: 44 }}
            >
              {saving ? "Guardando…" : "Continuar"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "0.75rem" }}>
          <h1 style={{ margin: 0 }}>Bienvenida a la biblioteca</h1>
          <p>
            {babyName ? `${babyName} está en la ` : "Tu bebé está en la "}
            <strong>{etapaSugerida?.nombre ?? "primera etapa"}</strong>. Voy a
            ajustar las texturas y porciones automáticamente y voy avanzando
            contigo mes a mes.
          </p>
          <p>
            Tienes <strong>{TRIAL_DAYS} días de acceso completo</strong>, hasta{" "}
            <strong>{trialEndText}</strong>. Sin tarjeta, sin compromiso, con
            todo lo que hay hoy en la biblioteca.
          </p>
          {error && <p role="alert" style={{ color: "var(--color-danger, #b3261e)" }}>{error}</p>}
          <button
            type="button"
            className="button button--primary"
            onClick={handleFinish}
            disabled={saving}
            style={{ width: "100%", minHeight: 44 }}
          >
            {saving ? "Preparando todo…" : "Empezar a explorar"}
          </button>
        </div>
      )}
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const dots = [1, 2, 3] as const;
  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
      {dots.map((n) => (
        <span
          key={n}
          aria-current={n === step ? "step" : undefined}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background:
              n === step
                ? "var(--etapa-primary, var(--color-accent))"
                : "var(--color-ink-muted)",
            opacity: n === step ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function formatTrialEnd(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(d);
}
