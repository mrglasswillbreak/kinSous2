import { randomBytes, createHash } from "crypto";
import { sql } from "./db";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function sendAccountLink(
  userId: string,
  email: string,
  kind: "RESET" | "EMAIL",
) {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.NEXT_PUBLIC_SITE_URL
  )
    throw new Error("Account email service is not configured");
  const token = randomBytes(32).toString("hex");
  const hash = tokenHash(token);
  await sql`INSERT INTO auth_tokens(id,user_id,kind,email,expires_at) VALUES(${hash},${userId},${kind},${email},now()+interval '30 minutes')`;
  const link = new URL("/reset-password", process.env.NEXT_PUBLIC_SITE_URL);
  link.searchParams.set("token", token);
  link.searchParams.set("kind", kind);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": hash,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject:
        kind === "RESET"
          ? "Reset your KinSous password"
          : "Verify your KinSous email",
      text: `Open this link to ${kind === "RESET" ? "reset your password" : "verify your email address"}: ${link.href}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Could not send verification email. Please retry.");
}
