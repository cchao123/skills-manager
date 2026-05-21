// Keep the console in debug builds so startup crashes are easier to diagnose on Windows.
#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]

mod commands;
mod github;
mod linker;
mod models;
mod scanner;
mod settings;
mod state;
mod tray;

use chrono::Local;
use settings::AppSettingsManager;
use state::AppState;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{tray::TrayIconBuilder, Manager};

struct TeeWriter {
    file: std::fs::File,
    mirror_stderr: bool,
}

impl Write for TeeWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.file.write_all(buf)?;
        self.file.flush()?;

        if self.mirror_stderr {
            let mut stderr = io::stderr();
            stderr.write_all(buf)?;
            stderr.flush()?;
        }

        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        self.file.flush()?;

        if self.mirror_stderr {
            io::stderr().flush()?;
        }

        Ok(())
    }
}

fn load_env_for_runtime() {
    let candidates = [
        ".env",
        ".env.local",
        "../.env",
        "../.env.local",
        "src-tauri/.env",
        "src-tauri/.env.local",
    ];

    for path in candidates {
        let _ = dotenvy::from_filename_override(path);
    }
}

fn init_sentry() -> Option<sentry::ClientInitGuard> {
    let dsn = std::env::var("SENTRY_DSN").ok()?;
    let dsn = dsn.trim();
    if dsn.is_empty() {
        return None;
    }

    let environment = std::env::var("SENTRY_ENVIRONMENT").ok();
    let guard = sentry::init((
        dsn.to_string(),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: environment.map(Into::into),
            ..Default::default()
        },
    ));
    log::info!("Sentry initialized");
    Some(guard)
}

fn resolve_log_path() -> Option<PathBuf> {
    dirs::home_dir().map(|home| {
        home.join(".skills-manager")
            .join("logs")
            .join("skills-manager.log")
    })
}

fn init_logging() -> Option<PathBuf> {
    let log_path = resolve_log_path()?;
    let parent = log_path.parent()?;
    fs::create_dir_all(parent).ok()?;

    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .ok()?;

    let mut builder = env_logger::Builder::from_default_env();
    if std::env::var_os("RUST_LOG").is_none() {
        builder.filter_level(log::LevelFilter::Info);
    }
    builder.format_timestamp_secs();
    builder.target(env_logger::Target::Pipe(Box::new(TeeWriter {
        file,
        mirror_stderr: cfg!(debug_assertions),
    })));
    let _ = builder.try_init();

    Some(log_path)
}

fn install_panic_hook(log_path: Option<PathBuf>) {
    let default_hook = std::panic::take_hook();

    std::panic::set_hook(Box::new(move |panic_info| {
        if let Some(path) = &log_path {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }

            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
                let _ = writeln!(
                    file,
                    "[{}] panic: {}",
                    Local::now().format("%Y-%m-%d %H:%M:%S"),
                    panic_info
                );
                let backtrace = std::backtrace::Backtrace::force_capture();
                let _ = writeln!(file, "{backtrace}");
                let _ = file.flush();
            }
        }

        default_hook(panic_info);
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init());

    let app = builder
        .setup(move |app| {
            let config_path = AppSettingsManager::get_config_path();
            log::info!("Loading app settings from {:?}", config_path);
            let settings_manager = AppSettingsManager::load_or_create(&config_path)
                .expect("Failed to initialize AppSettingsManager");

            let config = settings_manager.get_config().clone();
            let skill_states = config.skill_states.clone();
            let agents = config.agents.clone();

            log::info!("Prewarming skill scan during startup");
            let _skills =
                scanner::scan_all_skill_sources(&skill_states, &agents).unwrap_or_default();

            app.manage(AppState {
                settings_manager: Mutex::new(settings_manager),
            });

            let lang = config.language.clone();
            if let Some(icon) = app.default_window_icon().cloned() {
                log::info!("Initializing tray icon");
                match TrayIconBuilder::with_id("main-tray")
                    .icon(icon)
                    .icon_as_template(true)
                    .tooltip("Skills Manager")
                    .show_menu_on_left_click(cfg!(not(target_os = "windows")))
                    .on_tray_icon_event(|tray, event| {
                        #[cfg(target_os = "windows")]
                        if let tauri::tray::TrayIconEvent::Click {
                            button: tauri::tray::MouseButton::Left,
                            button_state: tauri::tray::MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            #[cfg(target_os = "macos")]
                            let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                        }
                        "quit" => {
                            if let Some(window) = app.get_webview_window("main") {
                                window.destroy().ok();
                            }
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .build(app)
                {
                    Ok(_tray) => {
                        if let Err(error) = tray::rebuild_tray_menu(app, &lang) {
                            log::warn!("Failed to build tray menu during startup: {}", error);
                        }
                    }
                    Err(error) => {
                        log::warn!("Failed to initialize tray icon during startup: {}", error);
                    }
                }
            } else {
                log::warn!("No default window icon available; skipping tray initialization");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                #[cfg(target_os = "macos")]
                let _ = window
                    .app_handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::skills::list_skills,
            commands::skills::enable_skill,
            commands::skills::disable_skill,
            commands::skills::set_skill_primary,
            commands::skills::get_skill_content,
            commands::skills::get_skill_files,
            commands::skills::read_skill_file,
            commands::skills::rescan_skills,
            commands::skills::delete_skill,
            commands::skills::import_skill_folder,
            commands::skills::copy_skill_to_agent,
            commands::marketplace::fetch_marketplace_skills,
            commands::marketplace::fetch_skill_detail,
            commands::marketplace::fetch_marketplace_skill_content,
            commands::marketplace::download_skill_from_marketplace,
            commands::settings::get_agents,
            commands::settings::add_agent,
            commands::settings::remove_agent,
            commands::settings::get_config,
            commands::settings::set_linking_strategy,
            commands::settings::open_skills_manager_folder,
            commands::settings::detect_agents,
            commands::settings::open_folder,
            commands::github::test_github_connection,
            commands::github::save_github_config,
            commands::github::get_github_config,
            commands::github::sync_github_repo,
            commands::github::restore_from_github,
            commands::github::star_github_repo,
            commands::github::check_github_star,
            commands::theme::set_window_theme,
            commands::window::set_skill_pinned,
            commands::window::get_pinned_skills,
            tray::update_tray_language,
            tray::set_skill_hide_prefixes,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |_app_handle, _event| {});
}

#[cfg(not(mobile))]
fn main() {
    let log_path = init_logging();
    install_panic_hook(log_path.clone());

    load_env_for_runtime();

    if let Some(path) = &log_path {
        log::info!("Logging startup diagnostics to {:?}", path);
    }
    log::info!("Skills Manager starting...");
    let _sentry_guard = init_sentry();

    run();
}

#[cfg(test)]
mod tests;
