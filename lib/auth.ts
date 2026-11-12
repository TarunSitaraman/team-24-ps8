export const SESSION_COOKIE = "app_session";

export async function hashPasscode(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`srm-hackathon:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const passcode = process.env.APP_PASSCODE?.trim();
  // If no passcode is configured, allow open local demo access
  if (!passcode) return true;
  if (!cookieValue) return false;
  return cookieValue === (await hashPasscode(passcode));
}
