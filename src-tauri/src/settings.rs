use crate::models::{AgentConfig, AppConfig, LinkStrategy, CURRENT_SCHEMA_VERSION};
use chrono::Local;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

fn atomic_write(path: &Path, content: &str) -> std::io::Result<()> {
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, content)?;
    fs::rename(&tmp, path)
}

fn write_default_config(config_path: &Path) -> Result<AppConfig, AppSettingsError> {
    let mut default = AppConfig::default();
    default.agents = AppSettingsManager::known_agent_presets();

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = serde_json::to_string_pretty(&default)?;
    atomic_write(config_path, &content)?;

    Ok(default)
}

fn backup_invalid_config(config_path: &Path, content: &str, error: &serde_json::Error) {
    let timestamp = Local::now().format("%Y%m%d-%H%M%S");
    let backup_path = config_path.with_extension(format!("json.invalid-{timestamp}"));

    eprintln!(
        "[settings] invalid config at {:?}: {}. Backing up to {:?} and recreating defaults.",
        config_path, error, backup_path
    );

    if let Err(write_err) = fs::write(&backup_path, content) {
        eprintln!(
            "[settings] failed to back up invalid config to {:?}: {}",
            backup_path, write_err
        );
    }
}

#[derive(Debug, Error)]
pub enum AppSettingsError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Agent not found: {0}")]
    AgentNotFound(String),

    #[error("Agent already exists: {0}")]
    AgentAlreadyExists(String),
}

pub struct AppSettingsManager {
    config_path: PathBuf,
    config: AppConfig,
}

