import { useState, type FormEvent } from "react";
import { Award, Database, X } from "lucide-react";
import type { JobSource } from "../types";
import "./SkillProfileSidebar.css";

interface SkillProfileSidebarProps {
  skills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  jobSource: JobSource;
  onChangeJobSource: (source: JobSource) => void;
}

export function SkillProfileSidebar({
  skills,
  onAddSkill,
  onRemoveSkill,
  jobSource,
  onChangeJobSource,
}: SkillProfileSidebarProps) {
  const [inputSkill, setInputSkill] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputSkill.trim();

    if (!trimmed) {
      setErrorMsg("Nama skill tidak boleh kosong.");
      return;
    }

    const isDuplicate = skills.some(
      (existing) => existing.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg(`Skill "${trimmed}" sudah ada di profil.`);
      return;
    }

    onAddSkill(trimmed);
    setInputSkill("");
    setErrorMsg("");
  };

  return (
    <aside className="sidebar-stack">
      {/* Blok 1: Profil Skill */}
      <section className="sidebar-card">
        <div className="step-header">
          <div className="step-title-group">
            <div className="step-icon-box">
              <Award size={17} />
            </div>
            <h2 className="sidebar-title">Profil Skill Kapten</h2>
          </div>
          <span className="step-badge">{skills.length} Skill</span>
        </div>

        <p className="sidebar-desc">
          Tambahkan skill yang kamu kuasai. Persentase kecocokan di setiap kartu
          lowongan otomatis dihitung dari daftar ini.
        </p>

        <form onSubmit={handleSubmit} className="skill-form">
          <input
            type="text"
            value={inputSkill}
            onChange={(e) => {
              setInputSkill(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            placeholder="Misal: Docker, Figma..."
            className="skill-input"
          />
          <button type="submit" className="skill-add-btn">
            Tambah
          </button>
        </form>

        {errorMsg && <p className="skill-error">{errorMsg}</p>}

        <div className="skill-tags-container">
          {skills.map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                aria-label={`Hapus skill ${skill}`}
                className="skill-remove-btn"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Blok 2: Sumber Data Lowongan */}
      <section className="sidebar-card">
        <div className="step-title-group">
          <div className="step-icon-box">
            <Database size={17} />
          </div>
          <h3 className="sidebar-title">Sumber Data Lowongan</h3>
        </div>

        <div className="source-options">
          <label className="source-label">
            <input
              type="radio"
              name="jobSource"
              checked={jobSource === "remotive"}
              onChange={() => onChangeJobSource("remotive")}
              className="source-radio"
            />
            <div className="source-text-group">
              <span className="source-title">Remotive API (Live)</span>
              <span className="source-caption">
                Lowongan remote software-dev secara real-time
              </span>
            </div>
          </label>

          <label className="source-label">
            <input
              type="radio"
              name="jobSource"
              checked={jobSource === "local"}
              onChange={() => onChangeJobSource("local")}
              className="source-radio"
            />
            <div className="source-text-group">
              <span className="source-title">Dataset Magang ID (Lokal)</span>
              <span className="source-caption">
                15 lowongan magang tech Indonesia (mode offline)
              </span>
            </div>
          </label>
        </div>
      </section>
    </aside>
  );
}