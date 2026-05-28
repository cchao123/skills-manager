<div align="center">

<img src="docs/assets/logo.png" alt="Skills Manager" width="520" />

### A desktop app for managing, syncing, and distributing skills across AI agents

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey)](README.en.md)

<p>
  <strong>Readme language / 文档语言</strong><br />
  <a href="README.md">中文</a> · <b>English</b> · <a href="README.ja.md">日本語</a>
</p>

<p>
  <a href="https://github.com/cchao123/skills-manager/releases">Download latest release</a> ·
  <a href="docs/user-guide-en.md">User guide</a> ·
  <a href="https://github.com/cchao123/skills-manager/issues">Feedback</a>
</p>

</div>

---

## What It Is

**Skills Manager** is a desktop app built with **Tauri 2 + React + Rust** that brings skills from different AI agent directories into one place so you can inspect, enable, distribute, and back them up.

It is designed for a few practical workflows:

- **Reduce fragmentation**: manage skills from multiple agents in one UI instead of jumping between folders.
- **Reuse skills faster**: link or copy the same skill into different agents with less manual work.
- **Back up and migrate cleanly**: sync your skills repository to GitHub and restore it on a new machine.
- **Discover useful skills**: browse, search, and install community skills from the built-in Marketplace.

Built-in agent presets currently include **Claude Code, Cursor, Codex, OpenClaw, OpenCode, Trae, Qoder, Antigravity, and Kiro**.

---

## Features

### Marketplace

- Browse community skills from `skills.sh`
- Switch between **All Time / Trending / Hot** rankings
- Search by name or description
- Preview `SKILL.md`, stats, and install targets
- Install to Root or a specific agent in one click

![Marketplace](docs/screen-shot/ScreenShot_Marketplace-1.png)
![Skill Details](docs/screen-shot/ScreenShot_Marketplace-2.png)

### Installed Skill Management

- Aggregate skills from multiple sources into one manageable view
- Toggle skill availability per agent
- Inspect source locations, file trees, and detail content
- Drag and drop any folder that contains a `SKILL.md`

![Home](docs/screen-shot/ScreenShot_Dashboard-1.png)
![Skill Details](docs/screen-shot/ScreenShot_Dashboard-2.png)

### GitHub Backup and Distribution

- Sync your local skills repository to GitHub
- Restore a repository on a new machine
- Share a curated skills repository with yourself or your team

![GitHub Backup](docs/screen-shot/ScreenShot_Github.png)
![GitHub Settings](docs/screen-shot/ScreenShot_Setting.png)

---

## Install and Use

1. Download the latest build from [GitHub Releases](https://github.com/cchao123/skills-manager/releases).
2. Install and launch the app.
3. On first launch, the app scans local agent directories and shows the skills it finds.

For a step-by-step walkthrough, see [docs/user-guide-en.md](docs/user-guide-en.md).

---

## Local Development

### Prerequisites

- **Node.js 20+**, ideally with **pnpm 9**
- **Rust stable** via `rustup`
- **macOS** users who hit OpenSSL errors can run:

```bash
brew install openssl@3
export OPENSSL_DIR=$(brew --prefix openssl@3)
export PKG_CONFIG_PATH=$(brew --prefix openssl@3)/lib/pkgconfig
```

This repo ships with `pnpm-lock.yaml`, so the commands below use `pnpm` for reproducibility.

### Clone and install dependencies

```bash
git clone https://github.com/cchao123/skills-manager.git
cd skills-manager
pnpm install
```

### Start the dev environment

```bash
pnpm tauri:dev
```

This starts:

- the Vite dev server on `http://localhost:5173`
- the Tauri desktop window
- frontend hot reload plus the normal Tauri rebuild flow for backend changes

If you open the frontend in a plain browser, some capabilities fall back to mock data. Use the Tauri window to verify full behavior.

### Optional: telemetry and monitoring

You can copy `.env.example` to `.env` and fill in only what you need:

```bash
cp .env.example .env
```

The app reads env files such as `.env`, `.env.local`, and `src-tauri/.env`. Common variables:

- `VITE_ENABLE_TELEMETRY=false`: disable frontend telemetry
- `VITE_APTABASE_APP_KEY`: Aptabase frontend event analytics
- `VITE_SENTRY_DSN`: frontend React error reporting
- `SENTRY_DSN`: Rust panic / error reporting

---

## Build and Release

```bash
# Windows x64
pnpm tauri:build

# macOS Apple Silicon
pnpm tauri:build -- --target aarch64-apple-darwin

# macOS Intel
pnpm tauri:build -- --target x86_64-apple-darwin
```

Build artifacts are written to:

- `src-tauri/target/release/`
- `src-tauri/target/release/bundle/`

For faster Rust-only iteration:

```bash
cargo build --manifest-path=src-tauri/Cargo.toml
```

GitHub automation in this repo:

- Release builds: `.github/workflows/build.yml`
- Pages docs deployment: `.github/workflows/deploy-pages.yml`

---

## Config and Data Paths

- App config: `~/.skills-manager/config.json`
- Central skills directory: `~/.skills-manager/skills/`
- GitHub config: `~/.skills-manager/github-config.json`

Skill metadata mainly comes from **`SKILL.md`** in each directory. YAML frontmatter such as `name` and `description` is recommended.

---

## Repository Layout

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

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Icon format errors | Rebuild icons with `npx @tauri-apps/cli icon <source-image>` |
| Port 5173 is busy | Free the port or change the Vite port config |
| macOS OpenSSL issues | Check `OPENSSL_DIR` and `PKG_CONFIG_PATH` |
| Skill list is empty | Make sure the agent is installed, the path exists, and `SKILL.md` is present, then rescan in the app |
| Marketplace will not load | Check network access to `skills.sh` |
| GitHub backup fails | Verify the token has repo read/write permissions and the repository config is correct |
| Skill install fails | Make sure the target agent directory exists and is writable, and check disk space |

If the docs and the code ever disagree, trust the current code.

---

## Contributing

Issues and pull requests are welcome at [GitHub Issues](https://github.com/cchao123/skills-manager/issues).

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit and push your changes
4. Open a pull request

Before pushing, it helps to run:

```bash
pnpm build
cargo build --manifest-path=src-tauri/Cargo.toml
```

---

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE).

---

## Acknowledgments

- [Tauri](https://tauri.app/)
- [Material Symbols](https://fonts.google.com/icons)
- [Claude Code](https://claude.ai/code)
