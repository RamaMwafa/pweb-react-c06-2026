import type { Application } from "../types";
import { isGhosting } from "./applicationutils";

export interface DashboardStats {
  totalApplications: number;
  activePipelineCount: number;
  respondedCount: number;
  responseRate: number;
  interviewCount: number;
  interviewRate: number;
  ghostingRiskCount: number;
  offerCount: number;
}

export function calculateDashboardStats(
  applications: Application[]
): DashboardStats {
  const totalApplications = applications.length;

  const activePipelineCount = applications.filter(
    (app) => app.status !== "OFFER" && app.status !== "REJECTED"
  ).length;

  const respondedCount = applications.filter(
    (app) =>
      app.status === "SCREENING" ||
      app.status === "INTERVIEW" ||
      app.status === "OFFER" ||
      app.status === "REJECTED"
  ).length;

  const interviewCount = applications.filter(
    (app) => app.status === "INTERVIEW" || app.status === "OFFER"
  ).length;

  const ghostingRiskCount = applications.filter((app) =>
    isGhosting(app)
  ).length;

  const offerCount = applications.filter(
    (app) => app.status === "OFFER"
  ).length;

  const responseRate =
    totalApplications > 0
      ? Math.round((respondedCount / totalApplications) * 100)
      : 0;

  const interviewRate =
    totalApplications > 0
      ? Math.round((interviewCount / totalApplications) * 100)
      : 0;

  return {
    totalApplications,
    activePipelineCount,
    respondedCount,
    responseRate,
    interviewCount,
    interviewRate,
    ghostingRiskCount,
    offerCount,
  };
}
