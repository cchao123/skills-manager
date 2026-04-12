import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import type { SkillMetadata } from '@/types';
import { TabSwitcher } from '@/components/TabSwitcher';

// Hooks
import { useSkillData } from '@/pages/Dashboard/hooks/useSkillData';
import { useSkillFilters } from '@/pages/Dashboard/hooks/useSkillFilters';
import { useSkillActions } from '@/pages/Dashboard/hooks/useSkillActions';
import { useSkillModal } from '@/pages/Dashboard/hooks/useSkillModal';
import { useDragDrop } from '@/pages/Dashboard/hooks/useDragDrop';
import { usePanelResize } from '@/pages/Dashboard/hooks/usePanelResize';

// Components
import { SkillCard } from '@/pages/Dashboard/components/SkillCard';
import { SearchAndFilterBar } from '@/pages/Dashboard/components/SearchAndFilterBar';
import { DragDropOverlay } from '@/pages/Dashboard/components/DragDropOverlay';
import { ImportingOverlay } from '@/pages/Dashboard/components/ImportingOverlay';
import { DeleteConfirmModal } from '@/pages/Dashboard/components/DeleteConfirmModal';
import { SkillDetailModal } from '@/pages/Dashboard/components/SkillDetailModal';
import { getSkillIcon, getSkillColor } from '@/pages/Dashboard/utils/skillHelpers';
import MarketplaceSkillCard from '@/pages/Dashboard/components/MarketplaceSkillCard';
import type { Skill } from '@/types/skills';

