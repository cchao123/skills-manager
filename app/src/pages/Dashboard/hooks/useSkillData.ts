import { useState, useEffect, useCallback, useRef } from 'react';
import { skillsApi, agentsApi } from '@/api/tauri';
import type { SkillMetadata, AgentConfig } from '@/types';
import { isTauri } from '@/lib/tauri-env';

/**
 * 修正技能的矛盾状态
 * 规则1: 主开关 ON 但没有任何 agent 启用 → 主开关改为 OFF
 * 规则2: 主开关 OFF 但有 agent 启用 → 主开关改为 ON
 */
const fixSkillState = (skill: SkillMetadata): SkillMetadata => {
  const enabledAgentCount = Object.values(skill.agent_enabled || {}).filter(Boolean).length;
  const needsFix = (skill.enabled === true && enabledAgentCount === 0) ||
                   (skill.enabled === false && enabledAgentCount > 0);

  if (!needsFix) return skill;

  const newEnabled = enabledAgentCount > 0;
  if (import.meta.env.DEV) {
    console.log(`[State Fix] ${skill.name}: enabled ${skill.enabled} → ${newEnabled} (agents: ${enabledAgentCount})`);
  }

  return { ...skill, enabled: newEnabled };
};

export const useSkillData = () => {
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isTauri()) {
        throw new Error('Not running in Tauri environment');
      }

      if (import.meta.env.DEV) console.log('Loading skills from API...');
      const data = await skillsApi.list();
      if (import.meta.env.DEV) console.log('Skills loaded from API:', data);

      // Fix contradictory states
      const correctedData = data.map(fixSkillState);

      const fixedCount = correctedData.filter((s, i) => s.enabled !== data[i].enabled).length;
      if (fixedCount > 0 && import.meta.env.DEV) {
        console.log(`[State Fix] Fixed ${fixedCount} skills with inconsistent states`);
      }

      setSkills(correctedData);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      if (import.meta.env.DEV) console.log('Detecting agents...');
      const agentsData = await agentsApi.detect();
      if (import.meta.env.DEV) console.log('Agents detected:', agentsData);
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to detect agents:', error);
    }
  }, []);

  // 静默刷新：只更新数据，不触发 loading（用于窗口重新获得焦点等场景）
  const refreshSkills = useCallback(async () => {
    try {
      if (!isTauri()) return;

      const data = await skillsApi.list();
      const correctedData = data.map(fixSkillState);

      const fixedCount = correctedData.filter((s, i) => s.enabled !== data[i].enabled).length;
      if (fixedCount > 0 && import.meta.env.DEV) {
        console.log(`[State Fix] Refresh: Fixed ${fixedCount} skills with inconsistent states`);
      }

      setSkills(correctedData);
    } catch (err) {
      console.error('Failed to refresh skills:', err);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) console.log('Dashboard mounted, loading skills and agents...');
    loadSkills();
    loadAgents();
  }, []);

  // 启动时检查并修正后端矛盾状态（只执行一次）
  const hasFixedBackendRef = useRef(false);
  useEffect(() => {
    if (hasFixedBackendRef.current || skills.length === 0 || agents.length === 0) {
      return;
    }

    hasFixedBackendRef.current = true;

    const fixBackendState = async () => {
      const inconsistentSkills = skills.filter(skill => {
        const enabledAgentCount = Object.values(skill.agent_enabled || {}).filter(Boolean).length;
        return (skill.enabled === true && enabledAgentCount === 0) ||
               (skill.enabled === false && enabledAgentCount > 0);
      });

      if (inconsistentSkills.length === 0) {
        if (import.meta.env.DEV) console.log('[State Fix] No inconsistent states found');
        return;
      }

      console.log(`[State Fix] Found ${inconsistentSkills.length} skills with inconsistent states, fixing backend...`);

      // 修正每个矛盾技能的后端状态
      for (const skill of inconsistentSkills) {
        const enabledAgentCount = Object.values(skill.agent_enabled || {}).filter(Boolean).length;
        const newEnabled = enabledAgentCount > 0;

        // 如果主开关应该是 OFF，禁用所有 agents
        if (newEnabled === false) {
          const agentsToDisable = Object.keys(skill.agent_enabled || {}).filter(
            agent => skill.agent_enabled[agent] === true
          );
          for (const agent of agentsToDisable) {
            try {
              await skillsApi.disable(skill.id, agent, skill.source);
              console.log(`[State Fix] Disabled ${skill.name} for agent ${agent}`);
            } catch (error) {
              console.error(`[State Fix] Failed to disable ${skill.name} for agent ${agent}:`, error);
            }
          }
        }
        // 如果主开关应该是 ON，启用所有 agents
        else {
          // 获取所有可用的 agents
          const availableAgents = agents
            .filter(agent => agent.detected && agent.enabled)
            .map(agent => agent.name);

          for (const agent of availableAgents) {
            try {
              await skillsApi.enable(skill.id, agent, skill.source);
              console.log(`[State Fix] Enabled ${skill.name} for agent ${agent}`);
            } catch (error) {
              console.error(`[State Fix] Failed to enable ${skill.name} for agent ${agent}:`, error);
            }
          }
        }
      }

      console.log('[State Fix] Backend state fixed, reloading skills...');
      loadSkills();
    };

    fixBackendState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills.length, agents.length]); // 只在 skills 和 agents 数量变化时执行

  // 窗口重新获得焦点时静默同步列表（托盘唤起、Alt+Tab、拖动标题栏时 Windows 可能多次触发 focus）
  const focusRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const scheduleRefresh = () => {
      if (focusRefreshTimerRef.current) {
        clearTimeout(focusRefreshTimerRef.current);
      }
      focusRefreshTimerRef.current = setTimeout(() => {
        focusRefreshTimerRef.current = null;
        void refreshSkills();
        void loadAgents();
      }, 250);
    };

    window.addEventListener('focus', scheduleRefresh);
    return () => {
      window.removeEventListener('focus', scheduleRefresh);
      if (focusRefreshTimerRef.current) {
        clearTimeout(focusRefreshTimerRef.current);
        focusRefreshTimerRef.current = null;
      }
    };
  }, [refreshSkills, loadAgents]);

  return {
    skills,
    setSkills,
    agents,
    loading,
    error,
    loadSkills,
    refreshSkills,
    loadAgents,
  };
};
