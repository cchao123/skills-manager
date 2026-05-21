use tempfile::TempDir;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{AgentConfig, LinkStrategy, CURRENT_SCHEMA_VERSION};

    fn test_agent() -> AgentConfig {
        AgentConfig {
            name: "test-agent".to_string(),
            display_name: "Test Agent".to_string(),
            path: "~/.test".to_string(),
            skills_path: "skills".to_string(),
            enabled: true,
            detected: false,
            extra_paths: vec![],
        }
    }

    #[test]
    fn test_create_default_config() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let manager = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let config = manager.get_config();
        let agent_names: Vec<&str> = config
            .agents
            .iter()
            .map(|agent| agent.name.as_str())
            .collect();

        assert!(config.agents.len() >= 5);
        assert!(agent_names.contains(&"claude"));
        assert!(agent_names.contains(&"cursor"));
        assert!(agent_names.contains(&"codex"));
        assert!(agent_names.contains(&"openclaw"));
        assert!(agent_names.contains(&"opencode"));
        assert_eq!(
            config
                .agents
                .iter()
                .find(|agent| agent.name == "claude")
                .unwrap()
                .skills_path,
            "skills"
        );
    }

    #[test]
    fn test_save_and_load_config() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let mut manager =
            crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let default_count = manager.get_config().agents.len();

        manager.add_agent(test_agent()).unwrap();
        manager.save().unwrap();

        let manager2 = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let config = manager2.get_config();

        assert_eq!(config.agents.len(), default_count + 1);
        assert_eq!(config.agents.last().unwrap().name, "test-agent");
    }

    #[test]
    fn test_remove_agent() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let mut manager =
            crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let default_count = manager.get_config().agents.len();

        manager.add_agent(test_agent()).unwrap();
        assert_eq!(manager.get_config().agents.len(), default_count + 1);

        manager.remove_agent("test-agent").unwrap();
        assert_eq!(manager.get_config().agents.len(), default_count);
    }

    #[test]
    fn test_schema_version_mismatch_resets_skill_states() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let legacy = serde_json::json!({
            "schema_version": "v0-legacy",
            "linking_strategy": "symlink",
            "agents": [],
            "skill_states": {
                "stale-skill": { "sources": ["global"], "primary": "global", "open": ["claude"] }
            },
            "language": "zh",
            "skill_hide_prefixes": []
        });
        std::fs::write(&config_path, serde_json::to_string_pretty(&legacy).unwrap()).unwrap();

        let manager = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let config = manager.get_config();

        assert_eq!(config.schema_version, CURRENT_SCHEMA_VERSION);
        assert!(
            config.skill_states.is_empty(),
            "skill_states should be cleared on mismatch"
        );

        let on_disk: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&config_path).unwrap()).unwrap();
        assert_eq!(
            on_disk["schema_version"].as_str(),
            Some(CURRENT_SCHEMA_VERSION)
        );
    }

    #[test]
    fn test_schema_version_match_preserves_skill_states() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let good = serde_json::json!({
            "schema_version": CURRENT_SCHEMA_VERSION,
            "linking_strategy": "symlink",
            "agents": [],
            "skill_states": {
                "keep-me": { "sources": ["global"], "primary": "global", "open": ["claude"] }
            },
            "language": "zh",
            "skill_hide_prefixes": []
        });
        std::fs::write(&config_path, serde_json::to_string_pretty(&good).unwrap()).unwrap();

        let manager = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        assert!(manager.get_config().skill_states.contains_key("keep-me"));
    }

    #[test]
    fn test_invalid_json_is_backed_up_and_reset_to_default() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        std::fs::write(&config_path, "{not-json").unwrap();

        let manager = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        let config = manager.get_config();
        let on_disk: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&config_path).unwrap()).unwrap();

        assert!(!config.agents.is_empty());
        assert_eq!(
            on_disk["schema_version"].as_str(),
            Some(CURRENT_SCHEMA_VERSION)
        );

        let backup_count = std::fs::read_dir(temp_dir.path())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with("config.json.invalid-")
            })
            .count();
        assert_eq!(backup_count, 1);
    }

    #[test]
    fn test_update_linking_strategy() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");

        let mut manager =
            crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        manager.set_linking_strategy(LinkStrategy::Copy).unwrap();
        manager.save().unwrap();

        let manager2 = crate::settings::AppSettingsManager::load_or_create(&config_path).unwrap();
        assert_eq!(manager2.get_config().linking_strategy, LinkStrategy::Copy);
    }
}
