import { useState, useEffect, useMemo } from 'react';
import type { AgentConfig, SkillMetadata } from '@/types';
import { getAgentIcon, needsInvertInDark } from '@/pages/Dashboard/utils/agentHelpers';
import { getAgentDisplayName } from '@/constants';

import { Icon } from '@/components/Icon';
import { Drawer } from '@/components/Drawer';

interface SkillImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentConfig[];
  currentAgent: string;
  allSkills: SkillMetadata[];
  currentAgentSkills: SkillMetadata[];
  onImport: (skills: SkillMetadata[], defaultEnabled: boolean) => void;
}

export const SkillImportModal: React.FC<SkillImportModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentAgent,
  allSkills,
  currentAgentSkills,
  onImport,
}) => {
  const [selectedSourceAgent, setSelectedSourceAgent] = useState<string>('');
  const [importList, setImportList] = useState<SkillMetadata[]>([]);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSelectedSourceAgent('');
      setImportList([]);
    }
  }, [isOpen]);

  // 当切换源 Agent 时，清空导入列表
  useEffect(() => {
    if (selectedSourceAgent) {
      setImportList([]);
    }
  }, [selectedSourceAgent]);

  // 获取可用的源 agents（排除当前 agent）
  const availableAgents = useMemo(() => {
    return agents.filter(a => a.name !== currentAgent);
  }, [agents, currentAgent]);

  // 获取选中源 Agent 的技能
  const sourceAgentSkills = useMemo(() => {
    if (!selectedSourceAgent) return [];
    return allSkills.filter(skill => skill.source_paths?.[selectedSourceAgent]);
  }, [selectedSourceAgent, allSkills]);

  // 获取当前 Agent 已有的技能 ID 集合
  const existingSkillIds = useMemo(() => {
    return new Set(currentAgentSkills.map(s => s.id));
  }, [currentAgentSkills]);

  // 获取已在待导入列表中的技能 ID 集合
  const importListSkillIds = useMemo(() => {
    return new Set(importList.map(s => s.id));
  }, [importList]);

  // 切换技能到导入列表（添加/移除）
  const toggleSkillInImport = (skill: SkillMetadata) => {
    if (existingSkillIds.has(skill.id)) return; // 已存在的技能不能加入

    setImportList(prev => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        // 已在列表中，移除
        return prev.filter(s => s.id !== skill.id);
      } else {
        // 不在列表中，添加
        return [...prev, skill];
      }
    });
  };

  // 从导入列表移除
  const removeFromImport = (skill: SkillMetadata) => {
    setImportList(prev => prev.filter(s => s.id !== skill.id));
  };

  // 执行导入
  const handleImport = () => {
    if (importList.length === 0) return;
    onImport(importList, true);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="90vw"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            <img
              src={getAgentIcon(currentAgent)}
              alt={getAgentDisplayName(currentAgent)}
              className={`w-full h-full object-contain ${needsInvertInDark(currentAgent) ? 'dark:invert' : ''}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">导入技能</h2>
              <span className="text-sm font-medium text-[#b71422]">→</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{getAgentDisplayName(currentAgent)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">复制到目标 Agent 原生目录</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
        >
          <Icon name="close" className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Agent List */}
          <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-dark-border flex flex-col bg-slate-50 dark:bg-dark-bg-tertiary">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300">Agent 列表</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availableAgents.map(agent => {
                const isInstalled = agents.find(a => a.name === agent.name)?.detected;
                return (
                  <button
                    key={agent.name}
                    onClick={() => setSelectedSourceAgent(agent.name)}
                    disabled={!isInstalled}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                      selectedSourceAgent === agent.name
                        ? 'border-[#b71422] bg-white dark:bg-dark-bg-card shadow-sm'
                        : isInstalled
                          ? 'border-transparent hover:bg-white dark:hover:bg-dark-bg-card hover:border-gray-300 dark:hover:border-gray-600'
                          : 'border-transparent bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={getAgentIcon(agent.name)}
                        alt={agent.display_name}
                        className={`w-full h-full object-contain ${needsInvertInDark(agent.name) ? 'dark:invert' : ''} ${!isInstalled ? 'grayscale opacity-50' : ''}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate ${
                        isInstalled
                          ? 'text-slate-700 dark:text-gray-200'
                          : 'text-slate-400 dark:text-gray-500'
                      }`}>
                        {getAgentDisplayName(agent.name)}
                      </span>
                      {!isInstalled && (
                        <span className="text-xs text-slate-400 dark:text-gray-500">未安装</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Skills of Selected Agent (Progressive Disclosure) */}
          <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-dark-border">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300">
                {selectedSourceAgent ? getAgentDisplayName(selectedSourceAgent) : '技能列表'}
                {selectedSourceAgent && (
                  <span className="text-xs text-slate-500 dark:text-gray-400">({sourceAgentSkills.length})</span>
                )}
              </h3>
              {selectedSourceAgent && sourceAgentSkills.length > 0 && (
                <button
                  onClick={() => {
                    // 获取可选的技能（排除已存在的）
                    const availableSkills = sourceAgentSkills.filter(s => !existingSkillIds.has(s.id));
                    // 检查是否所有可选技能都已在导入列表中
                    const allSelected = availableSkills.every(s => importListSkillIds.has(s.id));

                    if (allSelected) {
                      // 全部已选中，清空导入列表
                      setImportList([]);
                    } else {
                      // 全部加入导入列表
                      setImportList(availableSkills);
                    }
                  }}
                  className="text-xs text-[#b71422] hover:text-[#a01220] dark:text-[#ff4d5a] dark:hover:text-[#ff6b73]"
                >
                  {(() => {
                    const availableSkills = sourceAgentSkills.filter(s => !existingSkillIds.has(s.id));
                    const allSelected = availableSkills.length > 0 && availableSkills.every(s => importListSkillIds.has(s.id));
                    return allSelected ? '取消全选' : '全选';
                  })()}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedSourceAgent ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400 dark:text-gray-500 text-center px-4">
                    请先从左侧选择一个 Agent
                  </p>
                </div>
              ) : sourceAgentSkills.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400 dark:text-gray-500">该 Agent 暂无技能</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sourceAgentSkills.map(skill => {
                    const isExisting = existingSkillIds.has(skill.id);
                    const isInImportList = importListSkillIds.has(skill.id);

                    return (
                      <div
                        key={skill.id}
                        className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
                          isExisting
                            ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                            : isInImportList
                              ? 'border-[#b71422] dark:border-rose-600 bg-rose-50 dark:bg-rose-900/30 cursor-pointer hover:shadow-sm'
                              : 'border-gray-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-dark-bg-card cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isExisting) return; // 已存在的技能不允许点击
                          toggleSkillInImport(skill);
                        }}
                      >
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {isExisting ? (
                            <div className="w-2.5 h-2.5 rounded-sm bg-gray-500 dark:bg-gray-600" />
                          ) : isInImportList ? (
                            <Icon name="check" className="text-[#b71422] text-xs" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-sm border-2 border-slate-300 dark:border-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${
                              isExisting
                                ? 'text-slate-500 dark:text-gray-500'
                                : isInImportList
                                  ? 'text-slate-700 dark:text-gray-300'
                                  : 'text-slate-900 dark:text-white'
                            }`}>
                              {skill.name}
                            </p>
                            {isExisting && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex-shrink-0">已存在</span>
                            )}
                            {isInImportList && !isExisting && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-700 text-rose-800 dark:text-rose-100 flex-shrink-0">已添加</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">{skill.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Import List */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300">
                待导入 ({importList.length})
              </h3>
              {importList.length > 0 && (
                <button
                  onClick={() => setImportList([])}
                  className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  清空
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {importList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500">
                  <Icon name="inbox" className="text-4xl mb-2 opacity-50" />
                  <p className="text-sm">未选择技能</p>
                  <p className="text-xs mt-1">点击技能卡片添加到待导入列表</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {importList.map(skill => (
                    <div
                      key={skill.id}
                      className="flex items-start gap-2 p-3 rounded-lg border border-amber-400/40 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-900/20"
                    >
                      <div
                        className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer"
                        onClick={() => removeFromImport(skill)}
                      >
                        <Icon name="close" className="text-white text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{skill.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{skill.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-dark-border gap-3 flex-shrink-0">
        <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={importList.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-[#b71422] text-white hover:bg-[#a01220] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            导入 ({importList.length})
        </button>
      </div>
    </Drawer>
  );
};
