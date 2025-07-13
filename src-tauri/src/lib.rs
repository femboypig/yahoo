// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod music;

use music::{upload_music_file, get_music_metadata, delete_music, set_favorite, get_all_music, init_music_state};
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize music state from stored database
            let music_state = init_music_state(&app.handle());
            app.manage(music_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            upload_music_file,
            get_music_metadata,
            delete_music,
            set_favorite,
            get_all_music
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
