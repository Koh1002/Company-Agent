import { createAnthropic } from "@ai-sdk/anthropic";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { LanguageModel } from "ai";

export class CredentialError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "CredentialError";
  }
}

const ANTHROPIC_MODEL_ID = "claude-sonnet-4-5";
const BEDROCK_MODEL_ID = "anthropic.claude-sonnet-4-5-20250929-v1:0";

export function resolveModel(headers: Headers): LanguageModel {
  const provider = headers.get("x-ai-provider");

  if (provider === "anthropic") {
    const apiKey = headers.get("x-anthropic-api-key");
    if (!apiKey) {
      throw new CredentialError("Anthropic API キーがリクエストに含まれていません");
    }
    return createAnthropic({ apiKey })(ANTHROPIC_MODEL_ID);
  }

  if (provider === "bedrock") {
    const accessKeyId = headers.get("x-aws-access-key-id");
    const secretAccessKey = headers.get("x-aws-secret-access-key");
    const region = headers.get("x-aws-region");
    const sessionToken = headers.get("x-aws-session-token") ?? undefined;
    if (!accessKeyId || !secretAccessKey || !region) {
      throw new CredentialError("AWS Bedrock 資格情報が不足しています (access key / secret / region)");
    }
    return createAmazonBedrock({
      region,
      accessKeyId,
      secretAccessKey,
      sessionToken,
    })(BEDROCK_MODEL_ID);
  }

  throw new CredentialError("プロバイダが指定されていません (x-ai-provider ヘッダ)");
}
