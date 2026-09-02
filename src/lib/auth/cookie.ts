/**
 * Session cookie name — MUST be exactly `__session`.
 *
 * Firebase Hosting strips every cookie EXCEPT one literally named `__session`
 * when forwarding a request through a rewrite to Cloud Run / App Hosting.
 * If this name changes, the server will stop seeing the cookie on every
 * request after the initial Set-Cookie and the app will loop between /ingresar
 * and any protected route.
 *
 * Docs: https://firebase.google.com/docs/hosting/manage-cache#using_cookies
 *
 * This module is intentionally free of server-only imports so the Edge
 * middleware and Node-runtime code can both consume the same constant.
 */
export const SESSION_COOKIE_NAME = "__session";
