# Skills Manager User Guide

## Introduction

Skills Manager is a desktop app for macOS and Windows that helps you manage skills across multiple AI agents. It brings skills from different locations into one place so you can browse, enable, import, back them up, and redistribute them.

Built-in agent presets currently include:

- Claude Code
- Cursor
- Codex
- OpenClaw
- OpenCode
- Trae
- Qoder
- Antigravity
- Kiro

The app is built with Tauri 2 + React and supports both Chinese and English, plus light and dark themes.

---

## Quick Start

1. Download the latest release from [GitHub Releases](https://github.com/cchao123/skills-manager/releases)
2. Install and launch the app
3. On first launch, the app automatically scans local agent directories and detects installed skills

---

## Navigation Overview

The left navigation bar currently has 4 main entries:

| Entry | Purpose |
|------|---------|
| **Marketplace** | Browse community skills and download them to Root or a specific agent |
| **Installed** | View detected skills on your machine, filter by source, enable, import, or delete them |
| **GitHub Backup** | Sync your skills to GitHub or restore them from a remote repository |
| **Settings** | Configure language, appearance, advanced behavior, agent management, and app info |

The default landing page is **Marketplace**.

Useful shortcuts:

- `Ctrl/Cmd + A`: open Marketplace
- `Ctrl/Cmd + S`: open Installed
- `Ctrl/Cmd + D`: open GitHub Backup

---

## 1. Marketplace

Marketplace is used to browse and install community skills from `skills.sh`.

### 1.1 Rankings and Search

- Supports **All / Trending / Hot**
- Search by skill name or description
- Loads more results as you scroll

Ranking shortcuts:

- `Ctrl/Cmd + 1`: switch to All
- `Ctrl/Cmd + 2`: switch to Trending
- `Ctrl/Cmd + 3`: switch to Hot

### 1.2 Choose an Install Target

In the top-right area, you can choose where downloads go:

- **Root**: installs to the central Skills Manager directory `~/.skills-manager/skills/` and is the recommended option
- **Specific agent**: installs directly to a detected agent

### 1.3 Skill Details and Install

- Click a skill card to open its details
- The detail area shows description, preview content, and source information
- Click download to install the skill into the currently selected target

---

## 2. Installed

The Installed page uses a **flat card view** to display skills.

### 2.1 Left Source Rail

The left side of the page contains a source filter rail:

- **ALL**: shows skills from every source
- **Root**: shows only skills in the Skills Manager root directory
- **Agent entries**: show only skills from the selected agent source
- **Bottom settings button**: jumps to `Settings > Agents`

Tips:

- Clicking a source filters the card list to that source
- Right-clicking a source icon opens the corresponding folder

### 2.2 Search, Status Filters, and Prefix Hiding

The top bar supports:

- searching by skill name or description
- filtering by status using the stats bar
- opening the prefix filter to hide skills with specific prefixes

Prefix filters can also be managed from `Settings > Advanced`.

### 2.3 Source Path and Import

When **Root** or a specific agent is selected, the list header shows the current scan path.

At that point, an import button also appears so you can copy skills from other agents into the current source.

If you want to jump straight to an agent directory, you can also right-click that agent in the left source rail to open its folder.

### 2.4 Skill Cards

Each skill card supports:

- a **main toggle** for bulk enable/disable of shareable agent targets
- an **expand action** to inspect per-agent status
- **details** to open the right-side detail panel
- a **context menu** for actions such as pinning

Notes:

- Skills from native agent directories cannot simply be "unshared" with one click
- Native-source agents stay protected, so the main toggle does not turn those sources off

### 2.5 Right Detail Panel

Clicking into a skill opens a **resizable right-side detail panel**.

The panel includes:

- a file tree and file content preview
- per-agent enable state
- delete actions

Delete rules:

- In the current build, deletions are effectively limited to the skill's Root copy
- Native agent-source rows are shown as protected in the delete dialog

### 2.6 Drag-and-Drop Import

You can drag folders containing `SKILL.md` directly into the app window:

1. A "drop to install" overlay appears
2. Releasing starts the import and shows progress
3. A success or error notification appears when it finishes
4. Multiple folders can be imported at once

---

## 3. GitHub Backup

The GitHub Backup page is used to sync the central skills directory to GitHub or restore it from GitHub.

### 3.1 Setup Steps

1. Create a repository on GitHub for your skills
2. Generate a **fine-grained personal access token**
3. Grant at least **Contents: Read and write** on the target repository
4. Fill in:
   - **Owner**
   - **Repository**
   - **Branch**
   - **Token**
5. Click **Test Connection**

### 3.2 Sync to GitHub

You can sync in two modes:

- **Normal sync**: pushes regular changes
- **Overwrite remote**: force the remote repository to match local content

Overwrite mode always asks for confirmation first.

### 3.3 Restore from GitHub

You can restore in two modes:

- **Normal restore**: remote files overwrite matching local files, while local-only files are kept
- **Overwrite local**: the local directory becomes an exact copy of the remote, and local-only files are deleted

Overwrite-local also requires confirmation.

### 3.4 Other Features

- A floating action button opens `~/.skills-manager`
- A status area reflects the current repository connection state
- The page includes a built-in step-by-step configuration guide

### 3.5 Share with Others

At the bottom of the page, the sharing section generates Claude Code commands:

1. Register the marketplace

```text
/plugin marketplace add owner/repo
```

2. Install a specific skill

```text
/plugin install <skill-name>@owner/repo
```

---

## 4. Settings

Settings currently has 4 tabs: **General / Advanced / Agents / About**.

### 4.1 General

The General tab includes:

- **Language**: switch between Chinese and English
- **Appearance**: light, dark, or follow system
- **Search Bar Preferences**: configure which search-bar elements are shown

### 4.2 Advanced

The Advanced tab includes:

- **Advanced Mode**: an advanced safety toggle exposed in Settings
- **Skill Filter**: manage hidden skill prefixes

Use Advanced Mode carefully when working with delete-related workflows.

### 4.3 Agents

The Agents tab shows supported agents and their detection status.

- Detected agents can be clicked to open their directories
- Undetected agents are shown as not installed
- The bottom area also includes an entry for the Skills Manager root folder (`~/.skills-manager`)

### 4.4 About

The About tab displays:

- the current app version
- project links
- basic project information

---

## 5. Skill File Format

Every skill is a folder, and its root should contain a `SKILL.md`.

Recommended format:

```markdown
---
name: my-skill
description: A short description of the skill
---

# My Skill

The actual content of the skill...
```

### Common Storage Locations

Common locations include:

- the central Skills Manager directory: `~/.skills-manager/skills/`
- each agent's own `skills` directory
- some native cache or extension directories that the app scans automatically

If you are unsure which path a specific agent currently uses, check `Settings > Agents` and open it from there.

---

## 6. FAQ

### GitHub Connection Failed

- Make sure the token has `Contents: Read and write` on the target repository
- Check that Owner, Repository, and Branch are correct
- Check your network connection

### Agent Not Detected

The app checks local directories to detect agents. If an installed agent does not appear:

- verify the installation path
- check detection state in `Settings > Agents`
- restart the app if needed

### Skill Import Failed

Make sure:

- the folder root contains `SKILL.md`
- the frontmatter in `SKILL.md` is valid
- the target location is writable

### I Cannot Delete a Skill

Common reasons:

- the skill only exists in a native agent directory, so there is no deletable Root copy
- the current delete dialog still protects native agent-source rows

### Marketplace Download Fails

- make sure your network can access `skills.sh`
- make sure the target install location is writable
- if installing to a specific agent, confirm that the agent has been detected correctly
