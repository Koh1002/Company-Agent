import type { AgentDef } from "../types";
import { ecListingAgent } from "./ec-listing";
import { demandForecastAgent } from "./demand-forecast";
import { quoteRfpAgent } from "./quote-rfp";
import { inquiryReplyAgent } from "./inquiry-reply";

export const registry: Record<string, AgentDef> = {
  [ecListingAgent.id]: ecListingAgent,
  [demandForecastAgent.id]: demandForecastAgent,
  [quoteRfpAgent.id]: quoteRfpAgent,
  [inquiryReplyAgent.id]: inquiryReplyAgent,
};

export function listAgents(): AgentDef[] {
  return Object.values(registry);
}

export function getAgent(id: string): AgentDef | undefined {
  return registry[id];
}
