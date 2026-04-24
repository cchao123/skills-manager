/**
 * 判断当前是否跑在 Web 预览构建里（`vite.preview.config.ts` 打出的 bundle）。
 *
 * 实现方式：preview mock（`app/src/preview/mocks/tauri-core.ts`）初始化时
 * 会把 `window.__PREVIEW__` 置为 true。业务代码 import 这个 helper，在需要
 * 屏蔽桌面独有能力的地方做轻量 gate。
 *
 * 和 `isTauri()` 的关系：preview 里两者都返回 true —— `isTauri()` 是"有没有
 * 原生桥可调"，`isPreview()` 是"这座桥是不是 mock 出来的"。
 */
export function isPreview(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as unknown as { __PREVIEW__?: boolean }).__PREVIEW__ === true;
}
