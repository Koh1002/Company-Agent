import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { getAgent } from "./agents/registry";
import { resolveModel, CredentialError } from "./provider";
import { loadCredentials } from "./credentials";

/**
 * Runs the agent loop entirely in the browser so the app can be served as
 * a static bundle (GitHub Pages, S3, etc.) with no backend. Credentials
 * never leave the browser.
 */
export class LocalAgentChatTransport implements ChatTransport<UIMessage> {
  constructor(private readonly agentId: string) {}

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    const agent = getAgent(this.agentId);
    if (!agent) {
      throw new Error(`不明なエージェントです: ${this.agentId}`);
    }

    const creds = loadCredentials();
    let model;
    try {
      model = resolveModel(creds);
    } catch (e) {
      if (e instanceof CredentialError) {
        throw new Error(e.message);
      }
      throw e;
    }

    const result = streamText({
      model,
      system: agent.systemPrompt,
      tools: agent.tools,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(agent.maxSteps ?? 8),
      abortSignal,
    });

    return result.toUIMessageStream();
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
