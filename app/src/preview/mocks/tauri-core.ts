/**
 * Mock for `@tauri-apps/api/core`.
 *
 * 把业务代码里所有 `invoke(cmd, args)` 调用分发到一个 in-memory store，
 * 让 `api/tauri.ts` 完全无感地运行在浏览器预览环境里。
 *
 * 设计原则：
 * - 所有写操作修改内存 + 同步到 sessionStorage，刷新页面后保留一会儿，关闭标签后丢弃
 * - 对浏览器无法实现的命令（打开系统文件夹、Tauri 窗口主题、系统托盘）返回成功但不执行
 * - 对可能抛错的命令（GitHub API）返回合理的空态
 */

import type { SkillMetadata, AppConfig, AgentConfig, GitHubConfig, SkillFileEntry, LinkType } from '@/types';
import { PREVIEW_SKILLS, PREVIEW_SKILL_CONTENT } from '../data/skills';
import { PREVIEW_AGENTS, PREVIEW_APP_CONFIG } from '../data/agents';

const STORAGE_KEY = 'preview:skills-v2';
const CONFIG_KEY = 'preview:config-v2';

type State = {
  skills: SkillMetadata[];
  config: AppConfig;
};

function deepClone<T>(v: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

function loadState(): State {
  try {
    const skillsRaw = sessionStorage.getItem(STORAGE_KEY);
    const configRaw = sessionStorage.getItem(CONFIG_KEY);
    return {
      skills: skillsRaw ? JSON.parse(skillsRaw) : deepClone(PREVIEW_SKILLS),
      config: configRaw ? JSON.parse(configRaw) : deepClone(PREVIEW_APP_CONFIG),
    };
  } catch {
    return { skills: deepClone(PREVIEW_SKILLS), config: deepClone(PREVIEW_APP_CONFIG) };
  }
}

const state: State = loadState();

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.skills));
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
  } catch {
    /* quota exceeded or private mode — preview still works in memory */
  }
}

function findSkill(id: string): SkillMetadata | undefined {
  return state.skills.find((s) => s.id === id);
}

/** 派生 agent_enabled：native source 存在 ⇒ true；否则看 `open` 数组 */
function recomputeAgentEnabled(skill: SkillMetadata) {
  const map: Record<string, boolean> = {};
  for (const s of skill.sources) {
    if (s !== 'global') map[s] = true;
  }
  for (const o of skill.open) {
    map[o] = true;
  }
  skill.agent_enabled = map;
}

function simulateLatency<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------- 命令实现 ----------------

