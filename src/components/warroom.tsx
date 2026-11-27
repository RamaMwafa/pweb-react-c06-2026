
import { useState } from "react";
import {
  Search,
  Briefcase,
  Clock,
  Trash2,
  CalendarDays,
  FileText,
  ArrowUpRight,
  Plus,
  AlertTriangle,
} from "lucide-react";

import type {
  Application,
  ApplicationStatus,
} from "../types";

import { calculateSkillMatch } from "../utils/skillmatch";

import {
  isGhosting,
  getChecklistProgress,
} from "../utils/applicationutils";

import "./warroom.css";

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSimulateGhosting: (id: string) => void;
  onSelect?: (application: Application) => void;
}

type StatusFilter = "ALL" | ApplicationStatus;

type SortOption =
  | "newest"
  | "interview"
  | "salary";

const STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

export function WarRoom({
  applications,
  kaptenSkills,
  onAdd,
  onDelete,
  onSimulateGhosting,
  onSelect,
}: WarRoomProps) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [ghostingOnly, setGhostingOnly] =
    useState(false);

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  // Derived state: tidak disimpan ke useState terpisah.
  const filteredApplications = applications
    .filter((application) => {
      const searchText =
        `${application.company} ${application.role}`
          .toLowerCase();

      const matchesKeyword = searchText.includes(
        keyword.trim().toLowerCase()
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      const matchesGhosting =
        !ghostingOnly || isGhosting(application);

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesGhosting
      );
    })
    .sort((a, b) => {
      if (sortBy === "salary") {
        const salaryA =
          a.status === "OFFER" ? a.salaryOffer ?? 0 : 0;
        const salaryB =
          b.status === "OFFER" ? b.salaryOffer ?? 0 : 0;

        return salaryB - salaryA;
      }

      if (sortBy === "interview") {
        const timeA =
          a.status === "INTERVIEW" && a.interviewDateTime
            ? new Date(a.interviewDateTime).getTime()
            : Infinity;

        const timeB =
          b.status === "INTERVIEW" && b.interviewDateTime
            ? new Date(b.interviewDateTime).getTime()
            : Infinity;

        if (timeA === timeB) return 0;

        return timeA - timeB;
      }

      return (
        new Date(b.lastUpdatedAt).getTime() -
        new Date(a.lastUpdatedAt).getTime()
      );
    });

  const ghostingCount =
    applications.filter((app) => isGhosting(app)).length;

  function formatDate(value?: string): string {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatSalary(value: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <main className="warroom-page">
      <header className="warroom-heading">
        <div>
          <p className="page-eyebrow">
            Tahap 2 • Application Tracker
          </p>

          <h2 className="page-title">
            War Room Lamaran
          </h2>

          <p className="page-subtitle">
            Kelola lamaran, pantau progres seleksi,
            dan persiapkan perjalanan kariermu.
          </p>
        </div>

        <button
          type="button"
          className="wr-add-button"
          onClick={onAdd}
        >
          <Plus size={18} />
          Catat Lamaran
        </button>
      </header>

      <div className="wr-summary">
        <span>
          <Briefcase size={17} />
          Total Lamaran
          <strong>{applications.length}</strong>
        </span>

        <span>
          <AlertTriangle size={17} />
          Rawan Ghosting
          <strong>{ghostingCount}</strong>
        </span>
      </div>

      <section className="wr-filters">
        <div className="wr-filter-row">
          <div className="wr-search">
            <Search size={18} />

            <input
              type="search"
              aria-label="Cari lamaran"
              placeholder="Cari perusahaan atau posisi..."
              value={keyword}
              onChange={(e) =>
                setKeyword(e.target.value)
              }
            />
          </div>

          <select
            aria-label="Filter status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as StatusFilter
              )
            }
          >
            <option value="ALL">
              Semua Status
            </option>

            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label="Urutkan lamaran"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as SortOption
              )
            }
          >
            <option value="newest">
              Terbaru
            </option>

            <option value="interview">
              Jadwal Interview Terdekat
            </option>

            <option value="salary">
              Offer Tertinggi
            </option>
          </select>
        </div>

        <div className="wr-filter-bottom">
          <label className="wr-toggle">
            <input
              type="checkbox"
              checked={ghostingOnly}
              onChange={(e) =>
                setGhostingOnly(e.target.checked)
              }
            />
            Hanya Rawan Ghosting
          </label>

          <span>
            {filteredApplications.length} dari{" "}
            {applications.length} lamaran
          </span>
        </div>
      </section>

      {filteredApplications.length === 0 ? (
        <section className="wr-empty">
          <div className="wr-empty-icon">
            <Briefcase size={32} />
          </div>

          <h3>
            {applications.length === 0
              ? "Belum ada lamaran"
              : "Lamaran tidak ditemukan"}
          </h3>

          <p>
            {applications.length === 0
              ? "Simpan lowongan ke Wishlist atau catat lamaran secara manual."
              : "Coba ubah kata kunci atau filter yang digunakan."}
          </p>

          {applications.length === 0 ? (
            <button
              type="button"
              className="wr-add-button"
              onClick={onAdd}
            >
              <Plus size={16} />
              Tambah Lamaran
            </button>
          ) : (
            <button
              type="button"
              className="wr-secondary-button"
              onClick={() => {
                setKeyword("");
                setStatusFilter("ALL");
                setGhostingOnly(false);
                setSortBy("newest");
              }}
            >
              Reset Filter
            </button>
          )}
        </section>
      ) : (
        <section className="wr-grid">
          {filteredApplications.map((application) => {
            const match = calculateSkillMatch(
              kaptenSkills,
              application.requiredSkills
            ).score;

            const progress =
              getChecklistProgress(application);

            const ghosting =
              isGhosting(application);

            const canSimulate =
              application.status === "APPLIED" ||
              application.status === "SCREENING";

            const matchClass =
              match >= 70
                ? "high"
                : match >= 40
                  ? "medium"
                  : "low";

            return (
              <article
                key={application.id}
                className="wr-card"
              >
                <div className="wr-card-header">
                  <div className="wr-company-logo">
                    {application.company
                      .split(" ")
                      .slice(0, 2)
                      .map((word) => word.charAt(0))
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="wr-company-info">
                    <h3>{application.company}</h3>
                    <p>{application.role}</p>
                  </div>

                  <span
                    className={`wr-status ${application.status.toLowerCase()}`}
                  >
                    {application.status}
                  </span>
                </div>

                <div className="wr-card-badges">
                  <span className="wr-mode">
                    {application.workMode}
                  </span>

                  <span
                    className={`wr-match ${matchClass}`}
                  >
                    {match}% Match
                  </span>

                  {ghosting && (
                    <span className="wr-ghosting">
                      <AlertTriangle size={13} />
                      Rawan Ghosting
                    </span>
                  )}
                </div>

                <div className="wr-meta">
                  <span>
                    <FileText size={15} />
                    Versi CV
                  </span>
                  <strong>
                    {application.cvVersion ||
                      "Belum ditentukan"}
                  </strong>
                </div>

                {application.interviewDateTime && (
                  <div className="wr-meta">
                    <span>
                      <CalendarDays size={15} />
                      Interview
                    </span>

                    <strong>
                      {formatDate(
                        application.interviewDateTime
                      )}
                    </strong>
                  </div>
                )}

                {application.salaryOffer !== undefined && (
                  <div className="wr-meta">
                    <span>Salary Offer</span>

                    <strong>
                      {formatSalary(
                        application.salaryOffer
                      )}
                    </strong>
                  </div>
                )}

                <div className="wr-progress">
                  <div className="wr-progress-label">
                    <span>
                      Progress Persiapan
                    </span>

                    <strong>
                      {progress.completed}/
                      {progress.total}
                    </strong>
                  </div>

                  <div
                    className="wr-progress-track"
                    role="progressbar"
                    aria-label="Progress checklist"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      progress.percentage
                    }
                  >
                    <div
                      className="wr-progress-fill"
                      style={{
                        width: `${progress.percentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="wr-updated">
                  <Clock size={13} />
                  Update:{" "}
                  {formatDate(
                    application.lastUpdatedAt
                  )}
                </div>

                <footer className="wr-card-footer">
                  {canSimulate && (
                    <button
                      type="button"
                      className="wr-simulate-button"
                      onClick={() =>
                        onSimulateGhosting(
                          application.id
                        )
                      }
                    >
                      <Clock size={14} />
                      Simulasi +15 Hari
                    </button>
                  )}

                  <div className="wr-card-actions">
                    <button
                      type="button"
                      className="wr-delete-button"
                      aria-label={`Hapus ${application.company}`}
                      title="Hapus lamaran"
                      onClick={() =>
                        onDelete(application.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>

                    {onSelect && (
                      <button
                        type="button"
                        className="wr-detail-button"
                        onClick={() =>
                          onSelect(application)
                        }
                      >
                        Detail
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
