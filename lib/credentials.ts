import type { Credentials } from "./types";

const STORAGE_KEY = "company-agent.credentials.v1";

export function saveCredentials(creds: Credentials): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function loadCredentials(): Credentials | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Credentials;
    if (parsed.mode === "anthropic" && parsed.apiKey) return parsed;
    if (
      parsed.mode === "bedrock" &&
      parsed.accessKeyId &&
      parsed.secretAccessKey &&
      parsed.region
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
