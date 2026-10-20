use std::env;
use std::fs;
use zed_extension_api::{
    self as zed,
    lsp::{Completion, CompletionKind, Symbol, SymbolKind},
    settings::LspSettings,
    CodeLabel, CodeLabelSpan, LanguageServerId, Result,
};

const BUNDLED_SERVER_JS: &str = include_str!("../server/pico8-ls-server.js");
const SERVER_SCRIPT_NAME: &str = "pico8-ls-server.js";
const SERVER_VERSION_FILE: &str = "pico8-ls-version.txt";
const SERVER_VERSION: &str = env!("CARGO_PKG_VERSION");

struct Pico8Extension {
    cached_server_script_path: Option<String>,
}

impl Pico8Extension {
    fn ensure_bundled_server_script(&mut self, language_server_id: &LanguageServerId) -> Result<String> {
        if let Some(path) = &self.cached_server_script_path {
            if fs::metadata(path).is_ok() {
                return Ok(path.clone());
            }
        }

        let current_version = fs::read_to_string(SERVER_VERSION_FILE).unwrap_or_default();
        let needs_write = current_version.trim() != SERVER_VERSION
            || fs::metadata(SERVER_SCRIPT_NAME).is_err();

        if needs_write {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            // First write the embedded bundle so the extension works completely offline
            fs::write(SERVER_SCRIPT_NAME, BUNDLED_SERVER_JS).map_err(|e| {
                format!("failed to write bundled {}: {}", SERVER_SCRIPT_NAME, e)
            })?;
            let _ = fs::write(SERVER_VERSION_FILE, SERVER_VERSION);

            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::None,
            );
        }

        let work_dir = env::current_dir()
            .map_err(|e| format!("failed to resolve extension working directory: {}", e))?;
        let full_path = work_dir
            .join(SERVER_SCRIPT_NAME)
            .to_string_lossy()
            .into_owned();

        self.cached_server_script_path = Some(full_path.clone());
        Ok(full_path)
    }
}

impl zed::Extension for Pico8Extension {
    fn new() -> Self {
        Self {
            cached_server_script_path: None,
        }
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let lsp_settings = LspSettings::for_worktree(language_server_id.as_ref(), worktree).ok();
        let env_vars = lsp_settings
            .as_ref()
            .and_then(|s| s.binary.as_ref())
            .and_then(|b| b.env.as_ref())
            .map(|env_map| {
                env_map
                    .iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        // 1. Honor explicit user binary settings in Zed settings.json if configured
        if let Some(binary_settings) = lsp_settings.as_ref().and_then(|s| s.binary.as_ref()) {
            if let Some(path) = &binary_settings.path {
                let args = binary_settings
                    .arguments
                    .clone()
                    .unwrap_or_else(|| vec!["--stdio".to_string()]);
                return Ok(zed::Command {
                    command: path.clone(),
                    args,
                    env: env_vars,
                });
            }
        }

        // 2. Use pico8-ls from the user's PATH if installed globally
        if let Some(path) = worktree.which("pico8-ls") {
            return Ok(zed::Command {
                command: path,
                args: vec!["--stdio".to_string()],
                env: env_vars,
            });
        }

        // 3. Extract and run the self-contained bundled pico8-ls server using Zed's Node runtime
        let server_script = self.ensure_bundled_server_script(language_server_id)?;
        let node_path = zed::node_binary_path()?;

        Ok(zed::Command {
            command: node_path,
            args: vec![server_script, "--stdio".to_string()],
            env: env_vars,
        })
    }

    fn language_server_initialization_options(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        let initialization_options =
            LspSettings::for_worktree(language_server_id.as_ref(), worktree)
                .ok()
                .and_then(|lsp_settings| lsp_settings.initialization_options);
        Ok(initialization_options)
    }

    fn language_server_workspace_configuration(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        let settings = LspSettings::for_worktree(language_server_id.as_ref(), worktree)
            .ok()
            .and_then(|lsp_settings| lsp_settings.settings);
        Ok(settings)
    }

    fn label_for_completion(
        &self,
        _language_server_id: &LanguageServerId,
        completion: Completion,
    ) -> Option<CodeLabel> {
        let label = &completion.label;
        match completion.kind? {
            CompletionKind::Function | CompletionKind::Method => {
                let detail = completion.detail.as_deref().unwrap_or("");
                if !detail.is_empty() && detail.starts_with(label) {
                    let code = format!("function {}", detail);
                    let filter_len = label.len();
                    Some(CodeLabel {
                        code,
                        spans: vec![CodeLabelSpan::code_range(9..9 + detail.len())],
                        filter_range: (0..filter_len).into(),
                    })
                } else {
                    let code = format!("function {}()", label);
                    Some(CodeLabel {
                        code,
                        spans: vec![CodeLabelSpan::code_range(9..9 + label.len() + 2)],
                        filter_range: (0..label.len()).into(),
                    })
                }
            }
            CompletionKind::Constant => {
                if let Some(detail) = &completion.detail {
                    Some(CodeLabel {
                        code: format!("{} -- {}", label, detail),
                        spans: vec![
                            CodeLabelSpan::literal(label, Some("constant.builtin".to_string())),
                            CodeLabelSpan::literal(" ", None),
                            CodeLabelSpan::literal(detail, Some("comment".to_string())),
                        ],
                        filter_range: (0..label.len()).into(),
                    })
                } else {
                    Some(CodeLabel {
                        code: label.clone(),
                        spans: vec![CodeLabelSpan::literal(
                            label,
                            Some("constant.builtin".to_string()),
                        )],
                        filter_range: (0..label.len()).into(),
                    })
                }
            }
            CompletionKind::Variable | CompletionKind::Field => Some(CodeLabel {
                code: label.clone(),
                spans: vec![CodeLabelSpan::literal(label, Some("variable".to_string()))],
                filter_range: (0..label.len()).into(),
            }),
            _ => None,
        }
    }

    fn label_for_symbol(
        &self,
        _language_server_id: &LanguageServerId,
        symbol: Symbol,
    ) -> Option<CodeLabel> {
        let name = &symbol.name;
        match symbol.kind {
            SymbolKind::Function | SymbolKind::Method => {
                let code = format!("function {}()", name);
                Some(CodeLabel {
                    code,
                    spans: vec![CodeLabelSpan::code_range(0..9 + name.len() + 2)],
                    filter_range: (9..9 + name.len()).into(),
                })
            }
            _ => None,
        }
    }
}

zed::register_extension!(Pico8Extension);
