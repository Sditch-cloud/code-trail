mod git_module;

use git_module::{CommitInfo, GitModule};

#[tauri::command]
fn get_contributors(git_path: &str) -> Result<Vec<String>, String> {
    GitModule::get_contributors(git_path)
}

#[tauri::command]
fn search_git(
    git_path: &str,
    author: &str,
    start_date: i64,
    end_date: i64,
) -> Result<Vec<CommitInfo>, String> {
    GitModule::get_filtered_commits(git_path, author, start_date, end_date)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![search_git, get_contributors])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
