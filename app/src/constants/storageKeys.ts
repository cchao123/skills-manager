/** sessionStorage 键名 — 勿随意改动，以免用户会话状态丢失 */

export const SESSION_STORAGE_KEYS = {
  settingsInitialTab: 'settingsInitialTab',
  githubTipDismissed: 'githubTipDismissed',
  dashboardViewMode: 'skills-manager:dashboard:viewMode',
  /** v2：默认来源 global，与旧键分离 */
  dashboardSelectedSourceV2: 'skills-manager:dashboard:selectedSourceV2',
} as const;
