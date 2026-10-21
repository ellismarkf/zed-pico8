# Publishing `zed-pico8` to the Official Zed Extension Registry

This guide walks through publishing **`zed-pico8`** (<https://github.com/ellismarkf/zed-pico8>) to Zed's central extension registry ([`zed-industries/extensions`](https://github.com/zed-industries/extensions)) so that anyone can search for **"PICO-8"** and install it directly inside the Zed editor.

---

## 1. Prerequisites & Local Verification

Before submitting a Pull Request to `zed-industries/extensions`, Zed maintainers require that you test the extension locally as a Dev Extension.

### A. Install Rust via `rustup` (on the machine running Zed)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup update stable
rustup default stable
rustup target add wasm32-wasip2
```
*(If on macOS and Homebrew's standalone `rust` formula is installed, run `brew uninstall rust` so `rustup` is used.)*

### B. Clone & Test as a Dev Extension in Zed
1. Clone or pull the latest repo:
   ```bash
   git clone https://github.com/ellismarkf/zed-pico8.git
   ```
2. **Fully quit and reopen Zed** (`Cmd+Q` / `Ctrl+Q`) so Zed picks up `~/.cargo/bin` in its `PATH`.
3. Open Zed's Extensions panel (`Cmd+Shift+X` on macOS or `Ctrl+Shift+X` on Linux/Windows).
4. Click **`Install Dev Extension`** in the top-right corner and select your `zed-pico8` directory.
5. Open `zed-pico8/examples/demo.p8` in Zed and verify:
   - Syntax highlighting works for `.p8` sections (`__lua__`, `__gfx__`, etc.) and PICO-8 syntax (`+=`, `\`, `!=`, `@`/`%`/`$`, `?`, `⬅️`/`➡️`/`⬆️`/`⬇️`/`🅾️`/`❎`).
   - Hovering over built-in functions (`spr`, `sfx`, `music`, `mget`, `stat`) shows PICO-8 documentation.
   - Typing `spr(` or `cls(` triggers autocomplete and signature help.

---

## 2. Pre-flight Checks Already Verified on `ellismarkf/zed-pico8`

- **Extension ID (`pico8`)**: Available in `zed-industries/extensions` and conforms to Zed's naming rules (lowercase alphanumeric, does not start/end with `zed` or include `extension`).
- **Extension Name (`PICO-8`)**: Conforms to Zed's manifest rules (`schema_version = 1`, `version = "0.1.0"`).
- **License (`LICENSE`)**: Valid MIT license at the repository root, required by Zed's automated license check.
- **Official `zed-extension` CI Packager**: Verified that `zed-extension` compiles the Rust WASM extension, fetches and compiles the `tree-sitter-pico8` grammar from GitHub (`rev = "622cc2b6db0e9af6e45c5751c1be00ba9c1b2598"`), validates all `.scm` query files in `languages/pico8/`, and generates `archive.tar.gz` and `manifest.json` with zero errors.

---

## 3. Step-by-Step Submission to `zed-industries/extensions`

### Step 1: Fork `zed-industries/extensions`
1. Open **<https://github.com/zed-industries/extensions>** in your browser.
2. Click **Fork** in the top-right corner to create `https://github.com/ellismarkf/extensions`.

### Step 2: Clone Your Fork (Without Recursive Submodules)
Do **not** pass `--recurse-submodules` when cloning (the registry has thousands of submodules):
```bash
git clone https://github.com/ellismarkf/extensions.git
cd extensions
git checkout -b add-pico8
```

### Step 3: Add `ellismarkf/zed-pico8` as a Submodule at `extensions/pico8`
Zed's CI requires that the submodule path matches `extensions/<extension-id>` (`extensions/pico8`) and uses an `https://` URL:
```bash
git submodule add https://github.com/ellismarkf/zed-pico8.git extensions/pico8
```

### Step 4: Add `pico8` to `extensions.toml`
Open `extensions.toml` in the root of `extensions` and add:
```toml
[pico8]
submodule = "extensions/pico8"
version = "0.1.0"
```

### Step 5: Sort `extensions.toml` and `.gitmodules`
Zed's CI enforces strict alphabetical ordering of `extensions.toml` and `.gitmodules`. Run their sorting script using `pnpm`:
```bash
pnpm install
pnpm sort-extensions
```

### Step 6: Commit, Push, and Open a Pull Request
```bash
git add .gitmodules extensions.toml extensions/pico8
git commit -m "Add pico8 extension"
git push -u origin add-pico8
```
Then visit **<https://github.com/zed-industries/extensions/pulls>** and open a Pull Request from `ellismarkf:add-pico8` into `zed-industries:main`.

### Important Notes for the Pull Request Description
- **Write the PR description and any maintainer replies in your own words.** Per [`zed-industries/extensions/AI_POLICY.md`](https://github.com/zed-industries/extensions/blob/main/AI_POLICY.md), AI-assisted code is welcome, but PR descriptions and comments must be written by a human in your own voice.
- Briefly describe what the extension provides (Tree-sitter grammar for `.p8` cartridges and `.p8.lua` files covering PICO-8's Lua dialect + bundled `pico8-ls` language server for PICO-8 API autocomplete, hover docs, signature help, and diagnostics) and mention that you tested it locally as a Dev Extension in Zed.

---

## 4. Publishing Future Updates (`v0.1.1`, `v0.2.0`, etc.)

Whenever you want to release a new version of `zed-pico8` in the future:

1. Bump `version` in both `extension.toml` and `Cargo.toml` in `ellismarkf/zed-pico8`, and push to `main`.
2. In your `ellismarkf/extensions` fork:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b update-pico8-0.1.1

   git submodule update --init extensions/pico8
   git -C extensions/pico8 checkout main
   git -C extensions/pico8 pull origin main
   ```
3. Update `version = "0.1.1"` under `[pico8]` in `extensions.toml`, run `pnpm sort-extensions`, commit, push, and open a PR.
