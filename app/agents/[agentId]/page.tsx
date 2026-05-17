import { notFound } from "next/navigation";
import { getAgentMetadata, listAgentMetadata } from "@/lib/agents/metadata";
import { CredentialGate } from "@/components/CredentialGate";
import { AgentChat } from "@/components/AgentChat";

export const dynamicParams = false;

export function generateStaticParams() {
  return listAgentMetadata().map((a) => ({ agentId: a.id }));
}

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
