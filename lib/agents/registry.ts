import type { AgentDef } from "../types";
import { ecListingAgent } from "./ec-listing";
import { demandForecastAgent } from "./demand-forecast";
import { quoteRfpAgent } from "./quote-rfp";
import { inquiryReplyAgent } from "./inquiry-reply";
import { detailedDemandPlanningAgent } from "./detailed-demand-planning";
import { autoReplenishmentAgent } from "./auto-replenishment";
import { supplierScoringAgent } from "./supplier-scoring";
import { planogramAgent } from "./planogram";
import { contractReviewAgent } from "./contract-review";
import { meetingMinutesAgent } from "./meeting-minutes";
import { competitorPricingAgent } from "./competitor-pricing";
import { warehouseKpiAgent } from "./warehouse-kpi";
import { recruitingScreeningAgent } from "./recruiting-screening";
import { retailDataAnalysisAgent } from "./retail-data-analysis";
import { dataScientistAgent } from "./data-scientist";

const all: AgentDef[] = [
  ecListingAgent,
  demandForecastAgent,
  quoteRfpAgent,
  inquiryReplyAgent,
  detailedDemandPlanningAgent,
  autoReplenishmentAgent,
  supplierScoringAgent,
  planogramAgent,
  contractReviewAgent,
  meetingMinutesAgent,
  competitorPricingAgent,
  warehouseKpiAgent,
  recruitingScreeningAgent,
  retailDataAnalysisAgent,
  dataScientistAgent,
];

export const registry: Record<string, AgentDef> = Object.fromEntries(
  all.map((a) => [a.id, a]),
);

export function listAgents(): AgentDef[] {
  return all;
}

export function getAgent(id: string): AgentDef | undefined {
  return registry[id];
}
