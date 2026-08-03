import { studyGroups } from "@/data/study-groups";
import type { StudyGroup } from "@/types/study-group";

const MOCK_LATENCY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

/**
 * Mock data-access layer shaped like a future REST client — mirrors
 * `lib/roadmap/roadmap-service.ts` so swapping the body for a real `fetch`
 * doesn't change any call site.
 */
export const studyGroupService = {
  async getAll(): Promise<StudyGroup[]> {
    return delay(studyGroups);
  },
  async getById(id: string): Promise<StudyGroup | undefined> {
    return delay(studyGroups.find((g) => g.id === id));
  },
};

/** Case- and whitespace-insensitive invite-code lookup, so "  nmlt-basic " resolves. */
export function findGroupByCode(groups: StudyGroup[], rawCode: string): StudyGroup | undefined {
  const code = rawCode.trim().toLowerCase();
  if (!code) return undefined;
  return groups.find((g) => g.code.toLowerCase() === code);
}

/** Vietnamese-safe slug: strip diacritics, fold đ, keep only a-z0-9 and dashes. */
export function slugifyGroupName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Two-letter mono tile from the group name, matching the tile convention in `data/study-groups.ts`. */
function tileFromName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "{ }";
}

/**
 * Shapes a brand-new group the way the API would return it after a create call.
 * ponytail: pure builder, no persistence — the caller holds it in state. Swap for
 * `studyGroupService.create()` once there's a backend to write to.
 */
export function createGroupDraft(name: string, description: string, ownerName: string): StudyGroup {
  const trimmed = name.trim();
  const slug = slugifyGroupName(trimmed);
  return {
    id: slug || `nhom-${Date.now()}`,
    tile: tileFromName(trimmed),
    name: trimmed,
    description: description.trim() || "Chưa có mô tả cho nhóm này.",
    code: (slug || "nhom").toUpperCase(),
    topic: "Chưa đặt chủ đề",
    memberCount: 1,
    openTaskCount: 0,
    progressPercent: 0,
    lastActiveMinutesAgo: 0,
    role: "owner",
    ownerName,
  };
}