function Dashboard() {
  const { t } = useTranslation();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<SkillMetadata | null>(null);
  const [viewMode, setViewMode] = useState('flat');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [showHelp, setShowHelp] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const helpPopoverRef = useRef<HTMLDivElement>(null);
  const helpTimeoutRef = useRef<number | null>(null);

  const viewTabs = [
    { id: 'flat', label: '平铺展示', icon: 'grid_view' },
    { id: 'agent', label: '按来源展示', icon: 'smart_toy' },
  ];

  // 切换视图时重置agent选择
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
    if (mode === 'agent') {
      setSelectedSource('All');
    }
  };

  // Custom hooks
  const { skills, setSkills, agents, loading, error, loadSkills } = useSkillData();

  // 延迟显示/隐藏帮助，配合hover效果
  const handleHelpMouseEnter = () => {
    if (helpTimeoutRef.current) {
      clearTimeout(helpTimeoutRef.current);
    }
    setShowHelp(true);
  };

  const handleHelpMouseLeave = () => {
    if (helpTimeoutRef.current) {
      clearTimeout(helpTimeoutRef.current);
    }
    helpTimeoutRef.current = setTimeout(() => {
      setShowHelp(false);
    }, 100);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (helpTimeoutRef.current) {
        clearTimeout(helpTimeoutRef.current);
      }
    };
  }, []);
  const { searchTerm, setSearchTerm, filterType, setFilterType, filteredSkills } = useSkillFilters(skills);
  const { handleToggleSkill, handleToggleAgent, handleDeleteSkill } = useSkillActions(skills, setSkills);

  // 将SkillMetadata转换为Marketplace的Skill格式
  const convertToMarketplaceSkill = (skill: SkillMetadata): Skill => {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version || '1.0.0',
      category: 'Skill',
      icon: getSkillIcon(skill.id),
      iconColor: getSkillColor(skill.id),
      rating: 4.5,
      downloads: '1k',
      author: 'Skills Manager',
      installed: skill.enabled,
    };
  };

  // 按来源过滤
  const filteredBySource = selectedSource === 'All'
    ? filteredSkills
    : filteredSkills.filter(skill => {
        if (selectedSource === 'claude') return skill.source === 'claude';
        if (selectedSource === 'cursor') return skill.source === 'cursor';
        if (selectedSource === 'central') return skill.source === 'central';
        return true;
      });

  const marketplaceSkills = filteredBySource.map(convertToMarketplaceSkill);
  const {
    detailSkill,
    showDetailModal,
    skillFiles,
    loadingFiles,
    expandedFolders,
    currentFile,
    loadingFile,
    handleShowSkillDetail,
    handleCloseDetailModal,
    toggleFolder,
    handleReadFile,
  } = useSkillModal();
  const { isDragOver, importing } = useDragDrop();
  const { leftPanelWidth, isResizing, handleMouseDown } = usePanelResize();

  // Handlers
  const toggleExpand = (skillId: string) => {
    setExpandedCards(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(skillId)) {
        newExpanded.delete(skillId);
      } else {
        newExpanded.add(skillId);
      }
      return newExpanded;
    });
  };

  const handleDeleteConfirm = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    handleCloseDetailModal();
    if (target) {
      await handleDeleteSkill(target);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader icon="extension" title={t('header.dashboard')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 dark:border-dark-bg-tertiary border-t-[#b71422] mb-4"></div>
            <p className="text-slate-500 dark:text-gray-300 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader icon="extension" title={t('header.dashboard')} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-dark-bg-card rounded-xl p-6 border border-red-200 dark:border-red-900/30 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">error</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('common.error')}</h3>
            </div>
            <p className="text-slate-600 dark:text-gray-300 mb-2">{error}</p>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
              {t('dashboard.errorMessage')}
            </p>
            <button
              onClick={loadSkills}
              className="w-full bg-[#b71422] hover:bg-[#a01220] text-white px-4 py-2 rounded-lg font-bold transition-all"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        icon="extension"
        title={t('header.dashboard')}
        center={<TabSwitcher tabs={viewTabs} activeTab={viewMode} onTabChange={handleViewModeChange} />}
        actions={
          <div className="relative">
            <button
              ref={helpButtonRef}
              onMouseEnter={handleHelpMouseEnter}
              onMouseLeave={handleHelpMouseLeave}
              className="help-popover p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="视图说明"
            >
              <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-gray-300">
                help
              </span>
            </button>

            {/* 帮助弹出框 - 显示在按钮下方 */}
            {showHelp && (
              <div
                ref={helpPopoverRef}
                onMouseEnter={handleHelpMouseEnter}
                onMouseLeave={handleHelpMouseLeave}
                className="absolute right-0 top-full mt-2 z-50 w-80 help-popover"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600">info</span>
                      视图说明
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">平铺展示</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          扫描本地所有 Agent，显示所有可用的 Skills（不区分 Agent 来源）
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">按来源展示</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          按照不同的 Agent 对 Skills 进行分类展示，可以清晰地看到每个 Agent 下有哪些 Skills
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* 搜索栏 - 固定 */}
      <div className="bg-[#f8f9fa] dark:bg-dark-bg-secondary px-8 py-4">
        <div className="max-w-6xl mx-auto">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            skills={skills}
            viewMode={viewMode as 'flat' | 'agent'}
            selectedSource={selectedSource}
            onSourceSelect={setSelectedSource}
          />
        </div>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className={`relative flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-dark-bg-secondary ${isDragOver ? 'px-0 border-4 border-[#b71422] bg-white/90 dark:bg-dark-bg-primary rounded-xl mx-8' : 'px-8'}`}>
        <div className="max-w-6xl mx-auto">
          {viewMode === 'flat' && (
            <>
              {filteredSkills.length === 0 ? (
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20">

                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                    search_off
                  </span>
                  <p className="text-slate-500 dark:text-gray-400 font-medium">
                    {searchTerm ? t('dashboard.search.noResults') : t('dashboard.filter.noResults')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Left column */}
                  <div className="flex-1 space-y-4">
                    {filteredSkills.filter((_, i) => i % 2 === 0).map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        agents={agents}
                        expanded={expandedCards.has(skill.id)}
                        onToggleExpand={toggleExpand}
                        onToggleSkill={handleToggleSkill}
                        onToggleAgent={handleToggleAgent}
                        onShowDetail={handleShowSkillDetail}
                      />
                    ))}
                    {/* Small screen: show right column skills here too */}
                    <div className="lg:hidden space-y-4">
                      {filteredSkills.filter((_, i) => i % 2 === 1).map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          agents={agents}
                          expanded={expandedCards.has(skill.id)}
                          onToggleExpand={toggleExpand}
                          onToggleSkill={handleToggleSkill}
                          onToggleAgent={handleToggleAgent}
                          onShowDetail={handleShowSkillDetail}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Right column - only on large screens */}
                  <div className="flex-1 space-y-4 hidden lg:block">
                    {filteredSkills.filter((_, i) => i % 2 === 1).map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        agents={agents}
                        expanded={expandedCards.has(skill.id)}
                        onToggleExpand={toggleExpand}
                        onToggleSkill={handleToggleSkill}
                        onToggleAgent={handleToggleAgent}
                        onShowDetail={handleShowSkillDetail}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === 'agent' && (
            <div className="bg-[#f8f9fa] dark:bg-dark-bg-secondary">
              <div className="space-y-6">
                {/* Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {marketplaceSkills.map((skill) => {
                    const originalSkill = filteredBySource.find(s => s.id === skill.id);
                    const collectedStatus = originalSkill?.source === 'central'
                      ? (originalSkill.is_collected ? 'collected' as const : 'uncollected' as const)
                      : undefined;

                    return (
                      <MarketplaceSkillCard
                        key={skill.id}
                        skill={skill}
                        onInstall={() => {
                          const orig = skills.find(s => s.id === skill.id);
                          if (orig) {
                            handleToggleSkill(orig);
                          }
                        }}
                        onInfo={() => handleShowSkillDetail(skills.find(s => s.id === skill.id)!)}
                        collectedStatus={collectedStatus}
                      />
                    );
                  })}
                </div>

                {marketplaceSkills.length === 0 && (
                  <div className="text-center py-20 text-slate-500 dark:text-gray-400">
                    该来源下暂无技能
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop Overlay */}
        {isDragOver && <DragDropOverlay />}

        {/* Importing Overlay */}
        {importing && <ImportingOverlay />}
      </div>

      {/* Skill Detail Modal */}
      {showDetailModal && detailSkill && (
        <SkillDetailModal
          skill={detailSkill}
          agents={agents}
          skillFiles={skillFiles}
          loadingFiles={loadingFiles}
          expandedFolders={expandedFolders}
          currentFile={currentFile}
          loadingFile={loadingFile}
          leftPanelWidth={leftPanelWidth}
          isResizing={isResizing}
          onClose={handleCloseDetailModal}
          onToggleFolder={toggleFolder}
          onReadFile={handleReadFile}
          onToggleAgent={handleToggleAgent}
          onDelete={() => setDeleteTarget(detailSkill)}
          onResizeStart={handleMouseDown}
        />
      )}


      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Dashboard;
