import type { Application, ApplicationStatus, WorkMode } from "../types";

export const ALLOWED_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  WISHLIST: ["APPLIED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  GHOSTED: ["SCREENING"],
  OFFER: [],
  REJECTED: [],
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

export interface TransitionPayload {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  workMode?: WorkMode;
}

export function getAllowedTransitions(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus];
}

export function canTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isFinalStatus(status: ApplicationStatus): boolean {
  return status === "OFFER" || status === "REJECTED";
}

export function validateTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  payload: TransitionPayload
): string | null {
  if (!canTransition(from, to)) {
    return `Transisi status dari ${from} ke ${to} tidak diperbolehkan.`;
  }

  if (to === "APPLIED") {
    if (!payload.cvVersion?.trim()) {
      return "Versi CV wajib diisi sebelum pindah ke status APPLIED.";
    }
    if (!payload.appliedDate?.trim()) {
      return "Tanggal melamar wajib diisi sebelum pindah ke status APPLIED.";
    }
  }

  if (to === "INTERVIEW") {
    if (!payload.interviewDateTime?.trim()) {
      return "Jadwal interview (tanggal & jam) wajib diisi sebelum pindah ke status INTERVIEW.";
    }
  }

  if (to === "OFFER") {
    if (
      typeof payload.salaryOffer !== "number" ||
      Number.isNaN(payload.salaryOffer) ||
      payload.salaryOffer <= 0
    ) {
      return "Nominal uang saku / gaji harus lebih dari 0 sebelum pindah ke status OFFER.";
    }
    if (!payload.workMode) {
      return "Mode kerja wajib dipilih sebelum pindah ke status OFFER.";
    }
  }

  return null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTransitionLogMessage(
  from: ApplicationStatus,
  to: ApplicationStatus,
  payload: TransitionPayload
): string {
  if (to === "APPLIED") {
    return `Lamaran dikirim (CV: ${payload.cvVersion?.trim()}, Tanggal: ${payload.appliedDate})`;
  }
  if (to === "SCREENING") {
    return from === "GHOSTED"
      ? "HRD menghubungi kembali — pindah dari Ghosted ke Screening"
      : "Lolos tahap Screening";
  }
  if (to === "INTERVIEW") {
    return `Pindah ke Interview (jadwal ${formatShortDateTime(payload.interviewDateTime ?? "")})`;
  }
  if (to === "OFFER") {
    return `Menerima Offer (${formatRupiah(payload.salaryOffer ?? 0)} • ${payload.workMode})`;
  }
  if (to === "REJECTED") {
    return `Status berubah dari ${STATUS_LABELS[from]} ke Rejected`;
  }
  if (to === "GHOSTED") {
    return `Ditandai Ghosted (tanpa kabar dari tahap ${STATUS_LABELS[from]})`;
  }
  return `Status berubah ke ${STATUS_LABELS[to]}`;
}

export function applyStatusTransition(
  application: Application,
  targetStatus: ApplicationStatus,
  payload: TransitionPayload
): Application {
  const nowIso = new Date().toISOString();
  const logMessage = buildTransitionLogMessage(
    application.status,
    targetStatus,
    payload
  );

  const nextApplication: Application = {
    ...application,
    status: targetStatus,
    lastUpdatedAt: nowIso,
    activityLogs: [
      {
        id: crypto.randomUUID(),
        timestamp: nowIso,
        message: logMessage,
      },
      ...application.activityLogs,
    ],
  };

  if (targetStatus === "APPLIED") {
    nextApplication.cvVersion = payload.cvVersion?.trim();
    nextApplication.appliedDate = payload.appliedDate?.trim();
  }

  if (targetStatus === "INTERVIEW") {
    nextApplication.interviewDateTime = payload.interviewDateTime?.trim();
  }

  if (targetStatus === "OFFER") {
    nextApplication.salaryOffer = payload.salaryOffer;
    if (payload.workMode) {
      nextApplication.workMode = payload.workMode;
    }
  }

  return nextApplication;
}

export function addChecklistItem(
  application: Application,
  text: string
): Application {
  const trimmed = text.trim();
  if (!trimmed) return application;

  return {
    ...application,
    checklist: [
      ...application.checklist,
      {
        id: crypto.randomUUID(),
        text: trimmed,
        done: false,
      },
    ],
  };
}

export function toggleChecklistItem(
  application: Application,
  itemId: string
): Application {
  return {
    ...application,
    checklist: application.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    ),
  };
}

export function removeChecklistItem(
  application: Application,
  itemId: string
): Application {
  return {
    ...application,
    checklist: application.checklist.filter((item) => item.id !== itemId),
  };
}

export function addActivityNote(
  application: Application,
  note: string
): Application {
  const trimmed = note.trim();
  if (!trimmed) return application;

  const nowIso = new Date().toISOString();

  return {
    ...application,
    activityLogs: [
      {
        id: crypto.randomUUID(),
        timestamp: nowIso,
        message: `Catatan: ${trimmed}`,
      },
      ...application.activityLogs,
    ],
  };
}
