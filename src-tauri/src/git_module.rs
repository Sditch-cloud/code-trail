use chrono::DateTime;
use git2::{Diff, DiffOptions, Error as GitError, Repository};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitInfo {
    id: String,
    message: String,
    author: String,
    email: String,
    time: i64,
    formatted_time: String,
    // 新增字段用于统计代码变更
    lines_added: usize,
    lines_deleted: usize,
}

pub struct GitModule;

impl GitModule {
    /// 打开指定路径的 Git 仓库
    pub fn open_repository(path: &str) -> Result<Repository, GitError> {
        Repository::open(path)
    }

    /// 获取一个 commit 的统计信息
    fn get_commit_stats(
        repo: &Repository,
        commit: &git2::Commit,
    ) -> Result<(usize, usize), GitError> {
        let commit_tree = commit.tree()?;

        // 如果是第一个提交，没有父提交
        if commit.parent_count() == 0 {
            let mut opts = DiffOptions::new();
            let diff = repo.diff_tree_to_tree(None, Some(&commit_tree), Some(&mut opts))?;
            return Self::collect_diff_stats(&diff);
        }

        // 否则与父提交比较
        let parent = commit.parent(0)?;
        let parent_tree = parent.tree()?;

        let mut opts = DiffOptions::new();
        let diff =
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), Some(&mut opts))?;

        Self::collect_diff_stats(&diff)
    }

    /// 从 diff 对象收集统计信息
    fn collect_diff_stats(diff: &Diff) -> Result<(usize, usize), GitError> {
        let stats = diff.stats()?;
        Ok((stats.insertions(), stats.deletions()))
    }

    /// 获取并过滤提交信息
    pub fn get_filtered_commits(
        repo_path: &str,
        author_filter: &str,
        start_date: i64,
        end_date: i64,
    ) -> Result<Vec<CommitInfo>, String> {
        // 打开仓库
        let repo = match Self::open_repository(repo_path) {
            Ok(repo) => repo,
            Err(e) => return Err(format!("无法打开仓库: {}", e)),
        };

        // 获取所有提交
        let mut commits = Vec::new();
        let mut revwalk = match repo.revwalk() {
            Ok(revwalk) => revwalk,
            Err(e) => return Err(format!("无法遍历提交历史: {}", e)),
        };

        // 配置遍历所有提交
        if let Err(e) = revwalk.push_head() {
            return Err(format!("无法获取HEAD引用: {}", e));
        }

        // 过滤并收集提交信息
        for oid in revwalk {
            let oid = match oid {
                Ok(oid) => oid,
                Err(e) => {
                    eprintln!("遍历提交出错: {}", e);
                    continue;
                }
            };

            let commit = match repo.find_commit(oid) {
                Ok(commit) => commit,
                Err(e) => {
                    eprintln!("无法获取提交: {}", e);
                    continue;
                }
            };

            let commit_time = commit.time().seconds();
            let author = commit.author();
            let author_name = author.name().unwrap_or("Unknown");

            // 根据作者和日期过滤
            // 只有当 author_filter 非空时才检查作者名字
            if (author_filter.is_empty()
                || author_name
                    .to_lowercase()
                    .contains(&author_filter.to_lowercase()))
                && commit_time >= start_date
                && commit_time <= end_date
            {
                // 格式化时间
                let dt = match DateTime::from_timestamp(commit_time, 0) {
                    Some(dt) => dt,
                    None => continue,
                };
                let formatted_time = dt.format("%Y-%m-%d %H:%M:%S").to_string();

                // 获取提交的统计信息
                let (lines_added, lines_deleted) = match Self::get_commit_stats(&repo, &commit) {
                    Ok(stats) => stats,
                    Err(e) => {
                        eprintln!("无法获取提交统计信息: {}", e);
                        (0, 0) // 获取失败时使用默认值
                    }
                };

                let commit_info = CommitInfo {
                    id: commit.id().to_string(),
                    message: commit.message().unwrap_or("").to_string(),
                    author: author_name.to_string(),
                    email: commit.author().email().unwrap_or("").to_string(),
                    time: commit_time,
                    formatted_time,
                    lines_added,
                    lines_deleted,
                };

                commits.push(commit_info);
            }
        }

        Ok(commits)
    }

    /// 获取 Git 仓库的所有提交者列表
    pub fn get_contributors(repo_path: &str) -> Result<Vec<String>, String> {
        // 打开仓库
        let repo = match Self::open_repository(repo_path) {
            Ok(repo) => repo,
            Err(e) => return Err(format!("无法打开仓库: {}", e)),
        };

        // 创建一个 HashSet 来存储唯一的作者
        let mut contributors = HashSet::new();

        // 获取所有提交
        let mut revwalk = match repo.revwalk() {
            Ok(revwalk) => revwalk,
            Err(e) => return Err(format!("无法遍历提交历史: {}", e)),
        };

        // 配置遍历所有提交
        if let Err(e) = revwalk.push_head() {
            return Err(format!("无法获取HEAD引用: {}", e));
        }

        // 收集所有提交者
        for oid in revwalk {
            let oid = match oid {
                Ok(oid) => oid,
                Err(e) => {
                    eprintln!("遍历提交出错: {}", e);
                    continue;
                }
            };

            let commit = match repo.find_commit(oid) {
                Ok(commit) => commit,
                Err(e) => {
                    eprintln!("无法获取提交: {}", e);
                    continue;
                }
            };

            let author = commit.author();
            if let Some(name) = author.name() {
                contributors.insert(name.to_string());
            }
        }

        // 将 HashSet 转换为 Vec 并排序
        let mut contributors_vec: Vec<String> = contributors.into_iter().collect();
        contributors_vec.sort(); // 按字母顺序排序

        Ok(contributors_vec)
    }
}
