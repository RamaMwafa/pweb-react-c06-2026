import { useState, useMemo } from "react";
import { Scale, Award, ArrowRight } from "lucide-react";
import type { Application } from "../types";
import {
  compareOffers,
  type OfferScoreBreakdown,
} from "../utils/offercomparator";
import "./offercomparator.css";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
  onGoToPipeline: () => void;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatScore(score: number): string {
  return score.toFixed(1);
}

function OfferCard({
  breakdown,
  isWinner,
  isTie,
}: {
  breakdown: OfferScoreBreakdown;
  isWinner: boolean;
  isTie: boolean;
}) {
  return (
    <article
      className={`offer-card ${isWinner ? "is-winner" : ""}`}
    >
      <div className="offer-card-head">
        <div>
          <h3 className="offer-company">{breakdown.application.company}</h3>
          <p className="offer-role">{breakdown.application.role}</p>
        </div>

        {isWinner && (
          <span className="offer-winner-badge">
            <Award size={14} />
            Rekomendasi Terbaik
          </span>
        )}

        {isTie && (
          <span className="offer-tie-badge">Skor Seimbang</span>
        )}
      </div>

      <div className="offer-metrics">
        <div className="offer-metric-row">
          <span className="offer-metric-label">Uang Saku / Bulan</span>
          <strong className="offer-metric-value">
            {formatRupiah(breakdown.salary)}
          </strong>
          <span className="offer-metric-score">
            <strong>{formatScore(breakdown.salaryWeighted)}</strong> / 50
          </span>
        </div>

        <div className="offer-metric-row">
          <span className="offer-metric-label">Mode Kerja</span>
          <strong className="offer-metric-value">
            {breakdown.application.workMode} ({breakdown.workModeScore})
          </strong>
          <span className="offer-metric-score">
            <strong>{formatScore(breakdown.workModeWeighted)}</strong> / 25
          </span>
        </div>

        <div className="offer-metric-row">
          <span className="offer-metric-label">Kecocokan Skill</span>
          <strong className="offer-metric-value">
            {breakdown.skillMatchScore}% ({breakdown.matchedSkillsCount} dari{" "}
            {breakdown.requiredSkillsCount} skill)
          </strong>
          <span className="offer-metric-score">
            <strong>{formatScore(breakdown.skillMatchWeighted)}</strong> / 25
          </span>
        </div>
      </div>

      <div className={`offer-total-box ${isWinner ? "is-winner" : ""}`}>
        <span className="offer-total-label">TOTAL SKOR BERBOBOT</span>
        <strong className="offer-total-score">
          {formatScore(breakdown.totalScore)}
        </strong>
      </div>
    </article>
  );
}

export function OfferComparator({
  applications,
  kaptenSkills,
  onGoToPipeline,
}: OfferComparatorProps) {
  const offers = useMemo(
    () => applications.filter((app) => app.status === "OFFER"),
    [applications]
  );

  const [selectedAId, setSelectedAId] = useState<string>("");
  const [selectedBId, setSelectedBId] = useState<string>("");

  if (offers.length < 2) {
    return (
      <main className="comparator-page">
        <section className="comparator-empty-card">
          <div className="comparator-empty-icon">
            <Scale size={32} />
          </div>
          <h2>Belum Cukup Offer untuk Dibandingkan</h2>
          <p>
            Saat ini Kapten memiliki{" "}
            <strong>{offers.length} lamaran berstatus OFFER</strong>. Minimal
            diperlukan <strong>2 lamaran berstatus OFFER</strong> untuk
            membandingkan uang saku, mode kerja, dan kecocokan skill secara
            objektif.
          </p>
          <button
            type="button"
            className="comparator-cta-btn"
            onClick={onGoToPipeline}
          >
            <span>Kelola Lamaran di War Room</span>
            <ArrowRight size={15} />
          </button>
        </section>
      </main>
    );
  }

  const effectiveOfferA =
    offers.find((item) => item.id === selectedAId) ?? offers[0];

  const effectiveOfferB =
    offers.find(
      (item) => item.id === selectedBId && item.id !== effectiveOfferA.id
    ) ??
    offers.find((item) => item.id !== effectiveOfferA.id) ??
    offers[1];

  const comparison = compareOffers(
    effectiveOfferA,
    effectiveOfferB,
    kaptenSkills
  );

  return (
    <main className="comparator-page">
      <header className="comparator-header">
        <div>
          <p className="page-eyebrow">Tahap 3 • Analisis Keputusan</p>
          <h2 className="page-title">Bandingkan Offer Magang</h2>
          <p className="page-subtitle">
            Bobot penilaian: Uang Saku 50% • Mode Kerja 25% • Kecocokan Skill
            25%
          </p>
        </div>

        <div className="comparator-selectors">
          <label className="selector-group">
            <span className="sr-only">Pilih Offer A</span>
            <select
              aria-label="Pilih Offer A"
              value={effectiveOfferA.id}
              onChange={(e) => {
                const nextA = e.target.value;
                setSelectedAId(nextA);
                if (nextA === effectiveOfferB.id) {
                  setSelectedBId(effectiveOfferA.id);
                }
              }}
            >
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  Offer A: {offer.company} — {offer.role}
                </option>
              ))}
            </select>
          </label>

          <span className="selector-vs">vs</span>

          <label className="selector-group">
            <span className="sr-only">Pilih Offer B</span>
            <select
              aria-label="Pilih Offer B"
              value={effectiveOfferB.id}
              onChange={(e) => {
                const nextB = e.target.value;
                setSelectedBId(nextB);
                if (nextB === effectiveOfferA.id) {
                  setSelectedAId(effectiveOfferB.id);
                }
              }}
            >
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  Offer B: {offer.company} — {offer.role}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="comparator-grid" aria-label="Perbandingan Dua Offer">
        <OfferCard
          breakdown={comparison.a}
          isWinner={comparison.winner === "A"}
          isTie={comparison.winner === "TIE"}
        />
        <OfferCard
          breakdown={comparison.b}
          isWinner={comparison.winner === "B"}
          isTie={comparison.winner === "TIE"}
        />
      </section>
    </main>
  );
}
