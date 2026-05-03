import type { AgentConfig, AppConfig } from '@/types';
import { LINK_TYPE } from '@/types';

/**
 * Preview 模式预设 agent 列表。
 *
 * 所有 agent 都标记 `detected: true`，让 UI 呈现"已识别全部主流 Agent"的完整视觉，
 * 避免访客以为应用"只支持 xx"。
 */
export const PREVIEW_AGENTS: AgentConfig[] = [
  {
    name: 'claude',
    display_name: 'Claude Code',
    path: '~/.claude',
    skills_path: 'skills',
    enabled: true,
    detected: true,
  },
  {
    name: 'cursor',
    display_name: 'Cursor',
    path: '~/.cursor',
    skills_path: 'skills',
    enabled: true,
    detected: true,
  },
  {
    name: 'codex',
    display_name: 'Codex',
    path: '~/.codex',
    skills_path: 'skills',
    enabled: true,
    detected: true,
  },
];

export const PREVIEW_APP_CONFIG: AppConfig = {
  linking_strategy: LINK_TYPE.Symlink,
  agents: PREVIEW_AGENTS,
  skill_hide_prefixes: [],
  pinned_skills: ['pinned-demo'],
};
