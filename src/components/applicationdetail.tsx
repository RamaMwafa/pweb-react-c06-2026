import { useState, useEffect, type FormEvent } from "react";
import {
  X,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  History,
  Send,
  Lock,
} from "lucide-react";
import type { Application, ApplicationStatus, WorkMode } from "../types";
import {
  getAllowedTransitions,
  isFinalStatus,
  STATUS_LABELS,
  validateTransition,
  type TransitionPayload,
} from "../utils/statemachine";
import {
  getChecklistProgress,
  isGhosting,
} from "../utils/applicationutils";
import { calculateSkillMatch } from "../utils/skillmatch";
import { InterviewPrepTimer } from "./interviewpreptimer";
import "./applicationdetail.css";

interface ApplicationDetailProps {
  application: Application;
  kaptenSkills: string[];
  onClose: () => void;
  onTransitionStatus: (
    id: string,
    targetStatus: ApplicationStatus,
    payload: TransitionPayload
  ) => void;
  onAddChecklistItem: (id: string, text: string) => void;
  onToggleChecklistItem: (id: string, itemId: string) => void;
  onRemoveChecklistItem: (id: string, itemId: string) => void;
  onAddActivityNote: (id: string, note: string) => void;
  onSimulateGhosting: (id: string) => void;
  onDelete: (id: string) => void;
}

const PIPELINE_STEPS: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
];

