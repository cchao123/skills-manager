import { useTranslation } from 'react-i18next';
import { THEME_OPTIONS, type Theme } from '../constants/config';

import { Icon } from '@/components/Icon';
interface AppearanceSectionProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--bg-card)] dark:bg-dark-bg-card rounded-2xl p-5 shadow-sm border border-[var(--border-color)] dark:border-dark-border">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="palette" className="text-2xl text-slate-600 dark:text-gray-300" />
          {t('settings.appearance')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
          {t('settings.appearanceDescription')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-3">
          {t('settings.theme')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => onThemeChange(themeOption.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                currentTheme === themeOption.value
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]'
                  : 'border-[var(--border-color)] dark:border-dark-border hover:border-[var(--accent-primary)]/30 bg-[var(--bg-card)] dark:bg-dark-bg-card'
              }`}
            >
              <Icon name={themeOption.icon} className="text-3xl text-slate-600 dark:text-gray-300" />
              <span className="text-sm font-bold text-slate-700 dark:text-white">
                {t(themeOption.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
