<div align="center">

<img src="docs/assets/logo.png" alt="Skills Manager" width="520" />

### 在多个 AI Agent 之间统一管理、同步与分发 Skills 的桌面应用

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey)](README.md)

<p>
  <strong>文档语言 / Readme language</strong><br />
  <b>中文</b> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a>
</p>

<p>
  <a href="https://github.com/cchao123/skills-manager/releases">下载最新版本</a> ·
  <a href="docs/user-guide.md">使用指南</a> ·
  <a href="https://github.com/cchao123/skills-manager/issues">反馈问题</a>
</p>

</div>

---

## Skills Manager 是什么

**Skills Manager** 是一个基于 **Tauri 2 + React + Rust** 的桌面应用，用来把分散在不同 AI Agent 目录里的 skills 收拢到一个界面里查看、启用、分发和备份。

它主要解决这些问题：

- **多 Agent 管理分散**：把不同 Agent 的 skills 聚合成统一视图，减少来回切目录。
- **复用成本高**：同一个 skill 可以快速分发到多个 Agent，而不是手动复制。
- **迁移和备份麻烦**：支持把 skills 同步到 GitHub，在新机器上一键恢复。
- **发现优质 skills 困难**：内置 Marketplace，可直接浏览、搜索和安装社区技能。

当前内置的 Agent 预设包括：**Claude Code、Cursor、Codex、OpenClaw、OpenCode、Trae、Qoder、Antigravity、Kiro**。

---

## 功能概览

### Marketplace

- 基于 `skills.sh` 浏览社区 skills，支持 **All Time / Trending / Hot** 三种榜单
- 按名称、描述快速搜索
- 预览 `SKILL.md`、详情统计和安装目标
- 一键安装到 Root 或指定 Agent

![技能市场](docs/screen-shot/ScreenShot_Marketplace-1.png)
![技能详情](docs/screen-shot/ScreenShot_Marketplace-2.png)

### 已安装 Skills 管理

- 把多个来源的 skills 聚合到一个管理界面
- 按 Agent 开关启用状态
- 查看来源、文件结构和详情内容
- 支持拖拽导入包含 `SKILL.md` 的文件夹

![主页](docs/screen-shot/ScreenShot_Dashboard-1.png)
![技能详情](docs/screen-shot/ScreenShot_Dashboard-2.png)

### GitHub 备份与分发

- 同步本地 skills 仓库到 GitHub
- 从 GitHub 恢复到新机器
- 把整理好的 skills 仓库分享给自己或团队复用

![GitHub 备份](docs/screen-shot/ScreenShot_Github.png)
![GitHub 设置](docs/screen-shot/ScreenShot_Setting.png)

---

## 下载安装

