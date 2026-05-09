import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { getAgent } from "@/lib/agents/registry";
import { CredentialError, resolveModel } from "@/lib/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  const agent = getAgent(agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${agentId}` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  let model;
  try {
    model = resolveModel(req.headers);
  } catch (e) {
    if (e instanceof CredentialError) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    throw e;
  }

  const body = (await req.json()) as { messages: UIMessage[] };

  const result = streamText({
    model,
    system: agent.systemPrompt,
    tools: agent.tools,
    messages: convertToModelMessages(body.messages),
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