impl AppSettingsManager {
    fn known_agent_presets() -> Vec<AgentConfig> {
        vec![
            AgentConfig {
                name: "claude".to_string(),
                display_name: "Claude Code".to_string(),
                path: "~/.claude".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "cursor".to_string(),
                display_name: "Cursor".to_string(),
                path: "~/.cursor".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "codex".to_string(),
                display_name: "Codex".to_string(),
                path: "~/.codex".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "openclaw".to_string(),
                display_name: "OpenClaw".to_string(),
                path: "~/.openclaw".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "opencode".to_string(),
                display_name: "OpenCode".to_string(),
                path: "~/.opencode".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "trae".to_string(),
                display_name: "Trae".to_string(),
                path: "~/.trae".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "qoder".to_string(),
                display_name: "Qoder".to_string(),
                path: "~/.qoder".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "antigravity".to_string(),
                display_name: "Antigravity".to_string(),
                path: "~/.antigravity".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
            AgentConfig {
                name: "kiro".to_string(),
                display_name: "Kiro".to_string(),
                path: "~/.kiro".to_string(),
                skills_path: "skills".to_string(),
                enabled: true,
                detected: false,
                extra_paths: vec![],
            },
        ]
    }

    pub fn load_or_create(config_path: &Path) -> Result<Self, AppSettingsError> {
        let mut config = if config_path.exists() {
            let content = fs::read_to_string(config_path)?;
            let mut loaded: AppConfig = match serde_json::from_str(&content) {
                Ok(config) => config,
                Err(error) => {
                    backup_invalid_config(config_path, &content, &error);
                    write_default_config(config_path)?
                }
            };

            if loaded.schema_version != CURRENT_SCHEMA_VERSION {
                eprintln!(
                    "[settings] schema_version mismatch (file={:?}, current={}). Dropping skill_states and rebuilding on next scan.",
                    loaded.schema_version, CURRENT_SCHEMA_VERSION
                );
                loaded.schema_version = CURRENT_SCHEMA_VERSION.to_string();
                loaded.skill_states.clear();

                let content = serde_json::to_string_pretty(&loaded)?;
                atomic_write(config_path, &content)?;
            }

            loaded
        } else {
            write_default_config(config_path)?
        };

        const REMOVED_PRESETS: &[&str] = &["trae-cn"];
        let before_len = config.agents.len();
        config
            .agents
            .retain(|agent| !REMOVED_PRESETS.contains(&agent.name.as_str()));
        let mut config_updated = config.agents.len() != before_len;
        if config_updated {
            eprintln!(
                "[settings] removed deprecated agents: {:?}",
                REMOVED_PRESETS
            );
        }

        for preset in Self::known_agent_presets() {
            if let Some(existing) = config
                .agents
                .iter_mut()
                .find(|agent| agent.name == preset.name)
            {
                if existing.extra_paths.is_empty() && !preset.extra_paths.is_empty() {
                    existing.extra_paths = preset.extra_paths.clone();
                    config_updated = true;
                }

                if existing.skills_path != preset.skills_path {
                    eprintln!(
                        "[settings] fixing skills_path for {}: {} -> {}",
                        existing.name, existing.skills_path, preset.skills_path
                    );
                    existing.skills_path = preset.skills_path.clone();
                    config_updated = true;
                }
            } else {
                eprintln!("[settings] adding missing agent: {}", preset.name);
                config.agents.push(preset);
                config_updated = true;
            }
        }

        if config_updated {
            let content = serde_json::to_string_pretty(&config)?;
            atomic_write(config_path, &content)?;
        }

        Ok(Self {
            config_path: config_path.to_path_buf(),
            config,
        })
    }

    pub fn get_config(&self) -> &AppConfig {
        &self.config
    }

    pub fn get_config_mut(&mut self) -> &mut AppConfig {
        &mut self.config
    }

    pub fn save(&self) -> Result<(), AppSettingsError> {
        let content = serde_json::to_string_pretty(&self.config)?;
        atomic_write(&self.config_path, &content)?;
        Ok(())
    }

    pub fn add_agent(&mut self, agent: AgentConfig) -> Result<(), AppSettingsError> {
        if self
            .config
            .agents
            .iter()
            .any(|existing| existing.name == agent.name)
        {
            return Err(AppSettingsError::AgentAlreadyExists(format!(
                "Agent '{}' already exists",
                agent.name
            )));
        }

        self.config.agents.push(agent);
        Ok(())
    }

    pub fn remove_agent(&mut self, name: &str) -> Result<(), AppSettingsError> {
        let original_len = self.config.agents.len();
        self.config.agents.retain(|agent| agent.name != name);

        if self.config.agents.len() == original_len {
            return Err(AppSettingsError::AgentNotFound(name.to_string()));
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub fn update_agent(
        &mut self,
        name: &str,
        updated: AgentConfig,
    ) -> Result<(), AppSettingsError> {
        let pos = self
            .config
            .agents
            .iter()
            .position(|agent| agent.name == name)
            .ok_or_else(|| AppSettingsError::AgentNotFound(name.to_string()))?;

        self.config.agents[pos] = updated;
        Ok(())
    }

    pub fn set_linking_strategy(&mut self, strategy: LinkStrategy) -> Result<(), AppSettingsError> {
        self.config.linking_strategy = strategy;
        Ok(())
    }

    pub fn update_language(&mut self, lang: &str) -> Result<(), AppSettingsError> {
        self.config.language = lang.to_string();
        self.save()?;
        Ok(())
    }

    pub fn set_skill_hide_prefixes(
        &mut self,
        prefixes: Vec<String>,
    ) -> Result<(), AppSettingsError> {
        let mut seen = std::collections::HashSet::new();
        let normalized: Vec<String> = prefixes
            .into_iter()
            .map(|prefix| prefix.trim().to_string())
            .filter(|prefix| !prefix.is_empty() && seen.insert(prefix.clone()))
            .collect();
        self.config.skill_hide_prefixes = normalized;
        self.save()?;
        Ok(())
    }

    pub fn get_skills_manager_dir() -> PathBuf {
        dirs::home_dir().unwrap().join(".skills-manager")
    }

    pub fn get_skills_dir() -> PathBuf {
        Self::get_skills_manager_dir().join("skills")
    }

    pub fn get_config_path() -> PathBuf {
        Self::get_skills_manager_dir().join("config.json")
    }

    pub fn detect_agents(&mut self) -> Result<usize, AppSettingsError> {
        let mut detected_count = 0;
        let home_dir = dirs::home_dir().ok_or_else(|| {
            AppSettingsError::AgentNotFound("Cannot find home directory".to_string())
        })?;

        for agent in &mut self.config.agents {
            let agent_path = if agent.path.starts_with("~/") {
                home_dir.join(&agent.path[2..])
            } else if agent.path.starts_with('~') {
                home_dir.join(&agent.path[1..])
            } else {
                home_dir.join(&agent.path)
            };

            let extra_exists = agent.extra_paths.iter().any(|extra_path| {
                let path = if extra_path.starts_with("~/") {
                    home_dir.join(&extra_path[2..])
                } else if extra_path.starts_with('~') {
                    home_dir.join(&extra_path[1..])
                } else {
                    home_dir.join(extra_path.as_str())
                };
                path.exists()
            });

            eprintln!(
                "Checking agent path: {:?}, exists: {}",
                agent_path,
                agent_path.exists()
            );
            agent.detected = agent_path.exists() || extra_exists;

            if agent.detected {
                detected_count += 1;
            }
        }

        eprintln!(
            "Detected {} out of {} agents",
            detected_count,
            self.config.agents.len()
        );
        Ok(detected_count)
    }
}
