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

export function buildHeaders(creds: Credentials): Record<string, string> {
  if (creds.mode === "anthropic") {
    return {
      "x-ai-provider": "anthropic",
      "x-anthropic-api-key": creds.apiKey,
    };
  }
  const headers: Record<string, string> = {
    "x-ai-provider": "bedrock",
    "x-aws-access-key-id": creds.accessKeyId,
    "x-aws-secret-access-key": creds.secretAccessKey,
    "x-aws-region": creds.region,
  };
  if (creds.sessionToken) headers["x-aws-session-token"] = creds.sessionToken;
  return headers;
}
