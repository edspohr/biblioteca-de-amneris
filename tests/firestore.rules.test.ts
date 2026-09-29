/**
 * Firestore rules tests. Runs against a local emulator started by
 * `npm run test:rules` (which uses `firebase emulators:exec`).
 *
 * Coverage matrix: {anonymous, user, other-user, superadmin} × {each
 * public collection, usuarios/{self}, usuarios/{other}} × {read, write}.
 *
 * The rules DENY every client write on public collections regardless of
 * role — mutations only pass through the Next.js API using the Admin SDK,
 * which bypasses rules. These tests confirm that contract holds.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  setLogLevel,
} from "firebase/firestore";

const PROJECT_ID = "biblioteca-amneris-test";
let env: RulesTestEnvironment;

async function setup() {
  setLogLevel("error");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8081,
    },
  });
}

async function teardown() {
  await env.cleanup();
}

function anon() {
  return env.unauthenticatedContext().firestore();
}
function user(uid: string) {
  return env.authenticatedContext(uid).firestore();
}

async function seedAsAdmin(cb: (db: FirebaseFirestore.Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await cb(ctx.firestore() as any);
  });
}

// -- Test runner (tiny) ------------------------------------------------------
type TestFn = () => Promise<void>;
const tests: { name: string; fn: TestFn }[] = [];
function test(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

async function main() {
  await setup();
  let failed = 0;
  for (const t of tests) {
    try {
      // Reset between tests so state doesn't leak.
      await env.clearFirestore();
      await t.fn();
      // eslint-disable-next-line no-console
      console.log(`  ✓ ${t.name}`);
    } catch (err) {
      failed++;
      // eslint-disable-next-line no-console
      console.error(`  ✗ ${t.name}\n    ${(err as Error).message}`);
    }
  }
  await teardown();
  // eslint-disable-next-line no-console
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  process.exit(failed ? 1 : 0);
}

// -- Public collections: read allowed, all client writes denied --------------

const PUBLIC_COLLECTIONS = [
  "etapas",
  "porciones_texturas",
  "ingredientes",
  "alergenos",
  "tecnicas",
  "menus",
  "recetas",
  "colecciones",
  "metodos_conservacion",
  "utensilios",
  "planes",
  "guias",
];

for (const col of PUBLIC_COLLECTIONS) {
  test(`anon can read ${col}`, async () => {
    await seedAsAdmin(async (db) => {
      await setDoc(doc(db, col, "sample"), { id: "sample" });
    });
    await assertSucceeds(getDocs(collection(anon(), col)));
  });

  test(`anon CANNOT write ${col}`, async () => {
    await assertFails(setDoc(doc(anon(), col, "sample"), { id: "sample" }));
  });

  test(`authenticated user CANNOT write ${col}`, async () => {
    await assertFails(setDoc(doc(user("mama-uid"), col, "x"), { id: "x" }));
  });
}

// -- usuarios: owner-read + superadmin-read; ALL writes server-only ----------

test("user can read their own usuarios doc", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "usuarios", "mama-uid"), { email: "m@x" });
  });
  await assertSucceeds(getDoc(doc(user("mama-uid"), "usuarios", "mama-uid")));
});

test("user CANNOT write their own usuarios doc (server-only)", async () => {
  await assertFails(
    setDoc(doc(user("mama-uid"), "usuarios", "mama-uid"), { pref: "x" })
  );
});

test("user CANNOT read another usuarios doc", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "usuarios", "otra-mama"), { email: "otra@x" });
  });
  await assertFails(getDoc(doc(user("mama-uid"), "usuarios", "otra-mama")));
});

test("user CANNOT write another usuarios doc", async () => {
  await assertFails(
    setDoc(doc(user("mama-uid"), "usuarios", "otra-mama"), { pref: "x" })
  );
});

test("anon CANNOT read any usuarios doc", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "usuarios", "someone"), { email: "s@x" });
  });
  await assertFails(getDoc(doc(anon(), "usuarios", "someone")));
});

test("superadmin CAN read any usuarios doc", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "usuarios", "otra-mama"), { email: "otra@x" });
  });
  const su = env.authenticatedContext("su-uid", { superadmin: true }).firestore();
  await assertSucceeds(getDoc(doc(su, "usuarios", "otra-mama")));
});

test("superadmin CANNOT write usuarios doc (server-only)", async () => {
  const su = env.authenticatedContext("su-uid", { superadmin: true }).firestore();
  await assertFails(setDoc(doc(su, "usuarios", "otra-mama"), { plan: "x" }));
});

// -- metrics: server-only -----------------------------------------------------

test("anon CANNOT read metrics", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "metrics", "registrations"), { total: 1 });
  });
  await assertFails(getDoc(doc(anon(), "metrics", "registrations")));
});

test("anon CANNOT write metrics", async () => {
  await assertFails(
    setDoc(doc(anon(), "metrics", "registrations"), { total: 1 })
  );
});

test("superadmin CANNOT read metrics from client", async () => {
  await seedAsAdmin(async (db) => {
    await setDoc(doc(db, "metrics", "registrations"), { total: 1 });
  });
  const su = env.authenticatedContext("su-uid", { superadmin: true }).firestore();
  await assertFails(getDoc(doc(su, "metrics", "registrations")));
});

// -- Default deny for unknown paths ------------------------------------------

test("anon CANNOT read arbitrary path", async () => {
  await assertFails(getDoc(doc(anon(), "invented", "id")));
});
test("user CANNOT write arbitrary path", async () => {
  await assertFails(setDoc(doc(user("u"), "invented", "id"), { x: 1 }));
});

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
