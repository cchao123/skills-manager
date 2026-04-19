import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { skillsApi } from '@/api/tauri';
import { useToast } from '@/components/Toast';
import { TelemetryEvent } from '@/constants/events';
import { trackEvent } from '@/lib/telemetry';
import type { SkillMetadata, MergedSkillInfo, AgentConfig } from '@/types';
import { SOURCE } from '@/pages/Dashboard/utils/source';

const matchSkill = (s: SkillMetadata, skill: SkillMetadata) =>
  s.id === skill.id && s.source === skill.source;

export const useSkillActions = (
  _skills: SkillMetadata[],
  setSkills: React.Dispatch<React.SetStateAction<SkillMetadata[]>>,
  agents: AgentConfig[] = []
) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 获取所有可用的 agent 名称
  const availableAgents = agents
    .filter(agent => agent.detected && agent.enabled)
    .map(agent => agent.name);

  const handleToggleSkill = useCallback(async (skill: SkillMetadata) => {
    try {
      const newState = !skill.enabled;

      if (newState === false) {
        console.log('Turning off main switch, disabling all agents');

        // 获取所有启用的 agents
        const agentsToDisable = Object.keys(skill.agent_enabled || {}).filter(
          agent => skill.agent_enabled[agent] === true
        );

        setSkills(prevSkills =>
          prevSkills.map(s =>
            matchSkill(s, skill)
              ? {
                  ...s,
                  enabled: false,
                  agent_enabled: Object.keys(s.agent_enabled || {}).reduce((acc, agent) => {
                    acc[agent] = false;
                    return acc;
                  }, {} as Record<string, boolean>)
                }
              : s
          )
        );

        agentsToDisable.forEach(agent => {
          skillsApi.disable(skill.id, agent, skill.source).then(() => {
            trackEvent(TelemetryEvent.SKILL_DISABLED, { skill_id: skill.id, agent });
          }).catch(error => {
            console.error(`Failed to disable ${skill.id} for agent ${agent}:`, error);
          });
        });
      } else {
        console.log('Turning on main switch, enabling all available agents');

        // 启用所有可用的 agents
        const newAgentStates = availableAgents.reduce((acc, agent) => {
          acc[agent] = true;
          return acc;
        }, {} as Record<string, boolean>);

        setSkills(prevSkills =>
          prevSkills.map(s =>
            matchSkill(s, skill)
              ? {
                  ...s,
                  enabled: true,
                  agent_enabled: newAgentStates
                }
              : s
          )
        );

        availableAgents.forEach(agent => {
          skillsApi.enable(skill.id, agent, skill.source).then(() => {
            trackEvent(TelemetryEvent.SKILL_ENABLED, { skill_id: skill.id, agent });
          }).catch(error => {
            console.error(`Failed to enable ${skill.id} for agent ${agent}:`, error);
          });
        });
      }
    } catch (error) {
      console.error('Failed to toggle skill:', error);
    }
  }, [setSkills, availableAgents]);

  const handleToggleAgent = useCallback(async (skill: SkillMetadata, agentName: string) => {
    try {
      const isEnabled = skill.agent_enabled[agentName];
      const newState = !isEnabled;

      const currentEnabledCount = Object.values(skill.agent_enabled || {}).filter(Boolean).length;
      const newEnabledCount = newState ? currentEnabledCount + 1 : currentEnabledCount - 1;

      const shouldUpdateMainSwitch =
        (newState === true && skill.enabled === false) ||
        (newState === false && newEnabledCount === 0);

      setSkills(prevSkills =>
        prevSkills.map(s =>
          matchSkill(s, skill)
            ? {
                ...s,
                agent_enabled: {
                  ...s.agent_enabled,
                  [agentName]: newState
                },
                enabled: shouldUpdateMainSwitch ? (newEnabledCount > 0) : s.enabled
              }
            : s
        )
      );

      if (isEnabled) {
        console.log(`Disabling skill ${skill.name} for agent ${agentName}`);
        skillsApi.disable(skill.id, agentName, skill.source).then(() => {
          trackEvent(TelemetryEvent.SKILL_AGENT_DISABLED, { skill_id: skill.id, agent: agentName });
        }).catch(error => {
          console.error('Failed to disable skill:', error);
        });
      } else {
        console.log(`Enabling skill ${skill.name} for agent ${agentName}`);
        skillsApi.enable(skill.id, agentName, skill.source).then(() => {
          trackEvent(TelemetryEvent.SKILL_AGENT_ENABLED, { skill_id: skill.id, agent: agentName });
        }).catch(error => {
          console.error('Failed to enable skill:', error);
        });
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    }
  }, [setSkills]);

  /** 合并卡片：toggle 主开关 → 只对 Global 来源执行 */
  const handleToggleSkillMerged = useCallback(async (merged: MergedSkillInfo) => {
    const newState = !merged.primary.enabled;

    // 检查是否会影响原生 agent（关闭时）
    if (newState === false && merged.nativeAgents.size > 0) {
      const agentNames = Array.from(merged.nativeAgents).join('、');
      showToast('warning', t('dashboard.toast.nativeAgentsWarning', { agents: agentNames }));
      return;
    }

    // 只对 Global 来源的技能执行 toggle
    const globalSourceSkill = merged.sourceSkills.find(s => s.source === SOURCE.Global);
    if (globalSourceSkill) {
      await handleToggleSkill(globalSourceSkill);
    } else {
      // 如果没有 Global 来源，就操作第一个
      await handleToggleSkill(merged.sourceSkills[0]);
    }
  }, [handleToggleSkill, showToast]);

  /** 合并卡片：toggle 某个 agent → 找到正确的 sourceSkill 路由 */
  const handleToggleAgentMerged = useCallback(async (merged: MergedSkillInfo, agentName: string) => {
    // 检查是否是 agent 原生技能
    if (merged.nativeAgents.has(agentName)) {
      showToast('warning', t('dashboard.toast.nativeAgentWarning', { agent: agentName }));
      return;
    }

    const sourceSkill = merged.sourceSkills.find(s => s.source === SOURCE.Global)
      || merged.sourceSkills[0];
    await handleToggleAgent(sourceSkill, agentName);
  }, [handleToggleAgent, showToast]);

  const handleDeleteSkill = useCallback(async (skill: SkillMetadata, silent = false) => {
    try {
      await skillsApi.delete(skill.id, skill.source);
      setSkills(prevSkills => prevSkills.filter(s => !matchSkill(s, skill)));
      trackEvent(TelemetryEvent.SKILL_DELETED, { skill_id: skill.id, source: skill.source || 'unknown' });
      if (!silent) showToast('success', t('dashboard.toast.skillDeleted', { name: skill.name }));
      console.log(`Skill ${skill.name} deleted`);
    } catch (error) {
      console.error('Failed to delete skill:', error);
      if (!silent) showToast('error', t('dashboard.toast.skillDeleteFailed'));
    }
  }, [setSkills, showToast, t]);

  const handleAddToRoot = useCallback(async (skill: SkillMetadata) => {
    try {
      if (!skill.path) {
        console.error('[handleAddToRoot] 技能路径为空:', skill);
        showToast('error', t('dashboard.toast.cannotGetSkillPath'));
        return;
      }
      console.log('[handleAddToRoot] 开始拷贝技能:', skill.name, '路径:', skill.path);
      await skillsApi.importFolder(skill.path);
      showToast('success', t('dashboard.toast.skillCopiedToRoot', { name: skill.name }));
      console.log('[handleAddToRoot] 拷贝完成');
    } catch (error) {
      console.error('[handleAddToRoot] 拷贝失败:', error);
      const msg = typeof error === 'string' ? error : (error as Error)?.message || t('dashboard.toast.cannotGetSkillPath');
      showToast('error', msg);
    }
  }, [showToast, t]);

  return {
    handleToggleSkill,
    handleToggleAgent,
    handleToggleSkillMerged,
    handleToggleAgentMerged,
    handleDeleteSkill,
    handleAddToRoot,
  };
};
