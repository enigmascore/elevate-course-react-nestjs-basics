/**
 * Minimal MailHog HTTP API client for the integration tests - the same
 * idea as the Playwright support module at /e2e/support/mailhog.ts.
 */
const MAILHOG_URL = process.env.MAILHOG_URL ?? "http://localhost:8025";

export async function clearMessages(): Promise<void> {
  await fetch(`${MAILHOG_URL}/api/v1/messages`, { method: "DELETE" });
}

interface MailhogMessage {
  Content: { Body: string; Headers: Record<string, string[]> };
}

export async function waitForMessageTo(email: string, timeoutMs = 10000): Promise<MailhogMessage> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`,
    );
    const data = (await res.json()) as { items: MailhogMessage[] };
    if (data.items.length > 0) {
      return data.items[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No MailHog message to ${email} within ${timeoutMs}ms`);
}

/** Pull the first http(s) link out of a message body ( quoted-printable safe ). */
export function extractLink(message: MailhogMessage): string {
  const body = message.Content.Body.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  const match = body.match(/https?:\/\/[^\s]+/);
  if (!match) {
    throw new Error("No link found in email body");
  }
  return match[0];
}
