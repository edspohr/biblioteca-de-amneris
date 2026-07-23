import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appCheck: AppCheck | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_FIREBASE_* en el entorno. Revisa .env.local.example."
    );
  }
  const app = getApps().length ? getApp() : initializeApp(config);

  // App Check must be initialized before any other Firebase service call so
  // outbound requests carry an App Check token. Browser-only: SSR/RSC never
  // instantiates the client SDK.
  if (typeof window !== "undefined" && !appCheck) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    const debugToken = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;

    if (debugToken) {
      // Debug tokens let localhost bypass reCAPTCHA. Register the token in
      // Firebase Console → App Check → Apps → Manage debug tokens.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }

    if (siteKey) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        // Non-fatal in dev — Auth still works without App Check unless
        // enforcement is turned on in the console.
        // eslint-disable-next-line no-console
        console.warn("[app-check] init failed:", err);
      }
    }
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
