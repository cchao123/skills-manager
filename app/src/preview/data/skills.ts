import type { SkillMetadata } from '@/types';

/**
 * Preview 模式预设技能。
 *
 * 选取原则：
 * - 覆盖所有 source（global/root、claude、cursor、codex）
 * - 覆盖所有主开关状态（off / nativeOnly / on）
 * - 内容贴合真实用户的 skills 生态（lark-*、create-*、canvas 等）
 * - 数量控制在 ~15，首屏一次加载完毕，凸显列表 + 分组交互
 */

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const mk = (partial: Partial<SkillMetadata> & Pick<SkillMetadata, 'id' | 'name' | 'description'>): SkillMetadata => ({
  id: partial.id,
  name: partial.name,
  description: partial.description,
  category: partial.category ?? 'general',
  enabled: partial.enabled ?? false,
  agent_enabled: partial.agent_enabled ?? {},
  is_collected: partial.is_collected,
  author: partial.author,
  version: partial.version ?? '1.0.0',
  size: partial.size,
  installed_at: partial.installed_at ?? daysAgo(30),
  last_updated: partial.last_updated ?? daysAgo(3),
  sources: partial.sources ?? ['global'],
  primary: partial.primary ?? 'global',
  open: partial.open ?? [],
  source_paths: partial.source_paths ?? { global: '~/.skills-manager/skills/' + partial.id },
});

