import type { JobListing, JobSource } from "../types";

const REMOTIVE_API_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
const LOCAL_FALLBACK_URL = "/magang-fallback.json";

interface RawJobItem {
  id?: unknown;
  title?: unknown;
  company_name?: unknown;
  category?: unknown;
  candidate_required_location?: unknown;
  salary?: unknown;
  tags?: unknown;
}

function normalizeJobItem(raw: RawJobItem, index: number): JobListing {
  return {
    id: typeof raw.id === "number" ? raw.id : Date.now() + index,
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title
        : "Software Engineer Intern",
    company_name:
      typeof raw.company_name === "string" && raw.company_name.trim()
        ? raw.company_name
        : "Perusahaan Tech",
    category:
      typeof raw.category === "string" && raw.category.trim()
        ? raw.category
        : "Software Development",
    candidate_required_location:
      typeof raw.candidate_required_location === "string" &&
      raw.candidate_required_location.trim()
        ? raw.candidate_required_location
        : "Remote",
    salary: typeof raw.salary === "string" ? raw.salary : "",
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter(
          (tag): tag is string => typeof tag === "string" && tag.trim().length > 0
        )
      : [],
  };
}

export async function fetchJobs(
  source: JobSource,
  signal: AbortSignal
): Promise<JobListing[]> {
  const url = source === "remotive" ? REMOTIVE_API_URL : LOCAL_FALLBACK_URL;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Gagal memuat data lowongan (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();

  if (Array.isArray(data)) {
    return data.map((item, idx) => normalizeJobItem(item as RawJobItem, idx));
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "jobs" in data &&
    Array.isArray((data as { jobs: unknown }).jobs)
  ) {
    const jobsList = (data as { jobs: RawJobItem[] }).jobs;
    return jobsList.map((item, idx) => normalizeJobItem(item, idx));
  }

  throw new Error("Format data lowongan tidak valid.");
}