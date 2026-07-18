export const ADMIN_TABS = ["overview", "content", "member", "api", "status", "activity", "setting"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

export function resolveAdminTab(value: string | null | undefined): AdminTab {
  return ADMIN_TABS.includes(value as AdminTab) ? value as AdminTab : "overview";
}

export function tabNeedsDashboardData(tab: AdminTab) {
  return tab === "overview" || tab === "member" || tab === "activity" || tab === "setting";
}

export function addVisitedTab(visited: ReadonlySet<AdminTab>, tab: AdminTab): ReadonlySet<AdminTab> {
  if (visited.has(tab)) return visited;
  return new Set([...visited, tab]);
}
