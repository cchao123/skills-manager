import { useTranslation } from 'react-i18next';
import type { AgentConfig } from '@/types';
import { SOURCE } from '@/pages/Dashboard/utils/source';

import { Icon } from '@/components/Icon';

interface PlusCardProps {
  agents: AgentConfig[];
  currentAgent: string;
  onOpen: () => void;
}

export const PlusCard: React.FC<PlusCardProps> = ({ agents, currentAgent, onOpen }) => {
  const { t } = useTranslation();

  // 获取目标名称
  const getTargetName = () => {
    if (currentAgent === SOURCE.Global) {
      return t('dashboard.source.global');
    }
    const agent = agents.find(a => a.name === currentAgent);
    return agent ? agent.display_name : currentAgent;
  };

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-dark-bg-card rounded-xl border border-dashed border-2 border-[var(--border-color)] dark:border-dark-border hover:border-[var(--accent-primary-border)] hover:bg-[var(--shell-surface-soft)] dark:hover:bg-dark-bg-tertiary transition-all cursor-pointer p-4"
    >
      <div className="flex flex-col items-center gap-3">
        {/* 加号图标 */}
        <div className="w-8 h-8 rounded-full bg-[var(--shell-surface-soft)] dark:bg-dark-bg-tertiary border-2 border-[var(--border-color)] dark:border-dark-border flex items-center justify-center hover:border-[var(--accent-primary-border)] hover:bg-white dark:hover:bg-dark-bg-card transition-all shadow-sm flex-shrink-0">
          <Icon name="add" className="text-sm text-[var(--text-tertiary)] dark:text-gray-500 hover:text-[var(--accent-primary)] transition-colors" />
        </div>

        {/* 文字说明 */}
        <div className="text-center">
          <p className="text-xs font-medium text-[var(--text-secondary)] dark:text-gray-300 hover:text-[var(--accent-primary)] transition-colors">
            {t('dashboard.import.fromOther')} {getTargetName()}
          </p>
        </div>
      </div>
    </div>
  );
};

