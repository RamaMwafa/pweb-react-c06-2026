
import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Application, WorkMode } from "../types";
import { isDuplicateApplication } from "../utils/applicationutils";
import "./applicationform.css";

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (application: Application) => void;
  onClose: () => void;
}

type FieldName =
  | "company"
  | "role"
  | "requiredSkills"
  | "cvVersion"
  | "appliedDate";

type FormErrors = Partial<Record<FieldName, string>>;

export function ApplicationForm({
  applications,
  onAdd,
  onClose,
}: ApplicationFormProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] =
    useState<"WISHLIST" | "APPLIED">("WISHLIST");

  const [requiredSkills, setRequiredSkills] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    const skills = requiredSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    // Validasi input kosong
    if (!company.trim()) {
      nextErrors.company = "Nama perusahaan wajib diisi.";
    }

    if (!role.trim()) {
      nextErrors.role = "Posisi wajib diisi.";
    }

    if (skills.length === 0) {
      nextErrors.requiredSkills = "Required skills wajib diisi.";
    }

    // Validasi status APPLIED
    if (status === "APPLIED") {
      if (!cvVersion.trim()) {
        nextErrors.cvVersion = "Versi CV wajib diisi.";
      }

      if (!appliedDate) {
        nextErrors.appliedDate = "Tanggal melamar wajib diisi.";
      }
    }

    // Validasi anti-duplikat
    if (
      company.trim() &&
      role.trim() &&
      isDuplicateApplication(applications, company, role)
    ) {
      nextErrors.company =
        "Lamaran dengan perusahaan dan posisi ini sudah ada.";
    }

    setErrors(nextErrors);

    // Auto-focus input pertama yang error
    if (nextErrors.company) {
      companyRef.current?.focus();
      return;
    }

    if (nextErrors.role) {
      roleRef.current?.focus();
      return;
    }

    if (nextErrors.requiredSkills) {
      skillsRef.current?.focus();
      return;
    }

    if (nextErrors.cvVersion) {
      cvRef.current?.focus();
      return;
    }

    if (nextErrors.appliedDate) {
      dateRef.current?.focus();
      return;
    }

    const now = new Date().toISOString();

    // Membuat objek lamaran baru
    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      workMode,
      status,
      requiredSkills: skills,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: `Lamaran dibuat dengan status ${status}`,
        },
      ],
      ...(status === "APPLIED"
        ? {
            cvVersion: cvVersion.trim(),
            appliedDate,
          }
        : {}),
    };

    onAdd(newApplication);
    onClose();
  }

  return (
    <div className="manual-overlay">
      <section
        className="manual-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-title"
      >
        <header className="manual-header">
          <div>
            <p className="manual-eyebrow">
              YOUR NEXT OPPORTUNITY
            </p>

            <h2 id="manual-title">
              Catat Lamaran Baru
            </h2>

            <p>
              Mulai perjalanan kariermu dari sini.
            </p>
          </div>

          <button
            type="button"
            className="manual-close"
            onClick={onClose}
            aria-label="Tutup form"
          >
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="manual-fields">
            <label>
              Nama Perusahaan *

              <input
                ref={companyRef}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Contoh: Nusantara Cloud"
                aria-invalid={Boolean(errors.company)}
              />

              {errors.company && (
                <small className="manual-error">
                  {errors.company}
                </small>
              )}
            </label>

            <label>
              Posisi / Role *

              <input
                ref={roleRef}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Frontend Developer Intern"
                aria-invalid={Boolean(errors.role)}
              />

              {errors.role && (
                <small className="manual-error">
                  {errors.role}
                </small>
              )}
            </label>

            <div className="manual-grid">
              <label>
                Mode Kerja

                <select
                  value={workMode}
                  onChange={(e) =>
                    setWorkMode(e.target.value as WorkMode)
                  }
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </label>

              <label>
                Status Awal

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "WISHLIST" | "APPLIED"
                    )
                  }
                >
                  <option value="WISHLIST">WISHLIST</option>
                  <option value="APPLIED">APPLIED</option>
                </select>
              </label>
            </div>

            <label>
              Required Skills *

              <input
                ref={skillsRef}
                value={requiredSkills}
                onChange={(e) =>
                  setRequiredSkills(e.target.value)
                }
                placeholder="React, TypeScript, CSS"
                aria-invalid={Boolean(errors.requiredSkills)}
              />

              <small>
                Pisahkan setiap skill dengan koma.
              </small>

              {errors.requiredSkills && (
                <small className="manual-error">
                  {errors.requiredSkills}
                </small>
              )}
            </label>

            {/* Input kondisional untuk status APPLIED */}
            {status === "APPLIED" && (
              <div className="manual-grid">
                <label>
                  Versi CV *

                  <input
                    ref={cvRef}
                    value={cvVersion}
                    onChange={(e) =>
                      setCvVersion(e.target.value)
                    }
                    placeholder="CV Frontend v2"
                    aria-invalid={Boolean(errors.cvVersion)}
                  />

                  {errors.cvVersion && (
                    <small className="manual-error">
                      {errors.cvVersion}
                    </small>
                  )}
                </label>

                <label>
                  Tanggal Melamar *

                  <input
                    ref={dateRef}
                    type="date"
                    value={appliedDate}
                    onChange={(e) =>
                      setAppliedDate(e.target.value)
                    }
                    aria-invalid={Boolean(errors.appliedDate)}
                  />

                  {errors.appliedDate && (
                    <small className="manual-error">
                      {errors.appliedDate}
                    </small>
                  )}
                </label>
              </div>
            )}
          </div>

          <footer className="manual-actions">
            <button
              type="button"
              className="manual-cancel"
              onClick={onClose}
            >
              Batal
            </button>

            <button
              type="submit"
              className="manual-submit"
            >
              Simpan Lamaran
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
