import { getSession } from "./auth";
export async function getAdmin() {
  const session = await getSession();
  return session &&
    (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .includes(session.userId)
    ? session
    : null;
}
