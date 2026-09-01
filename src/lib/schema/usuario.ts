import { z } from "zod";

export const CONSENT_VERSION = "2026-09-01";
export const TRIAL_DAYS = 30;

export const attributionSource = z.enum([
  "instagram",
  "recomendacion",
  "flyer",
  "google",
  "otro",
]);
export type AttributionSource = z.infer<typeof attributionSource>;

export const subscriptionState = z.enum([
  "trial",
  "activa",
  "vencida",
  "cortesia",
]);
export type SubscriptionState = z.infer<typeof subscriptionState>;

export const paymentProvider = z.enum(["stripe", "mercadopago", "flow"]);
export type PaymentProvider = z.infer<typeof paymentProvider>;

// ISO date-only string, YYYY-MM-DD.
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser una fecha con formato AAAA-MM-DD");

// ISO datetime string in UTC (Firestore timestamps get serialized to ISO here).
export const isoDateTime = z.string().min(1);

export const consentSchema = z.object({
  accepted: z.boolean(),
  acceptedAt: isoDateTime.nullable(),
  version: z.string(),
});
export type Consent = z.infer<typeof consentSchema>;

export const subscriptionSchema = z.object({
  state: subscriptionState,
  trialStartAt: isoDateTime.nullable(),
  trialEndAt: isoDateTime.nullable(),
  cortesiaEndAt: isoDateTime.nullable(),
  cortesiaValueCLP: z.number().int().nonnegative().nullable(),
  cortesiaNote: z.string().nullable(),
  provider: paymentProvider.nullable(),
  externalId: z.string().nullable(),
  plan: z.string().nullable(),
  renewsAt: isoDateTime.nullable(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const manualEtapaOverrideSchema = z.object({
  etapaId: z.string().min(1),
  setAt: isoDateTime,
});
export type ManualEtapaOverride = z.infer<typeof manualEtapaOverrideSchema>;

export const usuarioSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  phone: z.string().nullable(),
  babyName: z.string().nullable(),
  babyBirthdate: isoDate.nullable(),
  source: attributionSource.nullable(),
  consent: consentSchema,
  onboardingCompletedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  subscription: subscriptionSchema,
  manualEtapaOverride: manualEtapaOverrideSchema.nullable(),
  superadmin: z.boolean(),
  // Mirror fields carried over from the existing `usuarios/{uid}` doc so we
  // don't lose the invite-flow columns already rendered in /admin/usuarios.
  providers: z.array(z.string()).default([]),
  disabled: z.boolean().default(false),
  lastSignInAt: isoDateTime.nullable().optional(),
});
export type Usuario = z.infer<typeof usuarioSchema>;

// Fields the client is allowed to PATCH about themselves via /api/usuarios/me.
export const usuarioSelfPatchSchema = z
  .object({
    displayName: z.string().min(1).max(120).nullable().optional(),
    phone: z.string().min(3).max(40).nullable().optional(),
    babyName: z.string().min(1).max(80).nullable().optional(),
    babyBirthdate: isoDate.nullable().optional(),
    source: attributionSource.nullable().optional(),
    consent: consentSchema.optional(),
    manualEtapaOverride: manualEtapaOverrideSchema.nullable().optional(),
    onboardingCompletedAt: isoDateTime.nullable().optional(),
  })
  .strict();
export type UsuarioSelfPatch = z.infer<typeof usuarioSelfPatchSchema>;

export function emptyConsent(): Consent {
  return { accepted: false, acceptedAt: null, version: CONSENT_VERSION };
}

export function emptySubscription(): Subscription {
  return {
    state: "trial",
    trialStartAt: null,
    trialEndAt: null,
    cortesiaEndAt: null,
    cortesiaValueCLP: null,
    cortesiaNote: null,
    provider: null,
    externalId: null,
    plan: null,
    renewsAt: null,
  };
}