1. 前往 [GitHub Releases](https://github.com/cchao123/skills-manager/releases) 下载最新版本。
2. 安装并启动应用。
3. 首次启动后，应用会自动扫描本地 Agent 目录并展示已发现的 skills。

更详细的使用方式见 [docs/user-guide.md](docs/user-guide.md)。

---

## 本地开发

### 环境要求

- **Node.js 20+**，推荐配合 **pnpm 9**
- **Rust stable**（通过 `rustup` 安装）
- **macOS** 如遇 OpenSSL 报错，可先执行：

```bash
brew install openssl@3
export OPENSSL_DIR=$(brew --prefix openssl@3)
export PKG_CONFIG_PATH=$(brew --prefix openssl@3)/lib/pkgconfig
```

仓库当前使用 `pnpm-lock.yaml`，以下文档命令默认以 `pnpm` 为准。

### 克隆与安装依赖

```bash
git clone https://github.com/cchao123/skills-manager.git
cd skills-manager
pnpm install
```

### 启动开发环境

```bash
pnpm tauri:dev
```

这会启动：

- Vite 开发服务器（默认 `http://localhost:5173`）
- Tauri 桌面窗口
- 前端热更新与后端重新编译流程

如果你只是用浏览器打开前端预览，部分功能会走 Mock 数据；完整行为请在 Tauri 窗口中验证。

### 可选：配置统计与监控

可以从 `.env.example` 复制一份 `.env`，按需填写：

```bash
cp .env.example .env
```

应用会读取 `.env`、`.env.local`、`src-tauri/.env` 等环境变量文件。常用变量如下：

- `VITE_ENABLE_TELEMETRY=false`：关闭前端 telemetry
- `VITE_APTABASE_APP_KEY`：Aptabase 前端事件统计
- `VITE_SENTRY_DSN`：前端 React 错误上报
- `SENTRY_DSN`：Rust 侧 panic / error 上报

---

## 构建发布

```bash
# Windows x64
pnpm tauri:build

# macOS Apple Silicon
pnpm tauri:build -- --target aarch64-apple-darwin

# macOS Intel
pnpm tauri:build -- --target x86_64-apple-darwin
```

构建产物位于：

- `src-tauri/target/release/`
- `src-tauri/target/release/bundle/`

仅修改 Rust 代码时，可以更快地执行：

```bash
cargo build --manifest-path=src-tauri/Cargo.toml
```

项目使用 **GitHub Actions** 自动构建发布：

- 构建工作流：`.github/workflows/build.yml`
- Pages 文档部署：`.github/workflows/deploy-pages.yml`

---

## 配置与数据路径

- 应用配置：`~/.skills-manager/config.json`
- 中央 skills 目录：`~/.skills-manager/skills/`
- GitHub 配置：`~/.skills-manager/github-config.json`

每个 skill 的元数据主要来自其目录下的 **`SKILL.md`**，推荐使用 YAML frontmatter 定义 `name`、`description` 等字段。

---

## 仓库结构

```text
skills-manager/
|-- .github/workflows/
|   |-- build.yml
|   `-- deploy-pages.yml
|-- app/
|   `-- src/
|       |-- pages/
|       |   |-- Dashboard/
|       |   |-- GitHubBackup/
|       |   |-- Marketplace/
|       |   `-- Settings/
|       `-- api/
|-- docs/
|-- scripts/
|-- src-tauri/
|   `-- src/
|       |-- commands/
|       `-- ...
|-- .env.example
|-- README.md
|-- README.en.md
`-- README.ja.md
```

---

## 常见问题

| 现象 | 建议检查 |
|------|----------|
| 图标格式报错 | 使用 `npx @tauri-apps/cli icon <源图>` 重新生成图标 |
| 5173 端口占用 | 释放端口或修改 Vite 端口配置 |
| macOS OpenSSL 报错 | 检查 `OPENSSL_DIR` 与 `PKG_CONFIG_PATH` |
| 列表里没有技能 | 确认 Agent 已安装、目录存在且包含 `SKILL.md`，然后在应用中重新扫描 |
| Marketplace 无法加载 | 检查网络连接，确认可以访问 `skills.sh` |
| GitHub 备份失败 | 确认 Token 具备仓库读写权限，仓库配置填写正确 |
| 安装 skill 失败 | 确认目标 Agent 目录存在且可写，磁盘空间充足 |

如果文档与代码实现有差异，请以当前代码为准。

---

## 参与贡献

欢迎通过 [GitHub Issues](https://github.com/cchao123/skills-manager/issues) 反馈问题，也欢迎提交 Pull Request。

1. Fork 仓库
2. 新建分支：`git checkout -b feature/your-feature`
3. 提交修改并推送
4. 发起 Pull Request

提交前建议至少运行：

```bash
pnpm build
cargo build --manifest-path=src-tauri/Cargo.toml
```

---

## 开源协议

本项目采用 **MIT License**，详见 [LICENSE](LICENSE)。

---

## 致谢

- [Tauri](https://tauri.app/)
- [Material Symbols](https://fonts.google.com/icons)
- [Claude Code](https://claude.ai/code)
