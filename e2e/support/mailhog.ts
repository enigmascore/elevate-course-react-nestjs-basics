/**
 * MailHog support for the e2e tests - poll for an email, pull the link
 * out of it, clear the inbox. MailHog's HTTP API runs on :8025
 * ( docker-compose ); the web UI at http://localhost:8025 shows the
 * same messages to a human.
 */
const MAILHOG_URL = process.env.MAILHOG_URL ?? "http://localhost:8025";

export interface MailhogMessage {
  Content: { Body: string; Headers: Record<string, string[]> };
}

export async function clearMessages(): Promise<void> {
  await fetch(`${MAILHOG_URL}/api/v1/messages`, { method: "DELETE" });
}

export async function waitForMessageTo(
  email: string,
  timeoutMs = 15_000,
): Promise<MailhogMessage> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const data = (await res.json()) as { items: MailhogMessage[] };
    if (data.items.length > 0) {
      return data.items[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No MailHog message to ${email} within ${timeoutMs}ms`);
}

/** First http(s) link in the body ( undoes quoted-printable wrapping ). */
export function extractLink(message: MailhogMessage): string {
  const body = message.Content.Body.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  const match = body.match(/https?:\/\/[^\s]+/);
  if (!match) {
    throw new Error("No link found in email body");
  }
  return match[0];
}
