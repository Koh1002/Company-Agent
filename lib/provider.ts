import { createAnthropic } from "@ai-sdk/anthropic";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { LanguageModel } from "ai";
import type { Credentials } from "./types";

export class CredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialError";
  }
}

const ANTHROPIC_MODEL_ID = "claude-sonnet-4-5";
const BEDROCK_MODEL_ID = "anthropic.claude-sonnet-4-5-20250929-v1:0";

/**
 * Resolves an AI SDK model directly in the browser from localStorage
 * credentials. No server is involved — the static build talks to the
 * provider directly.
 */
export function resolveModel(creds: Credentials | null): LanguageModel {
  if (!creds) {
    throw new CredentialError("資格情報が設定されていません");
  }

  if (creds.mode === "anthropic") {
    if (!creds.apiKey) {
      throw new CredentialError("Anthropic API キーが入力されていません");
    }
    return createAnthropic({
      apiKey: creds.apiKey,
      // Required to call the Anthropic API directly from the browser.
      headers: { "anthropic-dangerous-direct-browser-access": "true" },
    })(ANTHROPIC_MODEL_ID);
  }

  if (creds.mode === "bedrock") {
    if (!creds.accessKeyId || !creds.secretAccessKey || !creds.region) {
      throw new CredentialError(
        "AWS Bedrock 資格情報が不足しています (access key / secret / region)",
      );
    }
    return createAmazonBedrock({
      region: creds.region,
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    })(BEDROCK_MODEL_ID);
  }

  throw new CredentialError("不明なプロバイダです");
}
