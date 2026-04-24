/**
 * 静态资源 URL helper。
 *
 * 直接写 `<img src="/octopus-logo.png">` 在 Tauri 里工作是因为 Tauri 把资源根
 * 挂在 `/`；但在 Web 预览构建里，iframe 被部署到 `/skills-managers/preview/`
 * 之类的子路径下，绝对路径 `/octopus-logo.png` 会打到域名根 → 404。
 *
 * 用 `import.meta.env.BASE_URL` 交给 Vite 按构建配置推导：
 *   - Tauri 主构建 (`base: '/'`)       → `/octopus-logo.png`
 *   - 预览构建    (`base: './'`)        → `./octopus-logo.png`（相对当前文档）
 */
const baseUrl = (() => {
  const b = import.meta.env.BASE_URL || '/';
  // 保证 base 以 / 结尾，避免拼接时变成 `./xxx` 或 `/xxx` 的混合
  return b.endsWith('/') ? b : `${b}/`;
})();

/** 拼接一个 publicDir 下的静态资源 URL */
export function assetUrl(name: string): string {
  return `${baseUrl}${name.replace(/^\//, '')}`;
}

export const OCTOPUS_LOGO_URL = assetUrl('octopus-logo.png');