function getInitials(company: string): string {
  const words = company.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ApplicationDetail({
  application,
  kaptenSkills,
  onClose,
  onTransitionStatus,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onAddActivityNote,
  onSimulateGhosting,
  onDelete,
}: ApplicationDetailProps) {
  const allowedTransitions = getAllowedTransitions(application.status);
  const finalStatus = isFinalStatus(application.status);

  const [selectedTarget, setSelectedTarget] = useState<ApplicationStatus | null>(
    null
  );
  const [cvVersion, setCvVersion] = useState(application.cvVersion ?? "");
  const [appliedDate, setAppliedDate] = useState(
    application.appliedDate ?? getTodayDateString()
  );
  const [interviewDateTime, setInterviewDateTime] = useState(
    application.interviewDateTime ?? ""
  );
  const [salaryOfferInput, setSalaryOfferInput] = useState(
    application.salaryOffer ? String(application.salaryOffer) : ""
  );
  const [workMode, setWorkMode] = useState<WorkMode>(application.workMode);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const [newChecklistText, setNewChecklistText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Derived active target status so we never need setState inside useEffect
  const effectiveTarget: ApplicationStatus | null =
    selectedTarget && allowedTransitions.includes(selectedTarget)
      ? selectedTarget
      : (allowedTransitions[0] ?? null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const progress = getChecklistProgress(application);
  const ghosting = isGhosting(application);
  const skillMatch = calculateSkillMatch(
    kaptenSkills,
    application.requiredSkills
  );

  const canSimulate =
    application.status === "APPLIED" || application.status === "SCREENING";

  const activeStepIndex = PIPELINE_STEPS.indexOf(application.status);

  const handleConfirmTransition = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveTarget) return;

    const parsedSalary = salaryOfferInput.trim()
      ? Number(salaryOfferInput)
      : undefined;

    const payload: TransitionPayload = {
      cvVersion: cvVersion.trim(),
      appliedDate,
      interviewDateTime,
      salaryOffer: parsedSalary,
      workMode,
    };

    const error = validateTransition(
      application.status,
      effectiveTarget,
      payload
    );

    if (error) {
      setTransitionError(error);
      return;
    }

    setTransitionError(null);
    setSelectedTarget(null);
    onTransitionStatus(application.id, effectiveTarget, payload);
  };

  const handleChecklistSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newChecklistText.trim()) return;
    onAddChecklistItem(application.id, newChecklistText);
    setNewChecklistText("");
  };

  const handleNoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newNoteText.trim()) return;
    onAddActivityNote(application.id, newNoteText);
    setNewNoteText("");
  };

  const handleDeleteClick = () => {
    onDelete(application.id);
    onClose();
  };

  return (
    <div
      className="detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="detail-modal">
        {/* Top Header */}
        <header className="detail-header">
          <div className="detail-header-left">
            <div className="detail-avatar">
              {getInitials(application.company)}
            </div>
            <div>
              <h2 id="detail-modal-title" className="detail-title">
                {application.role} — {application.company}
              </h2>
              <p className="detail-meta">
                <span>{application.workMode}</span>
                <span>•</span>
                <span>{skillMatch.score}% Skill Match</span>
                {application.cvVersion && (
                  <>
                    <span>•</span>
                    <span>CV: {application.cvVersion}</span>
                  </>
                )}
                {application.interviewDateTime && (
                  <>
                    <span>•</span>
                    <span>
                      Jadwal Interview:{" "}
                      {formatDateTime(application.interviewDateTime)}
                    </span>
                  </>
                )}
                {application.salaryOffer !== undefined && (
                  <>
                    <span>•</span>
                    <span>Offer: {formatRupiah(application.salaryOffer)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="detail-header-actions">
            <span
              className={`detail-status-pill status-${application.status.toLowerCase()}`}
            >
              {STATUS_LABELS[application.status]}
            </span>

            {ghosting && (
              <span className="detail-ghosting-pill">
                <AlertTriangle size={13} />
                Rawan Ghosting
              </span>
            )}

            {canSimulate && (
              <button
                type="button"
                className="detail-btn-simulate"
                onClick={() => onSimulateGhosting(application.id)}
              >
                <Clock size={14} />
                Simulasi +15 Hari
              </button>
            )}

            <button
              type="button"
              className="detail-btn-delete"
              onClick={handleDeleteClick}
            >
              <Trash2 size={14} />
              Hapus
            </button>

            <button
              type="button"
              className="detail-btn-close"
              onClick={onClose}
              aria-label="Tutup detail lamaran"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Body 2 Columns */}
        <div className="detail-body">
          {/* Left Column: State Machine + Checklist */}
          <div className="detail-col-main">
            {/* State Machine Section */}
            <section className="detail-card">
              <div className="detail-card-header">
                <h3>TAHAP SELEKSI</h3>
                {(application.status === "REJECTED" ||
                  application.status === "GHOSTED") && (
                  <span
                    className={`detail-side-tag tag-${application.status.toLowerCase()}`}
                  >
                    Status saat ini: {STATUS_LABELS[application.status]}
                  </span>
                )}
              </div>

              {/* 5-step progress indicator */}
              <div className="stepper-track" aria-label="Tahap seleksi utama">
                {PIPELINE_STEPS.map((step, index) => {
                  const isCompleted =
                    activeStepIndex !== -1 && index < activeStepIndex;
                  const isCurrent =
                    activeStepIndex !== -1 && index === activeStepIndex;

                  return (
                    <div
                      key={step}
                      className={`stepper-item ${
                        isCompleted
                          ? "completed"
                          : isCurrent
                            ? "current"
                            : ""
                      }`}
                    >
                      <div className="stepper-bar" />
                      <span className="stepper-label">
                        {index + 1}. {STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Transition Controls */}
              {finalStatus ? (
                <div className="transition-final-box">
                  <Lock size={16} />
                  <span>
                    Status <strong>{application.status}</strong> bersifat final
                    dan tidak dapat dipindahkan ke tahap lain.
                  </span>
                </div>
              ) : (
                <form
                  className="transition-box"
                  onSubmit={handleConfirmTransition}
                >
                  <div className="transition-top-row">
                    <span className="transition-prompt">
                      Pindahkan status ke:
                    </span>
                    <div className="transition-options">
                      {allowedTransitions.map((target) => (
                        <button
                          key={target}
                          type="button"
                          className={`transition-option-btn ${
                            effectiveTarget === target ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedTarget(target);
                            setTransitionError(null);
                          }}
                        >
                          {STATUS_LABELS[target]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional inputs for APPLIED */}
                  {effectiveTarget === "APPLIED" && (
                    <div className="transition-fields">
                      <div className="transition-field">
                        <label htmlFor="detail-cv-version">Versi CV *</label>
                        <input
                          id="detail-cv-version"
                          type="text"
                          value={cvVersion}
                          onChange={(e) => setCvVersion(e.target.value)}
                          placeholder="Contoh: Kapten-CV-v2.pdf"
                        />
                      </div>
                      <div className="transition-field">
                        <label htmlFor="detail-applied-date">
                          Tanggal Melamar *
                        </label>
                        <input
                          id="detail-applied-date"
                          type="date"
                          value={appliedDate}
                          onChange={(e) => setAppliedDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Conditional input for INTERVIEW */}
                  {effectiveTarget === "INTERVIEW" && (
                    <div className="transition-fields">
                      <div className="transition-field">
                        <label htmlFor="detail-interview-dt">
                          Jadwal Interview (Tanggal &amp; Jam) *
                        </label>
                        <input
                          id="detail-interview-dt"
                          type="datetime-local"
                          value={interviewDateTime}
                          onChange={(e) => setInterviewDateTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Conditional inputs for OFFER */}
                  {effectiveTarget === "OFFER" && (
                    <div className="transition-fields">
                      <div className="transition-field">
                        <label htmlFor="detail-salary-offer">
                          Uang Saku / Gaji per Bulan (Rp) *
                        </label>
                        <input
                          id="detail-salary-offer"
                          type="number"
                          min={1}
                          step={100000}
                          value={salaryOfferInput}
                          onChange={(e) => setSalaryOfferInput(e.target.value)}
                          placeholder="Contoh: 5500000"
                        />
                      </div>
                      <div className="transition-field">
                        <label htmlFor="detail-work-mode">Mode Kerja *</label>
                        <select
                          id="detail-work-mode"
                          value={workMode}
                          onChange={(e) =>
                            setWorkMode(e.target.value as WorkMode)
                          }
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {transitionError && (
                    <p className="transition-error" role="alert">
                      {transitionError}
                    </p>
                  )}

                  <div className="transition-submit-row">
                    <button
                      type="submit"
                      className="transition-confirm-btn"
                      disabled={!effectiveTarget}
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        Konfirmasi Pindah ke{" "}
                        {effectiveTarget ? STATUS_LABELS[effectiveTarget] : ""}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Nested Checklist Section */}
            <section className="detail-card">
              <div className="detail-card-header">
                <h3>DAFTAR PERSIAPAN</h3>
                <span className="checklist-summary">
                  {progress.completed} / {progress.total} selesai
                </span>
              </div>

              <div
                className="checklist-progress-track"
                role="progressbar"
                aria-label="Progress daftar persiapan"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percentage}
              >
                <div
                  className="checklist-progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <ul className="checklist-list">
                {application.checklist.length === 0 ? (
                  <li className="checklist-empty">
                    Belum ada tugas persiapan. Tambahkan item pertama di bawah!
                  </li>
                ) : (
                  application.checklist.map((item) => (
                    <li
                      key={item.id}
                      className={`checklist-item ${item.done ? "is-done" : ""}`}
                    >
                      <label className="checklist-label">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            onToggleChecklistItem(application.id, item.id)
                          }
                        />
                        <span>{item.text}</span>
                      </label>
                      <button
                        type="button"
                        className="checklist-remove-btn"
                        aria-label={`Hapus tugas ${item.text}`}
                        onClick={() =>
                          onRemoveChecklistItem(application.id, item.id)
                        }
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <form
                className="checklist-add-form"
                onSubmit={handleChecklistSubmit}
              >
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Tambah tugas persiapan baru..."
                  aria-label="Tambah tugas persiapan baru"
                />
                <button type="submit" className="checklist-add-btn">
                  <Plus size={15} />
                  <span>Tambah</span>
                </button>
              </form>
            </section>
          </div>

          {/* Right Column: Interview Prep Timer + Activity Log */}
          <div className="detail-col-side">
            <InterviewPrepTimer />

            <section className="detail-card activity-card">
              <div className="detail-card-header">
                <div className="detail-card-title-group">
                  <History size={16} />
                  <h3>RIWAYAT AKTIVITAS</h3>
                </div>
                <span className="activity-count">
                  {application.activityLogs.length} catatan
                </span>
              </div>

              <form className="note-add-form" onSubmit={handleNoteSubmit}>
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Tambah catatan manual (misal: hasil follow-up HRD)..."
                  aria-label="Tambah catatan aktivitas"
                />
                <button
                  type="submit"
                  className="note-add-btn"
                  aria-label="Simpan catatan"
                >
                  <Send size={14} />
                </button>
              </form>

              <ol className="activity-timeline">
                {application.activityLogs.length === 0 ? (
                  <li className="activity-empty">Belum ada riwayat aktivitas.</li>
                ) : (
                  application.activityLogs.map((log) => (
                    <li key={log.id} className="activity-entry">
                      <span className="activity-dot" aria-hidden="true" />
                      <div className="activity-content">
                        <time className="activity-time">
                          {formatDateTime(log.timestamp)}
                        </time>
                        <p className="activity-message">{log.message}</p>
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