export const PREVIEW_SKILLS: SkillMetadata[] = [
  mk({
    id: 'pinned-demo',
    name: 'pinned-demo',
    description: '这是一个置顶 skill，右键可取消置顶',
    category: 'demo',
    author: 'demo',
    sources: ['global'],
    is_collected: true,
    size: 1_000,
    installed_at: daysAgo(1),
    last_updated: daysAgo(0),
    
  }),
  mk({
    id: 'canvas',
    name: 'canvas',
    description: '让 Agent 把分析结果渲染成可交互的 React Canvas 界面，而不是塞进一大段 Markdown。',
    category: 'visualization',
    author: 'Cursor',
    sources: ['global', 'cursor'],
    primary: 'cursor',
    open: ['cursor'],
    agent_enabled: { cursor: true },
    size: 38_000,
    source_paths: {
      global: '~/.skills-manager/skills/canvas',
      cursor: '~/.cursor/skills/canvas',
    },
  }),
  mk({
    id: 'commit',
    name: 'commit',
    description: '引导 Agent 按约定式提交规范撰写 git commit message，支持 scope、中文/英文双语。',
    category: 'development',
    author: 'cchao123',
    sources: ['global', 'claude', 'cursor'],
    primary: 'global',
    open: ['claude', 'cursor'],
    agent_enabled: { claude: true, cursor: true },
    size: 12_400,
    source_paths: {
      global: '~/.skills-manager/skills/commit',
      claude: '~/.claude/skills/commit',
      cursor: '~/.cursor/skills/commit',
    },
  }),
  mk({
    id: 'lark-base',
    name: 'lark-base',
    description: '用 lark-cli 操作飞书多维表格 Base：建表 / 字段 / 记录读写 / 视图 / 公式字段。',
    category: 'integration',
    sources: ['global'],
    agent_enabled: {},
    size: 78_200,
  }),
  mk({
    id: 'lark-calendar',
    name: 'lark-calendar',
    description: '飞书日历：查看日程、预订会议室、查询忙闲、RSVP。包含 +agenda / +create 快捷命令。',
    category: 'integration',
    sources: ['global', 'claude'],
    primary: 'global',
    open: ['claude'],
    agent_enabled: { claude: true },
    size: 54_800,
    source_paths: {
      global: '~/.skills-manager/skills/lark-calendar',
      claude: '~/.claude/skills/lark-calendar',
    },
  }),
  mk({
    id: 'lark-doc',
    name: 'lark-doc',
    description: '飞书云文档：创建 / 读取 / 编辑飞书文档，上传图片附件，搜索云空间文档。',
    category: 'integration',
    sources: ['global', 'claude', 'cursor'],
    primary: 'global',
    open: ['claude'],
    agent_enabled: { claude: true },
    size: 62_100,
    source_paths: {
      global: '~/.skills-manager/skills/lark-doc',
      claude: '~/.claude/skills/lark-doc',
      cursor: '~/.cursor/skills/lark-doc',
    },
  }),
  mk({
    id: 'lark-im',
    name: 'lark-im',
    description: '飞书即时通讯：收发消息、管理群聊、搜索聊天记录、下载聊天文件。',
    category: 'integration',
    sources: ['global'],
    size: 41_300,
  }),
  mk({
    id: 'lark-whiteboard',
    name: 'lark-whiteboard',
    description: '飞书画板：用 PlantUML / Mermaid 代码快速生成架构图、流程图、时序图。',
    category: 'visualization',
    sources: ['global', 'claude'],
    primary: 'global',
    open: ['claude'],
    agent_enabled: { claude: true },
    size: 36_900,
    source_paths: {
      global: '~/.skills-manager/skills/lark-whiteboard',
      claude: '~/.claude/skills/lark-whiteboard',
    },
  }),
  mk({
    id: 'create-skill',
    name: 'create-skill',
    description: '手把手引导用户创建高质量的 Agent Skill：SKILL.md 结构、命名规范、最佳实践。',
    category: 'meta',
    author: 'cursor-public',
    sources: ['global', 'cursor'],
    primary: 'cursor',
    open: ['cursor'],
    agent_enabled: { cursor: true },
    size: 18_600,
    source_paths: {
      global: '~/.skills-manager/skills/create-skill',
      cursor: '~/.cursor/skills/create-skill',
    },
  }),
  mk({
    id: 'create-rule',
    name: 'create-rule',
    description: '为 Cursor 创建持久化的 AI 指导规则：编码规范、项目约定、文件模式匹配。',
    category: 'meta',
    sources: ['global', 'cursor'],
    primary: 'cursor',
    // Native 目录已在，但未显式开启 → nativeOnly 状态
    open: [],
    agent_enabled: { cursor: true },
    size: 14_200,
    source_paths: {
      global: '~/.skills-manager/skills/create-rule',
      cursor: '~/.cursor/skills/create-rule',
    },
  }),
  mk({
    id: 'create-hook',
    name: 'create-hook',
    description: '创建 Cursor hooks：编写 hooks.json、添加钩子脚本、围绕 Agent 事件自动化行为。',
    category: 'meta',
    sources: ['global'],
    size: 9_800,
  }),
  mk({
    id: 'weather',
    name: 'weather',
    description: '获取实时天气和多日预报，无需 API key。支持按城市、经纬度查询。',
    category: 'utility',
    author: 'cchao-skills',
    sources: ['global', 'claude'],
    primary: 'global',
    open: ['claude'],
    agent_enabled: { claude: true },
    size: 7_200,
    source_paths: {
      global: '~/.skills-manager/skills/weather',
      claude: '~/.claude/skills/weather',
    },
  }),
  mk({
    id: 'writing-plans',
    name: 'writing-plans',
    description: '面对多步骤任务时，在动手写代码前先完成一份规范的实施计划。',
    category: 'workflow',
    author: 'cursor-public/superpowers',
    sources: ['global', 'cursor'],
    primary: 'cursor',
    open: ['cursor'],
    agent_enabled: { cursor: true },
    size: 11_500,
    source_paths: {
      global: '~/.skills-manager/skills/writing-plans',
      cursor: '~/.cursor/skills/writing-plans',
    },
  }),
  mk({
    id: 'systematic-debugging',
    name: 'systematic-debugging',
    description: '遇到 bug / 测试失败 / 异常行为时的系统化排查法，在提出修复方案之前使用。',
    category: 'workflow',
    sources: ['global'],
    size: 13_800,
  }),
  mk({
    id: 'test-driven-development',
    name: 'test-driven-development',
    description: '实现任何功能或修复之前，先写好测试。经典 TDD 工作流的 Agent 版实现。',
    category: 'workflow',
    sources: ['global', 'codex'],
    primary: 'codex',
    open: ['codex'],
    agent_enabled: { codex: true },
    size: 10_200,
    source_paths: {
      global: '~/.skills-manager/skills/test-driven-development',
      codex: '~/.codex/skills/test-driven-development',
    },
  }),
  mk({
    id: 'statusline',
    name: 'statusline',
    description: 'Cursor CLI 自定义状态栏：给 prompt 上方添加 session context 和实时信息。',
    category: 'customization',
    sources: ['global', 'cursor'],
    primary: 'cursor',
    open: ['cursor'],
    agent_enabled: { cursor: true },
    size: 5_600,
    source_paths: {
      global: '~/.skills-manager/skills/statusline',
      cursor: '~/.cursor/skills/statusline',
    },
  }),
];

/** 预设 SKILL.md 内容，用于详情弹窗。可按 id 返回不同模板，简化起见预览环境共用。 */
export const PREVIEW_SKILL_CONTENT = (skill: SkillMetadata): string => `---
name: ${skill.name}
description: ${skill.description}
${skill.author ? `author: ${skill.author}\n` : ''}version: ${skill.version ?? '1.0.0'}
---

# ${skill.name}

${skill.description}

## 使用场景

这是一条 **在线预览环境的示例技能**。在桌面版 Skills Manager 中，这里会展示真实的 \`SKILL.md\`
内容 —— 包括调用方法、参数、示例、边界条件等完整说明。

## 下载桌面版体验完整功能

- 一键开关：把技能链接 / 复制到任意 AI Agent 原生目录
- 多 Agent 联动：同一条技能同步到 Claude Code / Cursor / Codex
- GitHub 备份：技能库一键推送到你自己的私有仓库

---

*当前为在线预览，所有数据均为内存 mock，关闭页面后不会留下痕迹。*
`;
