import { notFound } from "next/navigation";
import { getAgentMetadata } from "@/lib/agents/metadata";
import { CredentialGate } from "@/components/CredentialGate";
import { AgentChat } from "@/components/AgentChat";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgentMetadata(agentId);
  if (!agent) notFound();

  return (
    <CredentialGate>
      <AgentChat agent={agent} />
    </CredentialGate>
  );
}
