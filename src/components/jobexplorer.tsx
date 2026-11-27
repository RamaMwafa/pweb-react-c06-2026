import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  BookmarkPlus,
} from "lucide-react";
import type { Application, JobListing, JobSource } from "../types";
import { fetchJobs } from "../services/jobservice";
import { useDebounce } from "../hooks/usedebounce";
import {
  calculateSkillMatch,
  isDuplicateApplication,
} from "../utils/skillmatch";
import "./jobexplorer.css";

interface JobExplorerProps {
  kaptenSkills: string[];
  applications: Application[];
  jobSource: JobSource;
  onChangeJobSource: (source: JobSource) => void;
  onSaveToWishlist: (job: JobListing) => void;
}

type SortOption = "match-desc" | "default";

function getInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getMatchBadgeClass(score: number): string {
  if (score >= 70) return "match-badge badge-high";
  if (score >= 40) return "match-badge badge-mid";
  return "match-badge badge-low";
}

export function JobExplorer({
  kaptenSkills,
  applications,
  jobSource,
  onChangeJobSource,
  onSaveToWishlist,
}: JobExplorerProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("match-desc");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchJobs(jobSource, controller.signal);
        setJobs(result);
        setSelectedCategory("ALL");
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data lowongan.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      controller.abort();
    };
  }, [jobSource, retryCount]);

  const categories = useMemo(() => {
    const unique = new Set(jobs.map((job) => job.category));
    return Array.from(unique);
  }, [jobs]);

  const enrichedAndFilteredJobs = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    console.log("[Debounce Filter Jalan]:", keyword, new Date().toLocaleTimeString());
    const withMatch = jobs.map((job) => ({
      job,
      match: calculateSkillMatch(kaptenSkills, job.tags),
    }));

    const filtered = withMatch.filter(({ job }) => {
      const matchesCategory =
        selectedCategory === "ALL" || job.category === selectedCategory;

      const matchesKeyword =
        !keyword ||
        job.title.toLowerCase().includes(keyword) ||
        job.company_name.toLowerCase().includes(keyword) ||
        job.tags.some((tag) => tag.toLowerCase().includes(keyword));

      return matchesCategory && matchesKeyword;
    });

    if (sortBy === "match-desc") {
      return [...filtered].sort((a, b) => b.match.score - a.match.score);
    }

    return filtered;
  }, [jobs, kaptenSkills, debouncedSearch, selectedCategory, sortBy]);

  return (
    <section className="explorer-card">
      {/* Toolbar dengan Label Jelas agar Pengguna Cepat Paham */}
      <div className="filter-toolbar">
        <div className="control-group">
          <label htmlFor="job-search-input" className="control-label">
            Cari Lowongan
          </label>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              id="job-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik posisi, perusahaan, atau skill... (tekan /)"
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Hapus pencarian"
                className="search-clear-btn"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="category-select" className="control-label">
            Bidang / Kategori
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort-select" className="control-label">
            Urutkan Berdasarkan
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="match-desc">Kecocokan Tertinggi</option>
            <option value="default">Urutan Default</option>
          </select>
        </div>
      </div>

     {/* Bar Info Jumlah Hasil, Tombol Retry & Legenda Arti Warna */}
      {!isLoading && !error && (
        <div className="results-bar">
          <div className="results-actions">
            <span className="results-summary">
              Menampilkan <strong>{enrichedAndFilteredJobs.length}</strong>{" "}
              lowongan dari{" "}
              <strong>
                {jobSource === "remotive"
                  ? "Remotive API"
                  : "Dataset Magang ID"}
              </strong>
            </span>

            <button
              type="button"
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="btn-retry-inline"
              title="Muat ulang data lowongan"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>

          <div className="legend-group" aria-label="Keterangan warna kecocokan">
            <span className="legend-item">
              <span className="legend-dot dot-high" />
              ≥70% Sangat Cocok
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-mid" />
              40–69% Cukup
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-low" />
              &lt;40% Kurang
            </span>
          </div>
        </div>
      )}
      
      {/* State 1: Loading */}
      {isLoading && (
        <div className="jobs-grid">
          {[1, 2, 3, 4].map((skeleton) => (
            <div key={skeleton} className="skeleton-card">
              <div className="skeleton-row">
                <div
                  className="skeleton-box"
                  style={{ width: "150px", height: "42px" }}
                />
                <div
                  className="skeleton-box"
                  style={{
                    width: "88px",
                    height: "24px",
                    borderRadius: "999px",
                  }}
                />
              </div>
              <div
                className="skeleton-box"
                style={{ width: "75%", height: "22px", marginTop: "16px" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <div
                  className="skeleton-box"
                  style={{ width: "64px", height: "24px" }}
                />
                <div
                  className="skeleton-box"
                  style={{ width: "64px", height: "24px" }}
                />
                <div
                  className="skeleton-box"
                  style={{ width: "64px", height: "24px" }}
                />
              </div>
              <div className="skeleton-row" style={{ marginTop: "22px" }}>
                <div
                  className="skeleton-box"
                  style={{ width: "110px", height: "20px" }}
                />
                <div
                  className="skeleton-box"
                  style={{
                    width: "140px",
                    height: "34px",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error + Coba Lagi / Fallback Lokal */}
      {!isLoading && error && (
        <div className="state-box state-error">
          <AlertCircle size={40} className="state-icon-error" />
          <h3 className="state-title">Gagal Memuat Daftar Lowongan</h3>
          <p className="state-desc">{error}</p>
          <div className="state-actions">
            <button
              type="button"
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="btn-primary"
            >
              <RefreshCw size={15} />
              Coba Lagi
            </button>
            {jobSource !== "local" && (
              <button
                type="button"
                onClick={() => onChangeJobSource("local")}
                className="btn-secondary"
              >
                Gunakan Fallback Lokal
              </button>
            )}
          </div>
        </div>
      )}

      {/* State 3: Empty State */}
      {!isLoading && !error && enrichedAndFilteredJobs.length === 0 && (
        <div className="state-box state-empty">
          <FolderOpen size={40} className="state-icon-empty" />
          <h3 className="state-title">Lowongan Tidak Ditemukan</h3>
          <p className="state-desc">
            Tidak ada lowongan yang sesuai dengan kata kunci atau kategori yang
            dipilih.
          </p>
          {(searchTerm || selectedCategory !== "ALL") && (
            <div className="state-actions">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("ALL");
                }}
                className="btn-secondary"
              >
                Reset Pencarian & Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Daftar Kartu Lowongan dengan 4 Zona Tetap */}
      {!isLoading && !error && enrichedAndFilteredJobs.length > 0 && (
        <div className="jobs-grid">
          {enrichedAndFilteredJobs.map(({ job, match }) => {
            const alreadyApplied = isDuplicateApplication(
              applications,
              job.company_name,
              job.title
            );

            return (
              <article key={job.id} className="job-card">
                <div>
                  {/* Zona 1: Perusahaan & Badge Match Score */}
                  <div className="job-card-header">
                    <div className="company-info">
                      <div className="company-avatar">
                        {getInitials(job.company_name)}
                      </div>
                      <div>
                        <p className="company-name">{job.company_name}</p>
                        <p className="company-location">
                          <MapPin size={12} />
                          <span>{job.candidate_required_location}</span>
                        </p>
                      </div>
                    </div>

                    <span className={getMatchBadgeClass(match.score)}>
                      {match.score}% Match
                    </span>
                  </div>

                  {/* Zona 2: Judul Role */}
                  <h3 className="job-title">{job.title}</h3>

                  {/* Zona 3: Kecocokan Skill */}
                  <div className="skills-section">
                    <p className="skills-caption">
                      {job.tags.length > 0
                        ? `Kecocokan Skill (${match.matchedSkills.length} dari ${job.tags.length} terpenuhi):`
                        : "Persyaratan Skill:"}
                    </p>
                    <div className="job-tags">
                      {job.tags.length === 0 ? (
                        <span className="tag-empty">
                          Tidak ada tag skill spesifik
                        </span>
                      ) : (
                        job.tags.map((tag) => {
                          const isMatched = match.matchedSkills.includes(tag);
                          return (
                            <span
                              key={tag}
                              className={
                                isMatched ? "tag-matched" : "tag-missing"
                              }
                              title={
                                isMatched
                                  ? "Sudah ada di Profil Skill kamu"
                                  : "Belum ada di Profil Skill kamu"
                              }
                            >
                              {isMatched && <Check size={12} />}
                              {tag}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Zona 4: Uang Saku & Tombol Simpan */}
                <div className="job-card-footer">
                  <div className="salary-group">
                    <span className="salary-label">Estimasi Uang Saku</span>
                    <span className="job-salary">
                      {job.salary ? job.salary : "Tidak dicantumkan"}
                    </span>
                  </div>

                  {alreadyApplied ? (
                    <button type="button" disabled className="btn-applied">
                      <CheckCircle2 size={14} />
                      Sudah Dilamar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSaveToWishlist(job)}
                      className="btn-save"
                    >
                      <BookmarkPlus size={14} />
                      Simpan ke Wishlist
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}