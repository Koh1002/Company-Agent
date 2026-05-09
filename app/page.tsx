import { listAgentMetadata } from "@/lib/agents/metadata";
import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  const agents = listAgentMetadata();
  return <HomeClient agents={agents} />;
}