const handlers: Record<string, (args: Record<string, unknown>) => unknown | Promise<unknown>> = {
  // ---- skills ----
  list_skills: () => simulateLatency(state.skills),
  rescan_skills: () => simulateLatency(state.skills),

  enable_skill: ({ skillId, agent }) => {
    const sk = findSkill(String(skillId));
    if (!sk) throw new Error(`Skill ${skillId} not found`);
    if (!agent) {
      // 全部开启：所有已声明的 agent 都加进 open
      for (const a of PREVIEW_AGENTS.map((x) => x.name)) {
        if (!sk.open.includes(a) && !sk.sources.includes(a)) sk.open.push(a);
      }
    } else {
      const a = String(agent);
      if (!sk.open.includes(a) && !sk.sources.includes(a)) sk.open.push(a);
    }
    recomputeAgentEnabled(sk);
    persist();
    return simulateLatency(undefined);
  },

  disable_skill: ({ skillId, agent }) => {
    const sk = findSkill(String(skillId));
    if (!sk) throw new Error(`Skill ${skillId} not found`);
    if (!agent) {
      sk.open = [];
    } else {
      const a = String(agent);
      sk.open = sk.open.filter((x) => x !== a);
    }
    recomputeAgentEnabled(sk);
    persist();
    return simulateLatency(undefined);
  },

  set_skill_primary: ({ skillId, newPrimary }) => {
    const sk = findSkill(String(skillId));
    if (!sk) throw new Error(`Skill ${skillId} not found`);
    sk.primary = String(newPrimary);
    persist();
    return simulateLatency(undefined);
  },

  get_skill_content: ({ skillId }) => {
    const sk = findSkill(String(skillId));
    if (!sk) throw new Error(`Skill ${skillId} not found`);
    return simulateLatency(PREVIEW_SKILL_CONTENT(sk));
  },

  get_skill_files: ({ skillId }): Promise<SkillFileEntry[]> => {
    const sk = findSkill(String(skillId));
    if (!sk) return simulateLatency([] as SkillFileEntry[]);
    const base = `~/.skills-manager/skills/${sk.id}`;
    const tree: SkillFileEntry[] = [
      {
        name: 'SKILL.md',
        path: `${base}/SKILL.md`,
        is_dir: false,
        size: 3200,
      },
      {
        name: 'references',
        path: `${base}/references`,
        is_dir: true,
        children: [
          { name: 'usage.md', path: `${base}/references/usage.md`, is_dir: false, size: 1800 },
          { name: 'examples.md', path: `${base}/references/examples.md`, is_dir: false, size: 2400 },
        ],
      },
    ];
    return simulateLatency(tree);
  },

  read_skill_file: ({ skillId, filePath }) => {
    const sk = findSkill(String(skillId));
    if (!sk) return simulateLatency('');
    if (String(filePath).endsWith('SKILL.md')) return simulateLatency(PREVIEW_SKILL_CONTENT(sk));
    return simulateLatency(
      `# ${String(filePath).split('/').pop()}\n\n> 预览环境示例内容。桌面版会展示 skill 真实文件内容。\n`,
    );
  },

  delete_skill: ({ skillId, source }) => {
    const sk = findSkill(String(skillId));
    if (!sk) return simulateLatency(undefined);
    if (!source) {
      // 全删
      state.skills = state.skills.filter((s) => s.id !== sk.id);
    } else {
      const src = String(source);
      sk.sources = sk.sources.filter((s) => s !== src);
      sk.open = sk.open.filter((s) => s !== src);
      if (sk.source_paths[src]) delete sk.source_paths[src];
      if (sk.primary === src) sk.primary = sk.sources[0] ?? 'global';
      if (sk.sources.length === 0) {
        state.skills = state.skills.filter((s) => s.id !== sk.id);
      } else {
        recomputeAgentEnabled(sk);
      }
    }
    persist();
    return simulateLatency(undefined);
  },

  import_skill_folder: () => {
    // 预览环境无文件系统，统一报可读错误，业务代码里已经处理了冲突提示
    return Promise.reject(
      '在线预览暂不支持拖拽导入（浏览器无法访问本地文件系统）。请下载桌面版体验完整导入流程。',
    );
  },

  // ---- agents / config ----
  get_agents: () => simulateLatency(state.config.agents),
  detect_agents: () => {
    // 全部标记为 detected，视觉上更饱满
    const agents = state.config.agents.map((a: AgentConfig) => ({ ...a, detected: true }));
    return simulateLatency(agents);
  },
  add_agent: ({ agent }) => {
    const a = agent as AgentConfig;
    if (!state.config.agents.find((x) => x.name === a.name)) {
      state.config.agents.push(a);
      persist();
    }
    return simulateLatency(undefined);
  },
  remove_agent: ({ name }) => {
    state.config.agents = state.config.agents.filter((a) => a.name !== String(name));
    persist();
    return simulateLatency(undefined);
  },
  get_config: () => simulateLatency(state.config),
  set_linking_strategy: ({ strategy }) => {
    state.config.linking_strategy = strategy as LinkType;
    persist();
    return simulateLatency(undefined);
  },
  set_skill_hide_prefixes: ({ prefixes }) => {
    state.config.skill_hide_prefixes = (prefixes as string[]) ?? [];
    persist();
    return simulateLatency(undefined);
  },
  get_pinned_skills: () => simulateLatency(state.config.pinned_skills ?? []),
  set_skill_pinned: ({ skillId, pinned }) => {
    const id = String(skillId);
    const current = state.config.pinned_skills ?? [];
    if (pinned) {
      if (!current.includes(id)) {
        state.config.pinned_skills = [...current, id];
      }
    } else {
      state.config.pinned_skills = current.filter((x) => x !== id);
    }
    persist();
    return simulateLatency(undefined);
  },

  // ---- 打开系统文件夹：浏览器里做不到，静默 no-op ----
  open_skills_manager_folder: () => simulateLatency(undefined),
  open_folder: () => simulateLatency(undefined),

  // ---- GitHub：预览环境不走这些路由，给出安全默认值即可 ----
  get_github_config: (): Promise<GitHubConfig> => simulateLatency({ repositories: {} }),
  save_github_config: () => simulateLatency(undefined),
  test_github_connection: () => simulateLatency(undefined),
  sync_github_repo: () => simulateLatency(undefined),
  restore_from_github: () => simulateLatency(0),
  star_github_repo: () => simulateLatency(true),
  check_github_star: () => simulateLatency(false),

  // ---- Tauri 平台杂项：业务代码都有 .catch 兜底，这里 no-op ----
  update_tray_language: () => simulateLatency(undefined),
  set_window_theme: () => simulateLatency(undefined),
};

export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const h = handlers[cmd];
  if (!h) {
    if (import.meta.env.DEV) {
      console.warn(`[preview/mock-invoke] unhandled command: ${cmd}`, args);
    }
    return undefined as T;
  }
  return (await h(args ?? {})) as T;
}

/**
 * 注入 `window.__TAURI__.core.invoke`，让 `lib/tauri-env.ts#isTauri()`
 * 返回 true，业务代码才会真正走 API 调用。否则像 `useSkillData` 这样显式
 * 校验 `isTauri()` 的地方会抛错，Dashboard 拿不到数据。
 */
if (typeof window !== 'undefined') {
  const w = window as unknown as {
    __TAURI__?: { core?: { invoke?: unknown } };
    __PREVIEW__?: boolean;
  };
  w.__TAURI__ = w.__TAURI__ ?? {};
  w.__TAURI__.core = w.__TAURI__.core ?? {};
  w.__TAURI__.core.invoke = invoke;
  // 标记"当前为预览环境"，供 `lib/preview-env.ts#isPreview()` 读取
  w.__PREVIEW__ = true;
}
