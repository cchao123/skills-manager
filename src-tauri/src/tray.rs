use crate::scanner;
use crate::state::AppState;
use tauri::{
    menu::{MenuBuilder, MenuItem, SubmenuBuilder},
    Manager, Runtime,
};

struct TrayTexts {
    show: &'static str,
    quit: &'static str,
    no_skills: &'static str,
}

fn get_tray_texts(lang: &str) -> TrayTexts {
    match lang {
        "zh" | "zh-CN" | "zh-TW" => TrayTexts {
            show: "显示主窗口",
            quit: "退出",
            no_skills: "暂无技能",
        },
        _ => TrayTexts {
            show: "Show Window",
            quit: "Quit",
            no_skills: "No Skills",
        },
    }
}

pub fn rebuild_tray_menu<R: Runtime, M: Manager<R>>(
    manager: &M,
    lang: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let app = manager.app_handle();
    let texts = get_tray_texts(lang);

    let state = app.state::<AppState>();
    let config = state.settings_manager.lock().unwrap().get_config().clone();
    let skill_states = config.skill_states.clone();
    let agents = config.agents.clone();
    let all_skills = scanner::scan_all_skill_sources(&skill_states, &agents).unwrap_or_default();

    let hide_prefixes: Vec<String> = config
        .skill_hide_prefixes
        .iter()
        .map(|prefix| prefix.trim().to_lowercase())
        .filter(|prefix| !prefix.is_empty())
        .collect();

    let skills: Vec<_> = if hide_prefixes.is_empty() {
        all_skills
    } else {
        all_skills
            .into_iter()
            .filter(|skill| {
                let lower = skill.id.to_lowercase();
                !hide_prefixes.iter().any(|prefix| lower.starts_with(prefix))
            })
            .collect()
    };

    let mut menu_builder = MenuBuilder::new(app);

    for agent in &config.agents {
        if !agent.detected {
            continue;
        }

        let enabled_count = skills
            .iter()
            .filter(|skill| skill.agent_enabled.get(&agent.name) == Some(&true))
            .count();

        let submenu = SubmenuBuilder::new(
            app,
            &format!(
                "{} ({}/{})",
                agent.display_name,
                enabled_count,
                skills.len()
            ),
        );

        let submenu = if enabled_count == 0 {
            submenu.text(format!("empty-{}", agent.name), texts.no_skills)
        } else {
            let mut builder = submenu;
            for skill in &skills {
                if skill.agent_enabled.get(&agent.name) != Some(&true) {
                    continue;
                }
                builder = builder.text(format!("skill-{}-{}", agent.name, skill.id), &skill.name);
            }
            builder
        };

        menu_builder = menu_builder.item(&submenu.build()?);
    }

    let show_item = MenuItem::with_id(app, "show", texts.show, true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", texts.quit, true, None::<&str>)?;
    menu_builder = menu_builder.separator().item(&show_item).item(&quit_item);

    let menu = menu_builder.build()?;
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_menu(Some(menu))?;
    }

    Ok(())
}

#[tauri::command]
pub fn update_tray_language(app: tauri::AppHandle, lang: String) -> Result<(), String> {
    rebuild_tray_menu(&app, &lang).map_err(|error| error.to_string())?;
    let state = app.state::<AppState>();
    if let Ok(mut manager) = state.settings_manager.lock() {
        let _ = manager.update_language(&lang);
    }
    Ok(())
}

#[tauri::command]
pub fn set_skill_hide_prefixes(app: tauri::AppHandle, prefixes: Vec<String>) -> Result<(), String> {
    let state = app.state::<AppState>();
    let lang = {
        let mut manager = state
            .settings_manager
            .lock()
            .map_err(|error| format!("Failed to acquire lock: {}", error))?;
        manager
            .set_skill_hide_prefixes(prefixes)
            .map_err(|error| format!("Failed to save skill hide prefixes: {}", error))?;
        manager.get_config().language.clone()
    };

    rebuild_tray_menu(&app, &lang).map_err(|error| error.to_string())?;
    Ok(())
}
