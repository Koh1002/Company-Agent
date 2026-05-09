import type { Tool } from "ai";

export type ProviderMode = "anthropic" | "bedrock";

export type AnthropicCredentials = {
  mode: "anthropic";
  apiKey: string;
};

export type BedrockCredentials = {
  mode: "bedrock";
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

export type Credentials = AnthropicCredentials | BedrockCredentials;

export type AgentCategory = "manufacturer" | "wholesale" | "retail" | "common";

export type AgentDef = {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  systemPrompt: string;
  tools: Record<string, Tool>;
  samplePrompts: string[];
  maxSteps?: number;
};
