# REL_EDITOR

REL_EDITOR is a local visual style editor for HTML/CSS/JS projects. It overlays style overrides at runtime, without modifying original source files while editing.

## Current milestone

Current implementation includes:
- Local Node.js + Express server
- Editor UI with 3 panels and iframe live preview
- Runtime overlay injection into served HTML
- Element selection + highlight + style control inputs
- ID/Class live editing (saved in patch metadata)
- Link settings (href/target/rel/title) with runtime wrapping for non-`<a>` elements
- Image settings + local upload to `rel_editor/assets`
- ADD panel with draggable components and runtime node insertion
- Patch save/load (`rel_editor/patch.json`, `rel_editor/override.css`)
- Tree tab snapshot + search + element selection
- External CDN style/script injection from `rel.config.json`
- Export Safe endpoint that creates `REL_*.html` and `REL_*.css`

## Install

1. Ensure Node.js 18+ is installed.
2. From project root, run:
   - Windows: `start_rel_editor.bat`
   - macOS/Linux: `sh start_rel_editor.sh`
3. Open `http://localhost:4311`.

## Where to run

Run from repository root (`REL_Editor`). The scripts move into `REL_EDITOR/server` automatically.

## Choose a project

1. In the header, set **Project Root** (default: `./demo_project`).
2. Set **Index Path** (default: `index.html`).
3. Click **Load Project**.

The editor serves the project from `/project/*` on the same origin, then injects:
- `/runtime/overlay.css`
- `/runtime/overlay.js`
- `/project/rel_editor/override.css` (if exists)
- `externalStyles` and `externalScripts` from `rel.config.json` (if configured)

## Patch files location

When saving, files are created under the selected project root:
- `rel_editor/patch.json`
- `rel_editor/override.css`
- `rel_editor/assets/*` (uploaded images)

`patch.json` stores:
- `elements` (`relId -> fallback selector`)
- `overrides_meta` (CSS overrides)
- `attributes_meta` (id/class/src/alt/etc)
- `links_meta` (runtime link wrapping and link attributes)
- `added_nodes` (runtime-added components from ADD panel)

## Export behavior

### Export Safe
- Creates new files next to source index file:
  - `REL_<original>.html`
  - `REL_<original_name>.css`
- Original source files are untouched.

### Export Merge
- Current skeleton uses same generated artifacts as Safe mode, with merge-ready output naming.
- Source files are untouched.

## Demo project

`demo_project/` is included so you can validate flow quickly.

## Manual test steps

1. Start editor (`start_rel_editor.bat` or `start_rel_editor.sh`).
2. Keep defaults (`demo_project`, `index.html`) and click **Load Project**.
3. Click an element inside iframe and confirm orange outline + info panel update.
4. Edit `class` in the right panel and confirm live update.
5. Enable **Make this element a link**, set `href`, confirm runtime wrapping.
6. Switch to **add** tab, drag a component into iframe, confirm it is inserted.
7. Select an image and click **Upload Image**.
8. Click **Save Patch**.
9. Refresh page and confirm class/link/add/image changes are restored from patch.
10. Click **Export Safe** and verify `demo_project/REL_index.html` exists.

## Notes

- This is a local-only tool.
- Runtime `data-rel-id` values are assigned in the live DOM only.
- Source HTML/CSS are not modified during editing.
