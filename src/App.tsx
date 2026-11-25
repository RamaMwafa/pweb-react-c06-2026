import { useState, useMemo } from "react";
import { Compass, Briefcase, Scale, Plus } from "lucide-react";
import type { Application, JobListing, JobSource } from "./types";
import { useLocalStorage } from "./hooks/uselocalstorage";
import { inferWorkMode, isDuplicateApplication } from "./utils/skillmatch";
import { SkillProfileSidebar } from "./components/skillprofilesidebar";
import { JobExplorer } from "./components/jobexplorer";

// Application Management
import { ApplicationForm } from "./components/applicationform";
import { WarRoom } from "./components/warroom";
import { InterviewConflictBanner } from "./components/interviewconflictbanner";
import { UndoToast } from "./components/undotoast";
import { useUndoDelete } from "./hooks/useundodelete";
import { simulateGhosting } from "./utils/applicationutils";

import "./App.css";

type ActiveTab = "explore" | "pipeline" | "comparator";

const DEFAULT_SKILLS = ["React", "TypeScript", "CSS", "Git", "REST API"];

export function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "kapten_skills",
    DEFAULT_SKILLS
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "kapten_applications",
    []
  );
const [jobSource, setJobSource] = useState<JobSource>("remotive");
const [activeTab, setActiveTab] = useState<ActiveTab>("explore");

// State Form Manual & Undo Delete
const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    deleted,
    deleteApplication,
    undoDelete,
    dismissUndo,
  } = useUndoDelete(applications, setApplications);

  const offerCount = useMemo(
    () => applications.filter((app) => app.status === "OFFER").length,
    [applications]
  );

  const handleAddSkill = (newSkill: string) => {
    setKaptenSkills((prev) => [...prev, newSkill]);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setKaptenSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveToWishlist = (job: JobListing) => {
    if (isDuplicateApplication(applications, job.company_name, job.title)) {
      return;
    }

    const nowIso = new Date().toISOString();

    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: "WISHLIST",
      requiredSkills: job.tags,
      lastUpdatedAt: nowIso,
      checklist: [
        {
          id: crypto.randomUUID(),
          text: `Sesuaikan CV untuk posisi ${job.title}`,
          done: false,
        },
        {
          id: crypto.randomUUID(),
          text: `Riset profil perusahaan ${job.company_name}`,
          done: false,
        },
      ],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowIso,
          message: "Disimpan ke Wishlist dari Katalog Lowongan",
        },
      ],
    };

    setApplications((prev) => [newApplication, ...prev]);
  };

    // Handler Form Tambah Lamaran Manual
    const handleAddApplication = (application: Application) => {
      setApplications((prev) => {
        if (
          isDuplicateApplication(
            prev,
            application.company,
            application.role
          )
        ) {
          return prev;
        }

        return [application, ...prev];
      });

      setActiveTab("pipeline");
    };

    // Handler Simulasi +15 Hari
    const handleSimulateGhosting = (id: string) => {
      setApplications((prev) =>
        prev.map((application) =>
          application.id === id
            ? simulateGhosting(application)
            : application
        )
      );
    };
  return (
    <div className="app-wrapper">
      {/* Navigasi Utama Tetap (3 Tahap Perjalanan Magang) */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="brand-group">
            <span className="brand-badge">AM</span>
            <h1 className="brand-title">Aku Mw Magang</h1>
          </div>

          <nav className="nav-tabs" aria-label="Navigasi Utama">
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={`nav-tab-btn ${activeTab === "explore" ? "active" : ""}`}
            >
              <Compass size={15} />
              <span>1. Eksplorasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pipeline")}
              className={`nav-tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
            >
              <Briefcase size={15} />
              <span>2. War Room</span>
              <span className="nav-tab-count">{applications.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("comparator")}
              className={`nav-tab-btn ${
                activeTab === "comparator" ? "active" : ""
              }`}
            >
              <Scale size={15} />
              <span>3. Offer</span>
              <span className="nav-tab-count">{offerCount}</span>
            </button>
          </nav>

          {/* Tombol Aksi Cepat (Nanti dihubungkan ke Modal Form Anggota 2) */}
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="btn-manual-add"
            title="Tambah lamaran secara manual"
          >
            <Plus size={15} />
            <span>Catat Lamaran</span>
          </button>
        </div>
      </header>
      {/* Banner Bentrok Jadwal Interview */}
      <InterviewConflictBanner applications={applications} />

      {/* Tab 1: Fitur Anggota 1 (Profil Skill & Eksplorasi Lowongan) */}
      {activeTab === "explore" && (
        <>
          <section className="page-header">
            <div>
              <p className="page-eyebrow">Tahap 1 • Pencarian & Pencocokan</p>
              <h2 className="page-title">Eksplorasi Lowongan Magang</h2>
              <p className="page-subtitle">
                Atur skill kamu di panel kiri, lalu simpan lowongan dengan kecocokan
                terbaik ke Wishlist.
              </p>
            </div>

            <div className="quick-metrics">
              <div className="metric-pill">
                <span>Skill Profil:</span>
                <strong>{kaptenSkills.length}</strong>
              </div>
              <div className="metric-pill">
                <span>Tersimpan di Wishlist:</span>
                <strong>{applications.length}</strong>
              </div>
            </div>
          </section>

          <main className="main-layout">
            <SkillProfileSidebar
              skills={kaptenSkills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              jobSource={jobSource}
              onChangeJobSource={setJobSource}
            />

            <JobExplorer
              kaptenSkills={kaptenSkills}
              applications={applications}
              jobSource={jobSource}
              onChangeJobSource={setJobSource}
              onSaveToWishlist={handleSaveToWishlist}
            />
          </main>
        </>
      )}

      {/* Slot Integrasi Anggota 2: War Room Pipeline */}
      {activeTab === "pipeline" && (
        <WarRoom
          applications={applications}
          kaptenSkills={kaptenSkills}
          onAdd={() => setIsFormOpen(true)}
          onDelete={deleteApplication}
          onSimulateGhosting={handleSimulateGhosting}
        />
      )}

      {/* Slot Integrasi Anggota 3: Offer Comparator */}
      {activeTab === "comparator" && (
        <section className="module-placeholder">
          <div className="placeholder-card">
            <h2>Bandingkan Offer Magang ({offerCount} Offer)</h2>
            <p>
              Area ini disiapkan untuk komponen Offer Comparator milik Anggota 3
              untuk membandingkan dua tawaran magang secara objektif.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className="btn-primary"
            >
              Kembali ke Eksplorasi Lowongan
            </button>
          </div>
        </section>
      )}

      {/* Form Tambah Lamaran Manual */}
      {isFormOpen && (
        <ApplicationForm
          applications={applications}
          onAdd={handleAddApplication}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Undo Delete Toast */}
      {deleted && (
        <UndoToast
          application={deleted.application}
          onUndo={undoDelete}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}

export default App;