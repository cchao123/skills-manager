import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { PROJECT_NAME, PROJECT_VERSION, PAGE, SESSION_STORAGE_KEYS, WINDOW_EVENTS, pageToPath, type Page } from '@/constants';
import { OCTOPUS_LOGO_URL } from '@/lib/assets';
import { useSidebar } from '@/contexts/SidebarContext';

import { Icon } from '@/components/Icon';

export default function SideNavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = useSidebar();

  const handleLogoClick = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.settingsInitialTab, 'about');
    } catch {
      /* ignore quota / private mode */
    }
    // 已经在 Settings 页时，navigate 不会触发重新挂载，需要一个事件通知已 mount 的 Settings 切 tab
    window.dispatchEvent(new CustomEvent(WINDOW_EVENTS.settingsSetTab, { detail: 'about' }));
    navigate(pageToPath(PAGE.Settings));
  };

  const navButtonClass = (active: boolean, collapsed: boolean) =>
    `flex items-center gap-3 py-3 rounded-lg font-bold transition-[background-color,box-shadow,transform] active:scale-95 w-full ${
      collapsed ? 'flex-col justify-center px-0 gap-1' : 'px-4'
    } ${
      active
        ? 'text-white bg-[var(--accent-primary)] shadow-[0_16px_30px_-18px_rgba(255,68,88,0.95)] dark:text-white [&_svg]:!text-white [&_svg]:transition-none'
        : 'text-[var(--text-secondary)] dark:text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/80 dark:hover:bg-dark-bg-tertiary [&_svg]:transition-none'
    }`;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl+';
  const navItems: Array<{ id: Page; icon: string; label: string; shortcut: string; shortLabel: string }> = [
    { id: PAGE.SkillDownload, icon: 'storefront', label: t('nav.skillDownload'), shortcut: `${mod}A`, shortLabel: t('nav.marketplace') },
    { id: PAGE.Dashboard, icon: 'extension', label: t('nav.dashboard'), shortcut: `${mod}S`, shortLabel: t('nav.installed') },
    { id: PAGE.GitHubBackup, icon: 'backup', label: t('nav.githubBackup'), shortcut: `${mod}D`, shortLabel: t('nav.backup') },
  ];

  const settingsItem: { id: Page; icon: string; label: string; shortLabel: string } = {
    id: PAGE.Settings,
    icon: 'settings',
    label: t('nav.settings'),
    shortLabel: t('nav.settings'),
  };

  return (
    <aside
      className={`h-screen bg-[var(--shell-sidebar)] dark:bg-dark-bg flex flex-col pt-14 pb-8 z-50 border-r border-[var(--border-color)] dark:border-dark-border shrink-0 relative ${
        isCollapsed ? 'w-20 px-3' : 'w-55 px-4'
      }`}
      data-tauri-drag-region
    >
      {/* 顶部拖动区域已被容器的 data-tauri-drag-region 覆盖 */}
      <AppInfo
        isCollapsed={isCollapsed}
        onClick={handleLogoClick}
        title={t('settings.tabAbout')}
      />

      <nav className="flex-1 space-y-2" data-tauri-drag-region>
        {navItems.map((item) => (
          <div key={item.id} className="relative group/nav-item">
            <NavLink
              to={pageToPath(item.id)}
              end={item.id === PAGE.Dashboard}
              className={({ isActive }) => navButtonClass(isActive, isCollapsed)}
            >
              <Icon name={item.icon} data-icon={item.icon} className="text-xl" />
              {!isCollapsed && (
                <span className="font-['Manrope'] flex-1">{item.label}</span>
              )}
              {isCollapsed && (
                <span className="text-[9px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-center opacity-80">
                  {item.shortLabel}
                </span>
              )}
            </NavLink>
            <NavTooltip label={item.label} shortcut={item.shortcut} />
          </div>
        ))}
      </nav>

      {/* Settings at the bottom */}
      <div className="relative group/nav-item">
        <NavLink
          to={pageToPath(settingsItem.id)}
          className={({ isActive }) => navButtonClass(isActive, isCollapsed)}
        >
          <Icon name={settingsItem.icon} data-icon={settingsItem.icon} className="text-xl" />
          {!isCollapsed && (
            <span className="font-['Manrope']">{settingsItem.label}</span>
          )}
        </NavLink>
        <NavTooltip label={settingsItem.label} />
      </div>

      {/* Collapse Toggle Button - Fixed on the right edge */}
      <button
        onClick={toggle}
        className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-10 rounded-lg bg-white/95 dark:bg-dark-bg-card shadow-[0_10px_24px_-16px_rgba(39,50,72,0.7)] flex items-center justify-center z-50 border border-[var(--border-color)] dark:border-dark-border"
        title={isCollapsed ? t('nav.expand') : t('nav.collapse')}
      >
        <Icon name={isCollapsed ? 'chevron_right' : 'chevron_left'} className="text-[var(--text-tertiary)] dark:text-gray-500 text-xl" />
      </button>
    </aside>
  );
}

interface NavTooltipProps {
  label: string;
  shortcut?: string;
}

/** 侧栏导航 hover 黑色提示框，向右弹出。父级需要 `relative group`。 */
function NavTooltip({ label, shortcut }: NavTooltipProps) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[9999] pointer-events-none hidden group-hover/nav-item:block">
      <div className="whitespace-nowrap rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium px-2.5 py-1 shadow-lg flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <span className="font-mono text-[11px] text-slate-300 dark:text-slate-400">{shortcut}</span>
        )}
      </div>
    </div>
  );
}

interface AppInfoProps {
  isCollapsed: boolean;
  onClick: () => void;
  title: string;
}

function AppInfo({ isCollapsed, onClick, title }: AppInfoProps) {
  if (isCollapsed) {
    return (
      <div className="flex justify-center mb-12">
        <button
          type="button"
          onClick={onClick}
          title={title}
          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-[var(--bg-card)] dark:bg-dark-bg-card border border-[var(--border-color)] shadow-[0_14px_28px_-20px_rgba(39,50,72,0.75)] hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer"
        >
          <img src={OCTOPUS_LOGO_URL} alt="Octopus Logo" className="w-full h-full object-cover" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-3 mb-12 px-2 text-left hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white dark:bg-dark-tertiary border border-[var(--border-color)] shadow-[0_14px_28px_-20px_rgba(39,50,72,0.75)]">
        <img src={OCTOPUS_LOGO_URL} alt="Octopus Logo" className="w-full h-full object-cover" />
      </div>
      <div>
        <h1 className="text-xl font-black text-[var(--text-primary)] font-['Manrope'] tracking-tight">
          {PROJECT_NAME}
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] dark:text-gray-400 font-bold">
          {PROJECT_VERSION}
        </p>
      </div>
    </button>
  );
}
