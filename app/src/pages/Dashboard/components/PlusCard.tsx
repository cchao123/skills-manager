import { useTranslation } from 'react-i18next';
import type { AgentConfig } from '@/types';

import { Icon } from '@/components/Icon';

interface PlusCardProps {
  agents: AgentConfig[];
  currentAgent: string;
  onOpen: () => void;
}

export const PlusCard: React.FC<PlusCardProps> = ({ agents, currentAgent, onOpen }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-dark-bg-card rounded-xl border border-dashed border-2 border-slate-300 dark:border-dark-border hover:border-[#b71422]/40 hover:bg-slate-50 dark:hover:bg-dark-bg-tertiary transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] group"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-bg-tertiary flex items-center justify-center mb-4 group-hover:bg-[#b71422]/10 transition-colors">
        <Icon name="add" className="text-3xl text-slate-400 dark:text-gray-500 group-hover:text-[#b71422] transition-colors" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-gray-300 group-hover:text-[#b71422] transition-colors">
        {t('dashboard.import.fromOther')}
      </p>
      <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
        {t('dashboard.import.hint')}
      </p>
    </div>
  );
};
