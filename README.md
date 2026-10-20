# zed-pico8 (`PICO-8` Language Extension for Zed)

Complete **PICO-8** language support for the [Zed editor](https://zed.dev), supporting both full `.p8` cartridges and standalone `.p8.lua` scripts.

Includes a custom Tree-sitter grammar tailored to PICO-8's Lua dialect and an embedded, zero-config Language Server (`pico8-ls`) providing autocomplete, hover documentation, signature help, go-to-definition, symbol outline, and diagnostics across the entire PICO-8 API.

---

## Features

### 1. PICO-8 Lua Dialect & Cartridge Syntax Highlighting
Full Tree-sitter syntax highlighting, code folding, bracket matching, auto-indentation, and symbol outlines for `.p8` and `.p8.lua` files:
- **Cartridge sections**: `pico-8 cartridge` header, `version`, `__lua__`, `__gfx__`, `__gff__`, `__label__`, `__map__`, `__sfx__`, `__music__`, and `-->8` tab dividers.
- **Compound assignment operators**: `+=`, `-=`, `*=`, `/=`, `\=`, `%=`, `^=`, `..=`, `&=`, `|=`, `^^=`, `<<=`, `>>=`, `>>>=`, `<<>=`, `>><=`.
- **PICO-8 operators**:
  - `!=` (not equal, alongside standard `~=`)
  - `\` (integer division shorthand for `flr(a / b)`)
  - Bitwise operators: `&` (AND), `|` (OR), `^^` (XOR), `~` (NOT), `<<` (shift left), `>>` (arithmetic shift right), `>>>` (logical shift right), `<<>` (rotate left), `>><` (rotate right)
  - Unary memory peek operators: `@addr` (`peek`), `%addr` (`peek2`), `$addr` (`peek4`)
  - Print shorthand: `?` (e.g. `?"score: "..score, 4, 4, 7`)
- **Single-line shorthand statements**:
  - `if (cond) statement [else statement]`
  - `while (cond) statement`
- **Number literals**: Decimal, hexadecimal (`0x11.4000`), and binary (`0b1010.010`) fixed-point numbers.
- **Preprocessor & comments**: `#include <file>`, `--` line/block comments, and `//` C-style comments.
- **Built-in constants & P8SCII glyphs**: `_ENV`, `⬅️`, `➡️`, `⬆️`, `⬇️`, `🅾️`, `❎`, and all 26 `Shift+A..Z` glyph constants (`█`..`▥` = `0..25`).

### 2. Complete PICO-8 API Autocomplete & IntelliSense
Powered by an embedded build of `pico8-ls` (plus `snippets/pico-8.json`), providing:
- **Autocomplete (`textDocument/completion`)** with parameter signatures and detailed documentation for:
  - **Lifecycle Callbacks**: `_init()`, `_update()`, `_update60()`, `_draw()`
  - **Graphics & Draw State**: `cls`, `camera`, `circ`, `circfill`, `clip`, `color`, `cursor`, `fget`, `fillp`, `flip`, `fset`, `line`, `oval`, `ovalfill`, `pal`, `palt`, `pget`, `print`, `pset`, `rect`, `rectfill`, `rrect`, `rrectfill`, `sget`, `spr`, `sset`, `sspr`, `tline`
  - **Tables & Iteration**: `add`, `all`, `count`, `del`, `deli`, `foreach`, `ipairs`, `next`, `pack`, `pairs`, `select`, `unpack`
  - **Input**: `btn`, `btnp` (plus button constants `⬅️`, `➡️`, `⬆️`, `⬇️`, `🅾️`, `❎`)
  - **Audio**: `sfx`, `music`
  - **Map**: `map`, `mget`, `mset`, `mapdraw`
  - **Memory**: `cstore`, `memcpy`, `memset`, `peek`, `peek2`, `peek4`, `poke`, `poke2`, `poke4`, `reload`, `serial`
  - **Math & Bitwise**: `abs`, `atan2`, `band`, `bnot`, `bor`, `bxor`, `ceil`, `cos`, `flr`, `lshr`, `max`, `mid`, `min`, `rnd`, `rotl`, `rotr`, `sgn`, `shl`, `shr`, `sin`, `sqrt`, `srand`
  - **Cartridge Data**: `cartdata`, `dget`, `dset`
  - **Coroutines**: `cocreate`, `coresume`, `costatus`, `coyield`, `yield`
  - **Strings & Types**: `chr`, `ord`, `split`, `sub`, `tonum`, `tonumber`, `tostr`, `type`
  - **System / Menu / Metatables**: `assert`, `cmd`, `dir`, `error`, `extcmd`, `folder`, `getmetatable`, `holdframe`, `load`, `ls`, `menuitem`, `printh`, `rawequal`, `rawget`, `rawlen`, `rawset`, `reboot`, `reset`, `resume`, `run`, `save`, `setmetatable`, `stat`, `stop`, `time`, `t`, `trace`
- **Hover Documentation (`textDocument/hover`)**: Hover over any built-in PICO-8 function or glyph constant (`⬅️`, `➡️`, `⬆️`, `⬇️`, `🅾️`, `❎`, `_ENV`) to view its signature, parameters, and PICO-8 manual description.
- **Signature Help (`textDocument/signatureHelp`)**: Live parameter hints when typing function arguments `(`.
- **Go to Definition (`textDocument/definition`)**: Jump to function and variable definitions across the current cartridge and `#include`d files.
- **Diagnostics**: Real-time syntax error reporting, undefined variable warnings, and unused parameter hints.

---

## How to Install & Run Locally on Another Machine

You can install `zed-pico8` on any machine (macOS, Linux, or Windows) as a **Zed Dev Extension**.

### Prerequisites

1. **[Zed Editor](https://zed.dev)** installed.
2. **[Rust toolchain](https://rustup.rs/)** installed via `rustup` (Zed compiles Dev Extensions to WebAssembly on load).
   > **Important:** Make sure `rustup` is your active Rust toolchain manager (rather than Homebrew's standalone `rust` formula) so Zed can automatically use the `wasm32-wasip2` target:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-wasip2
   ```

*(No Node.js or `npm` installation is required—the `pico8-ls` language server is pre-bundled inside the extension and runs automatically using Zed's internal Node runtime!)*

### Installation Steps

1. **Clone this repository** to your machine:
   ```bash
   git clone https://github.com/ellismarkf/zed-pico8.git
   ```
2. **Open Zed** and open the Extensions view:
   - Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Linux/Windows), **or**
   - Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run **`zed: extensions`**.
3. Click the **`Install Dev Extension`** button in the top-right corner of the Extensions tab (or run **`zed: install dev extension`** from the Command Palette).
4. In the file dialog that opens, select the cloned **`zed-pico8`** folder.
5. Zed will compile the Rust extension and Tree-sitter grammar (takes ~10–20 seconds on first install). Once complete, **`PICO-8`** will appear in your installed extensions list.

### Trying It Out

Open the included [`examples/demo.p8`](examples/demo.p8) file in Zed:
```bash
zed zed-pico8/examples/demo.p8
```
- Notice syntax highlighting for `__lua__`, `#include`, `+=`, `\`, `!=`, `@`/`%`/`$` peek operators, `0b1010.010`, `0x11.4000`, `?` print statements, and `⬅️`/`➡️`/`⬆️`/`⬇️`/`🅾️`/`❎`.
- Hover over `music`, `pal`, `mget`, `fget`, `stat`, or `⬅️` to see PICO-8 documentation.
- Type `spr(` or `sfx(` to trigger signature help and autocomplete.
- Open the Outline Panel (`Cmd+Shift+O` / `Ctrl+Shift+O`) to jump between functions (`_init`, `_update60`, `_draw`).

---

## Optional Configuration

By default, `zed-pico8` works out of the box with zero configuration. You can customize file associations or language server settings in your Zed `settings.json` (`Cmd+,` / `Ctrl+,`):

```json
{
  "file_types": {
    "PICO-8": ["p8", "p8.lua"]
  },
  "languages": {
    "PICO-8": {
      "tab_size": 2,
      "hard_tabs": false
    }
  }
}
```

### Custom `pico8-ls` Binary (Optional)

The extension automatically extracts and runs its embedded `pico8-ls-server.js` bundle using Zed's Node runtime. If you have a custom `pico8-ls` binary on your `$PATH` or want to point to a specific executable, you can configure it in `settings.json`:

```json
{
  "lsp": {
    "pico8-ls": {
      "binary": {
        "path": "/path/to/custom/pico8-ls",
        "arguments": ["--stdio"]
      }
    }
  }
}
```

---

## Development & Building from Source

### Directory Structure

- [`extension.toml`](extension.toml) — Zed extension manifest declaring the `pico8` Tree-sitter grammar and `pico8-ls` language server.
- [`src/lib.rs`](src/lib.rs) — Rust WebAssembly extension entry point (`zed_extension_api`), managing `pico8-ls` lifecycle and completion/symbol code labels.
- [`languages/pico8/`](languages/pico8/) — Zed language configuration (`config.toml`) and Tree-sitter queries (`highlights.scm`, `brackets.scm`, `indents.scm`, `outline.scm`, `injections.scm`, `overrides.scm`, `textobjects.scm`).
- [`grammars/tree-sitter-pico8/`](grammars/tree-sitter-pico8/) — Tree-sitter grammar for `.p8` cartridges and `.p8.lua` files.
- [`server/`](server/) — TypeScript source and pre-bundled `pico8-ls-server.js` Language Server for PICO-8.
- [`snippets/pico-8.json`](snippets/pico-8.json) — Snippet definitions for PICO-8 API functions.

### Rebuilding the Language Server Bundle

If you modify the language server TypeScript source under [`server/src/`](server/src/):

```bash
cd server
npm install
npx esbuild src/server.ts --bundle --platform=node --target=node18 --outfile=pico8-ls-server.js
```

### Rebuilding the Tree-sitter Grammar

If you modify [`grammars/tree-sitter-pico8/grammar.js`](grammars/tree-sitter-pico8/grammar.js):

```bash
cd grammars/tree-sitter-pico8
tree-sitter generate
```

---

## Credits & License

- [MIT License](LICENSE)
- Tree-sitter grammar adapted and extended from [`tree-sitter-pico8`](https://github.com/parasyte/tree-sitter-pico8) by `@parasyte`.
- Language server adapted and extended from [`pico8-ls`](https://github.com/japhib/pico8-ls) by `@japhib`.
