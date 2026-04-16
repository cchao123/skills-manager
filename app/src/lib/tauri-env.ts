/**
 * 是否在 Tauri WebView 中且具备 core.invoke（与主题同步等用法一致）。
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.__TAURI__?.core?.invoke === 'function';
}
