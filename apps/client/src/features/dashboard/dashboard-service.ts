import { api } from '@/lib/api';

/** Each domain may fail independently; never turn an unavailable statistic into zero. */
export async function withDashboardTimeout<T>(load: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([load(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tải dữ liệu quá lâu. Vui lòng thử lại.')), 15000);
    })]);
  } finally { clearTimeout(timer); }
}

async function section<T>(load: () => Promise<T>): Promise<T | null> {
  try { return await withDashboardTimeout(load); } catch { return null; }
}

export async function loadDashboard() {
  const [learning, assignments, stats, preferences, topics] = await Promise.all([
    section(api.dashboard.learning), section(api.dashboard.assignments),
    section(api.account.stats), section(api.account.preferences), section(api.exercises.topics),
  ]);
  return { learning, assignments, stats, preferences, topics, fetchedAt: Date.now() };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
