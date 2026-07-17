import { promises as fs } from "fs";
import path from "path";
import type { OutreachLogEntry, VideoPackage } from "@/lib/marketing-studio-shared";

export type { OutreachDraft, OutreachLogEntry, VideoPackage } from "@/lib/marketing-studio-shared";
export {
  parseOutreachLeads,
  videoPackageToUploadText,
} from "@/lib/marketing-studio-shared";

const ROOT = path.join(process.cwd(), "content", "marketing");
const VIDEOS_DIR = path.join(ROOT, "videos");
const OUTREACH_LOG = path.join(ROOT, "outreach-log.json");

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function ensureDirs() {
  await fs.mkdir(VIDEOS_DIR, { recursive: true });
}

export async function writeVideoPackage(pkg: VideoPackage): Promise<void> {
  await ensureDirs();
  const file = path.join(VIDEOS_DIR, `${safeId(pkg.id)}.json`);
  await fs.writeFile(file, JSON.stringify(pkg, null, 2), "utf8");
}

export async function listVideoPackages(): Promise<VideoPackage[]> {
  await ensureDirs();
  const files = (await fs.readdir(VIDEOS_DIR)).filter((f) => f.endsWith(".json"));
  const out: VideoPackage[] = [];
  for (const f of files) {
    try {
      const raw = await fs.readFile(path.join(VIDEOS_DIR, f), "utf8");
      out.push(JSON.parse(raw) as VideoPackage);
    } catch {
      // skip
    }
  }
  return out.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function appendOutreachLog(entry: OutreachLogEntry): Promise<void> {
  await ensureDirs();
  let log: OutreachLogEntry[] = [];
  try {
    const raw = await fs.readFile(OUTREACH_LOG, "utf8");
    log = JSON.parse(raw) as OutreachLogEntry[];
  } catch {
    log = [];
  }
  log.unshift(entry);
  log = log.slice(0, 200);
  await fs.writeFile(OUTREACH_LOG, JSON.stringify(log, null, 2), "utf8");
}

export async function readOutreachLog(): Promise<OutreachLogEntry[]> {
  try {
    const raw = await fs.readFile(OUTREACH_LOG, "utf8");
    return JSON.parse(raw) as OutreachLogEntry[];
  } catch {
    return [];
  }
}
