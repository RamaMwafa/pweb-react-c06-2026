
import { AlertTriangle } from "lucide-react";
import type { Application } from "../types";
import { findInterviewConflicts } from "../utils/applicationutils";
import "./warroom.css";

interface InterviewConflictBannerProps {
  applications: Application[];
}

export function InterviewConflictBanner({
  applications,
}: InterviewConflictBannerProps) {
  const conflicts =
    findInterviewConflicts(applications);

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <aside
      className="interview-conflict-banner"
      role="alert"
    >
      <AlertTriangle size={23} />

      <div>
        <h3>Jadwal Interview Bentrok!</h3>

        {conflicts.map((conflict) => (
          <p
            key={`${conflict.first.id}-${conflict.second.id}`}
          >
            {conflict.first.company}
            {" dan "}
            {conflict.second.company}
            {" memiliki jadwal interview berselisih "}
            {Math.round(
              conflict.differenceMinutes * 100
            ) / 100}
            {" menit."}
          </p>
        ))}

        <p>
          Segera sesuaikan jadwal agar kedua
          interview dapat diikuti.
        </p>
      </div>
    </aside>
  );
}
