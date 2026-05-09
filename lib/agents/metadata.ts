import { listAgents } from "./registry";
import type { AgentCategory } from "../types";

export type AgentMetadata = {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  samplePrompts: string[];
  toolNames: string[];
};

export function listAgentMetadata(): AgentMetadata[] {
  return listAgents().map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    category: a.category,
    samplePrompts: a.samplePrompts,
    toolNames: Object.keys(a.tools),
  }));
}

export function getAgentMetadata(id: string): AgentMetadata | undefined {
  return listAgentMetadata().find((a) => a.id === id);
}

export const CATEGORY_LABEL: Record<AgentCategory, string> = {
  manufacturer: "メーカー",
  wholesale: "卸",
  retail: "小売・EC",
  common: "共通",
};
