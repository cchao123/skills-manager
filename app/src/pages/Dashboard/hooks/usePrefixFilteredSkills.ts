import { useMemo } from 'react';
import type { SkillMetadata } from '@/types';
import { matchesAnyPrefix, useSkillHidePrefixes } from '@/hooks/useSkillHidePrefixes';
import { SOURCE } from '@/pages/Dashboard/utils/source';

/**
 * 只应用前缀过滤，不应用搜索和类型过滤
 * 同时按 id 去重（每个 id 只保留优先级最高的一个 skill）
 * 用于 StatsBar 统计，确保统计数字反映用户隐藏的技能
 */
export const usePrefixFilteredSkills = (skills: SkillMetadata[]) => {
  const { prefixes: hidePrefixes } = useSkillHidePrefixes();

  const prefixFilteredSkills = useMemo(() => {
    // 第一步：应用前缀过滤
    const filtered = skills.filter((skill) => {
      return !matchesAnyPrefix(skill.id, hidePrefixes);
    });

    // 第二步：按 id 去重，保留优先级最高的 skill
    const byId = new Map<string, SkillMetadata>();
    for (const skill of filtered) {
      const existing = byId.get(skill.id);
      if (!existing) {
        byId.set(skill.id, skill);
      } else {
        // 比较优先级：Global > Claude > 其他
        const sourcePriority = (s: string) => {
          if (s === SOURCE.Global) return 0;
          if (s === SOURCE.Claude) return 1;
          return 2;
        };
        const existingPriority = sourcePriority(existing.source ?? SOURCE.Global);
        const newPriority = sourcePriority(skill.source ?? SOURCE.Global);
        if (newPriority < existingPriority) {
          byId.set(skill.id, skill);
        }
      }
    }

    return Array.from(byId.values());
  }, [skills, hidePrefixes]);

  return prefixFilteredSkills;
};
