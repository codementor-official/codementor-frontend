import { groupDetail } from "@/data/study-group-detail";
import type { GroupDetail } from "@/types/study-group-detail";

const MOCK_LATENCY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

/**
 * Mock data-access layer for one group's inner content. Every group resolves to the
 * same fixture today — swap the body for a real fetch keyed on `groupId` later.
 */
export const groupDetailService = {
  async get(groupId: string): Promise<GroupDetail> {
    void groupId;
    return delay(groupDetail);
  },
};
