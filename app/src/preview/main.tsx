import React from 'react';
import ReactDOM from 'react-dom/client';
import PreviewApp from './PreviewApp';
import { ErrorBoundary } from '@/ErrorBoundary';
import '@/assets/styles/index.css';
import '@/i18n/config';

/**
 * Preview 入口：对应 `preview.html`。
 *
 * 与生产入口 `main.tsx` 的差异：
 * 1. 挂载 `<PreviewApp />` 而不是 `<App />`，把 GitHub/Settings 路由替换成
 *    "仅桌面端可用" 的引导页
 * 2. 不调用 `initTelemetry()`，避免预览页污染真实埋点数据
 * 3. 所有 `@tauri-apps/*` 依赖都会在构建时被 vite alias 替换成 mock
 */

if (import.meta.env.DEV) {
  console.log('[preview] mounted (mock Tauri backend)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PreviewApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
