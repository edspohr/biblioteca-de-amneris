import { verifySession } from "@/lib/auth/session";
import { NavBar } from "./nav-bar";

export async function NavBarServer() {
  const user = await verifySession();
  return <NavBar user={user} />;
}
