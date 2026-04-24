import { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNavBar from '@/components/SideNavBar';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { PAGE, pathToPage, pageToPath, ROUTE_PATH, THEME, type Page } from '@/constants';
import PreviewOnlyDesktop from './PreviewOnlyDesktop';

/**
 * Preview 模式的根布局：
 * 结构完全对齐 `RootLayout.tsx`。GitHub 路由整页替换成 PreviewOnlyDesktop，
 * Settings 路由使用真实组件（内部通过 `isPreview()` 关掉 Agents / Advanced tab），
 * Dashboard 用 mocked 数据正常跑起来。
 */
function PreviewLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const currentPage: Page = pathToPage(location.pathname);
  const isDashboard = currentPage === PAGE.Dashboard;

  const setCurrentPage = (page: Page) => navigate(pageToPath(page));

  return (
    <div className="h-screen bg-[#f8f9fa] dark:bg-dark-bg-secondary">
      <SideNavBar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main
        className={`h-screen overflow-hidden ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
      >
        {/* Dashboard 始终挂载，其他页由 Outlet 按路由切换（和 RootLayout 保持一致） */}
        <div className="h-full" style={{ display: isDashboard ? 'block' : 'none' }}>
          <Dashboard onNavigate={setCurrentPage} isActive={isDashboard} />
        </div>
        {!isDashboard && <Outlet />}
      </main>
    </div>
  );
}

export default function PreviewApp() {
  return (
    <ThemeProvider defaultTheme={THEME.Light}>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<PreviewLayout />}>
              <Route index element={null} />
              <Route
                path={ROUTE_PATH.GitHubBackup.replace(/^\//, '')}
                element={<PreviewOnlyDesktop feature="github" />}
              />
              <Route
                path={ROUTE_PATH.Settings.replace(/^\//, '')}
                element={<Settings />}
              />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
