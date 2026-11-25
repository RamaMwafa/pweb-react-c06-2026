import type { Application } from "../types";

export { isDuplicateApplication } from "./skillmatch";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function isGhosting(
  application: Application,
  now: number = Date.now()
): boolean {
  const eligible =
    application.status === "APPLIED" ||
    application.status === "SCREENING";

  if (!eligible) return false;

  const lastUpdated = new Date(
    application.lastUpdatedAt
  ).getTime();

  return now - lastUpdated > 14 * DAY_MS;
}

export interface InterviewConflict {
  first: Application;
  second: Application;
  differenceMinutes: number;
}

export function findInterviewConflicts(
  applications: Application[]
): InterviewConflict[] {
  const interviews = applications.filter(
    (app) =>
      app.status === "INTERVIEW" &&
      Boolean(app.interviewDateTime)
  );

  const conflicts: InterviewConflict[] = [];

  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const first = interviews[i];
      const second = interviews[j];

      const firstTime = new Date(
        first.interviewDateTime ?? ""
      ).getTime();

      const secondTime = new Date(
        second.interviewDateTime ?? ""
      ).getTime();

      const differenceMinutes =
        Math.abs(firstTime - secondTime) / MINUTE_MS;

      if (differenceMinutes < 60) {
        conflicts.push({
          first,
          second,
          differenceMinutes,
        });
      }
    }
  }

  return conflicts;
}

export function simulateGhosting(
  application: Application
): Application {
  if (
    application.status !== "APPLIED" &&
    application.status !== "SCREENING"
  ) {
    return application;
  }

  const previousDate = new Date(
    application.lastUpdatedAt
  ).getTime();

  return {
    ...application,
    lastUpdatedAt: new Date(
      previousDate - 15 * DAY_MS
    ).toISOString(),
  };
}

export function getChecklistProgress(
  application: Application
) {
  const total = application.checklist.length;

  const completed = application.checklist.filter(
    (item) => item.done
  ).length;

  return {
    completed,
    total,
    percentage:
      total === 0
        ? 0
        : Math.round((completed / total) * 100),
  };
}