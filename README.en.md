<div align="center">

<img src="docs/assets/logo.png" alt="Skills Manager" width="520" />

### A desktop app for managing, syncing, and distributing skills across AI agents.

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey)](README.en.md)

<p>
  <strong>Readme language / 文档语言</strong><br />
  <a href="README.md">中文</a> · <b>English</b>
</p>

<p><a href="https://github.com/cchao123/skills-managers/issues">Feedback (GitHub Issues)</a></p>

</div>

---

## What It Is

**Skills Manager** is a desktop app built with **Tauri 2 + React + Rust** for organizing local skills and moving them across different AI agents.

It is designed around a few core workflows:

- **Unified scanning**: collect skills from multiple agent directories into one manageable view
- **Cross-agent distribution**: link or copy the same skill into different agents
- **Central storage**: keep reusable skills in one place for easier maintenance and migration
- **GitHub backup and restore**: push your skills repository to GitHub or restore it on a new machine

Supported agents currently include **Claude, Cursor, Codex, OpenClaw, and OpenCode**.

---

## Features

### Skill Overview and Management

- **Unified view**: manage skills from different sources in one interface
- **Per-agent toggles**: control whether a skill is enabled for each agent
- **Source and file inspection**: view skill details, sources, and file trees
- **Drag-and-drop import**: import any folder that contains a `SKILL.md`

![Home](docs/screen-shot/en-skills-home.png)
![Source View](docs/screen-shot/en-skills-source.png)
![Skill Details](docs/screen-shot/en-skills-detail.png)
![Drag Import](docs/screen-shot/en-skills-drop.png)

### GitHub Backup and Distribution

- **Sync to GitHub**: push your local skills repository to a remote repo
- **Restore from GitHub**: pull the repository back onto a new machine
- **Share a curated repository**: use a GitHub repo as a portable skills distribution source

![GitHub](docs/screen-shot/en-github.png)

### Settings

- **Agent detection**: inspect and manage supported local agents
- **Link strategy**: choose whether skills are distributed via links or copies
- **Filter rules**: hide skills injected by CLI or workflow tooling for a cleaner list
- **Delete protection**: avoid editing agent-owned files unless you explicitly allow it

![Settings](docs/screen-shot/en-setting.png)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, react-i18next |
| Desktop | Tauri 2 (Rust) |
| Typical deps | serde, git2, ureq, walkdir, etc. |

Development and builds require **Node.js** and **Rust**; on macOS, **OpenSSL** may be needed for some native deps (see below).

---

## Quick start

### Prerequisites

- **Node.js 18+** (`npm` or `pnpm`, match the repo lockfile)
- **Rust** (stable via `rustup`)
- **macOS**: if you hit OpenSSL errors, with Homebrew:
  ```bash
  brew install openssl@3
  export OPENSSL_DIR=$(brew --prefix openssl@3)
  export PKG_CONFIG_PATH=$(brew --prefix openssl@3)/lib/pkgconfig
  ```

### Clone and install

```bash
git clone <repository-url>
cd skills-managers
npm install
```

### Optional: enable analytics & monitoring (Aptabase + Sentry)

The app reads environment variables from files such as `.env`, `.env.local`, and `src-tauri/.env`. If you want analytics or monitoring, create a `.env` file and fill in what you need:

- `APTABASE_APP_KEY`: product events (frontend `trackEvent` + Rust lifecycle events)
- `VITE_SENTRY_DSN`: frontend React error reporting
- `SENTRY_DSN`: Rust panic / error reporting
- `VITE_ENABLE_TELEMETRY=false`: hard-disable frontend telemetry

### Development

```bash
npm run tauri:dev
```

Starts Vite (default `http://localhost:5173`) and opens the desktop window; frontend changes hot reload, while Rust changes follow the normal Tauri rebuild flow.

In a **plain browser**, some features use mock data; use the Tauri window for full behavior.

---

## Build & release

```bash
# Windows x64
npm run tauri:build

# macOS (targets as needed; see Tauri docs)
npm run tauri:build -- --target aarch64-apple-darwin
npm run tauri:build -- --target x86_64-apple-darwin
```

Artifacts live under `src-tauri/target/release/` and `src-tauri/target/release/bundle/` (installers depend on platform).

For Rust-only iteration:

```bash
cargo build --manifest-path=src-tauri/Cargo.toml
```

---

## Config & data paths (summary)

- App config: `~/.skills-manager/config.json` (skill enablement, agents, language, etc.)
- Central skills dir: `~/.skills-manager/skills/`
- GitHub config: `~/.skills-manager/github-config.json`

Skill metadata comes from **`SKILL.md`** in each folder (YAML frontmatter recommended: `name`, `description`, etc.).

---

## Troubleshooting

| Symptom | What to try |
|---------|----------------|
| Icon format errors | `npx @tauri-apps/cli icon <source-image>` |
| Port 5173 in use | Free the port or change Vite port |
| macOS OpenSSL | Set `OPENSSL_DIR` / `PKG_CONFIG_PATH` as above |
| Empty skill list | Install agents, ensure paths and `SKILL.md` exist, rescan in the UI |

For more screenshots and static documentation, see **`docs/`**. If docs and code ever disagree, trust the current code.

---

## Repository layout (short)

```
skills-manager/
├── app/                 # React frontend (Vite)
├── src-tauri/           # Tauri + Rust backend
├── docs/                # Docs & assets (e.g. docs/assets/logo.png)
├── LICENSE
├── README.md            # Chinese readme
└── README.en.md         # This file (English)
```

---

## Contributing

[GitHub Issues](https://github.com/cchao123/skills-managers/issues) and pull requests welcome: features, docs, i18n, bug fixes.

1. Fork the repo  
2. Branch: `git checkout -b feature/your-feature`  
3. Commit and push  
4. Open a pull request  

Before pushing, run **`npm run build`** (includes `tsc`) and **`cargo build`** when you can to reduce CI noise.

---

## License

**MIT** — see [`LICENSE`](LICENSE).

---

## Acknowledgments

- [Tauri](https://tauri.app/) · [Material Symbols](https://fonts.google.com/icons) · [Claude Code](https://claude.ai/code)
