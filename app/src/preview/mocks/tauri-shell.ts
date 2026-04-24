/**
 * Mock for `@tauri-apps/plugin-shell`.
 *
 * 真实实现用系统 shell 调起浏览器/默认程序；预览模式下统一降级为
 * `window.open`，至少 https:// 链接可以在新标签打开。
 */

export async function open(url: string, _openWith?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  // 本地路径（/Users/..., C:\...）在浏览器里打不开，直接忽略
  if (/^(https?:|mailto:|tel:)/i.test(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
