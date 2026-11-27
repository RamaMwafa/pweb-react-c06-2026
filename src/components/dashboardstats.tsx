import { useMemo } from "react";
import type { Application } from "../types";
import { calculateDashboardStats } from "../utils/stats";
import "./dashboardstats.css";

interface DashboardStatsProps {
  applications: Application[];
}

export function DashboardStats({ applications }: DashboardStatsProps) {
  const stats = useMemo(
    () => calculateDashboardStats(applications),
    [applications]
  );

  return (
    <section className="stats-strip" aria-label="Ringkasan Statistik Lamaran">
      <article className="stat-card">
        <span className="stat-label">TOTAL LAMARAN</span>
        <strong className="stat-value">{stats.totalApplications}</strong>
        <span className="stat-sub">
          {stats.activePipelineCount} aktif di pipeline
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-label">RESPONSE RATE</span>
        <strong className="stat-value">{stats.responseRate}%</strong>
        <span className="stat-sub">
          {stats.respondedCount} dari {stats.totalApplications} diproses
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-label">INTERVIEW RATE</span>
        <strong className="stat-value">{stats.interviewRate}%</strong>
        <span className="stat-sub">
          {stats.interviewCount} masuk wawancara
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-label">RAWAN GHOSTING</span>
        <strong
          className={`stat-value ${
            stats.ghostingRiskCount > 0 ? "stat-danger" : ""
          }`}
        >
          {stats.ghostingRiskCount}
        </strong>
        <span className="stat-sub">&gt;14 hari tanpa kabar</span>
      </article>

      <article className="stat-card">
        <span className="stat-label">OFFER DITERIMA</span>
        <strong
          className={`stat-value ${
            stats.offerCount >= 2 ? "stat-success" : ""
          }`}
        >
          {stats.offerCount}
        </strong>
        <span className="stat-sub">
          {stats.offerCount >= 2
            ? "Siap dibandingkan"
            : "Perlu minimal 2 offer"}
        </span>
      </article>
    </section>
  );
}
