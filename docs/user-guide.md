# Skills Manager 使用说明

## 简介

Skills Manager 是一款面向 macOS / Windows 的桌面应用，用来管理多个 AI Agent 的 skills。它可以把不同来源的 skills 聚合到一个界面里，方便你浏览、启用、导入、备份和分发。

当前内置的 Agent 预设包括：

- Claude Code
- Cursor
- Codex
- OpenClaw
- OpenCode
- Trae
- Qoder
- Antigravity
- Kiro

应用基于 Tauri 2 + React 构建，支持中文 / 英文界面、浅色 / 深色主题。

---

## 快速开始

1. 从 [GitHub Releases](https://github.com/cchao123/skills-manager/releases) 下载最新版本
2. 安装并启动应用
3. 首次启动后，应用会自动扫描本地 Agent 目录并识别已安装的 skills

---

## 导航概览

左侧导航栏当前包含 4 个主要入口：

| 入口 | 功能 |
|------|------|
| **Marketplace** | 浏览社区 skills，选择目标位置后下载到 Root 或指定 Agent |
| **Installed** | 查看本机已发现的 skills，并按来源筛选、启用、导入、删除 |
| **GitHub Backup** | 将 skills 同步到 GitHub，或从远程恢复 |
| **Settings** | 配置语言、外观、Advanced、Agent 管理与关于信息 |

默认打开的是 **Marketplace**。

常用快捷键：

- `Ctrl/Cmd + A`：打开 Marketplace
- `Ctrl/Cmd + S`：打开 Installed
- `Ctrl/Cmd + D`：打开 GitHub Backup

---

## 1. Marketplace

Marketplace 用于浏览和安装来自 `skills.sh` 的社区 skills。

### 1.1 榜单与搜索

- 支持 **All / Trending / Hot** 三个榜单
- 可按 skill 名称或描述搜索
- 支持滚动加载更多结果

榜单切换快捷键：

- `Ctrl/Cmd + 1`：切换到 All
- `Ctrl/Cmd + 2`：切换到 Trending
- `Ctrl/Cmd + 3`：切换到 Hot

### 1.2 选择安装目标

页面右上角可以选择下载目标：

- **Root**：安装到 Skills Manager 的中央目录 `~/.skills-manager/skills/`，也是推荐方式
- **指定 Agent**：直接安装到某个已检测到的 Agent

### 1.3 技能详情与安装

- 点击技能卡片可查看详情
- 详情区会显示描述、预览内容、来源信息等
- 点击下载后，应用会把 skill 保存到你当前选中的目标位置

---

## 2. Installed（已安装）

当前已安装页采用**平铺卡片视图**展示 skills。

### 2.1 左侧来源栏

页面左侧提供来源筛选栏，用来切换当前查看范围：

- **ALL**：显示所有来源的 skills
- **Root**：只看 Skills Manager 根目录中的 skills
- **各 Agent**：只看对应 Agent 来源的 skills
- **底部设置按钮**：跳转到 `Settings > Agents`

提示：

- 点击来源后，主区域会按当前来源过滤技能卡片
- 右键来源图标可直接打开对应目录

### 2.2 搜索、状态筛选与前缀过滤

顶部搜索栏支持：

- 按名称、描述搜索已安装 skills
- 通过状态统计条筛选全部 / 已启用 / 未启用
- 打开前缀过滤器，隐藏特定前缀的 skills

前缀过滤器也可以在 `Settings > Advanced` 中统一管理。

### 2.3 来源路径与导入

当你切换到 **Root** 或某个具体 Agent 时，列表上方会显示当前来源的扫描路径。

此时还会出现“从其他 Agent 导入”按钮，用于把其他来源里的 skill 复制到当前来源。

如果你想直接进入某个 Agent 的目录，也可以在左侧来源栏中右键对应 Agent 图标打开目录。

### 2.4 技能卡片

每张技能卡片支持以下操作：

- **主开关**：批量控制可分发到其他 Agent 的启用状态
- **展开卡片**：查看每个 Agent 的启用状态
- **详情**：打开右侧详情面板
- **右键菜单**：支持置顶 / 取消置顶等操作

注意：

- 来自 Agent 原生目录的 skill 不能直接“一键取消共享”
- 原生来源对应的 Agent 会保持受保护状态，主开关不会把这类来源直接关掉

### 2.5 右侧详情面板

点击技能详情后，页面右侧会展开一个**可调宽度**的详情面板。

详情面板包括：

- 文件树与文件内容预览
- 各 Agent 的单独启用状态
- 删除操作

删除规则：

- 当前版本里，删除实质上仍以 skill 的 Root 副本为主
- 原生 Agent 来源会在删除弹窗中保持受保护状态

### 2.6 拖拽导入

将包含 `SKILL.md` 的文件夹直接拖入应用窗口即可导入：

1. 拖入时会显示“释放安装”提示
2. 松开后开始导入并显示进度
3. 完成后弹出成功或失败提示
4. 支持同时拖入多个文件夹

---

## 3. GitHub Backup

GitHub Backup 页面用于把中央 skills 目录同步到 GitHub，或从 GitHub 恢复。

### 3.1 配置步骤

1. 在 GitHub 上创建一个用于存放 skills 的仓库
2. 生成一个 **fine-grained personal access token**
3. 给该 token 至少授予目标仓库的 **Contents: Read and write** 权限
4. 在页面中填写：
   - **Owner**
   - **Repository**
   - **Branch**
   - **Token**
5. 点击“Test Connection”验证配置

### 3.2 同步到 GitHub

点击同步按钮后，可以选择两种方式：

- **普通同步**：推送正常变更
- **覆盖远程**：以本地内容强制覆盖远程仓库内容

选择“覆盖远程”时，应用会弹出二次确认。

### 3.3 从 GitHub 恢复

点击恢复按钮后，也可以选择两种方式：

- **普通恢复**：远程同名文件覆盖本地，本地独有文件保留
- **覆盖本地**：本地目录完全以远程为准，本地独有文件会被删除

选择“覆盖本地”时，应用同样会弹出二次确认。

### 3.4 其他功能

- 页面右下角的悬浮按钮可直接打开 `~/.skills-manager`
- 连接成功后会显示当前仓库状态
- 页面内置配置向导，可按步骤完成 GitHub 设置

### 3.5 分享给他人

页面底部的分享区会生成 Claude Code 的使用命令：

1. 注册 Marketplace

```text
/plugin marketplace add owner/repo
```

2. 安装指定 skill

```text
/plugin install <skill-name>@owner/repo
```

---

## 4. Settings

Settings 当前包含 4 个标签页：**General / Advanced / Agents / About**。

### 4.1 General

General 标签页主要包括：

- **Language**：切换中英文
- **Appearance**：浅色 / 深色 / 跟随系统
- **Search Bar Preferences**：调整顶部搜索栏相关显示项

### 4.2 Advanced

Advanced 标签页包括：

- **Advanced Mode**：Settings 中提供的高级安全开关
- **Skill Filter**：配置要隐藏的 skill 前缀

涉及删除类操作时，请谨慎使用 Advanced Mode。

### 4.3 Agents

Agents 标签页会显示所有已支持的 Agent 及检测状态。

- 已检测到的 Agent 可点击打开目录
- 未检测到的 Agent 会显示为未安装状态
- 页面底部还有 Skills Manager 自身的根目录入口（`~/.skills-manager`）

### 4.4 About

About 标签页显示：

- 当前应用版本
- 项目相关链接
- 项目基础说明

---

## 5. Skill 文件格式

每个 skill 都是一个文件夹，根目录至少需要包含 `SKILL.md`。

推荐格式：

```markdown
---
name: my-skill
description: 技能的简要描述
---

# My Skill

技能的具体内容...
```

### 常见存放位置

最常见的 skill 位置包括：

- Skills Manager 中央目录：`~/.skills-manager/skills/`
- 各 Agent 自身的 `skills` 目录
- 某些 Agent 的原生缓存或扩展目录（应用会自动扫描）

如果你不确定某个 Agent 当前使用的是哪个路径，请直接在 `Settings > Agents` 中查看或打开。

---

## 6. 常见问题

### GitHub 连接失败

- 检查 token 是否配置了目标仓库的 `Contents: Read and write`
- 确认 Owner、Repository、Branch 填写正确
- 检查网络连接

### Agent 未检测到

应用通过检查本地目录来判断 Agent 是否存在。如果已安装但未显示：

- 确认安装路径正确
- 打开 `Settings > Agents` 查看检测状态
- 必要时重新启动应用

### 导入 skill 失败

请确认：

- 文件夹根目录中包含 `SKILL.md`
- `SKILL.md` 的 frontmatter 格式正确
- 目标目录具备写入权限

### 无法删除某个 skill

常见原因有两种：

- 该 skill 只有 Agent 原生来源，没有可删除的 Root 副本
- 当前版本的删除弹窗仍会保护原生 Agent 来源条目

### Marketplace 无法下载

- 检查网络是否可以访问 `skills.sh`
- 检查目标安装位置是否可写
- 若安装到指定 Agent，确认该 Agent 已被正确检测到
