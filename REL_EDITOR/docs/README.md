# REL_EDITOR

REL_EDITOR is a local visual style editor for HTML/CSS/JS projects. It overlays style overrides at runtime, without modifying original source files while editing.

## Current milestone

Current implementation includes:
- Local Node.js + Express server
- Editor UI with 3 panels and iframe live preview
- Runtime overlay injection into served HTML
- Element selection + highlight + style control inputs
- ID/Class live editing (saved in patch metadata)
- Element delete support (button + keyboard with confirm)
- Link settings (href/target/rel/title) with runtime wrapping for non-`<a>` elements
- Image settings + local upload to `rel_editor/assets`
- ADD panel with draggable components and runtime node insertion
- Resizable left/right panels with saved layout (`localStorage`)
- Runtime CDN library manager (Bootstrap/Bulma/Pico/Tailwind + icon sets + Animate.css)
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

`rel.config.json` can define runtime default libraries under:
- `defaultsLibraries.designLibrary`
- `defaultsLibraries.iconSet`
- `defaultsLibraries.animateCss`
- `defaultsLibraries.bootstrapJs`

## Patch files location

When saving, files are created under the selected project root:
- `rel_editor/patch.json`
- `rel_editor/override.css`
- `rel_editor/assets/*` (uploaded images)

`patch.json` stores:
- `version` (current schema: `2`)
- `elementsMap` (`relId -> fallback selector`)
- `overridesMeta` (CSS overrides)
- `attributesMeta` (id/class/src/alt/etc)
- `linksMeta` (runtime link wrapping and link attributes)
- `addedNodes` (runtime-added components from ADD panel)
- `deletedNodes` (runtime deletions)
- `runtimeLibraries` (active CDN libraries for runtime)

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

## Manual test checklist

1. Start editor (`start_rel_editor.bat` or `start_rel_editor.sh`) and load `demo_project/index.html`.
2. Select an element and click **Delete Element**.
3. Select another element and press `Delete` key.
4. Press `Backspace` while not focused on editor inputs to delete selected element.
5. Refresh editor and verify deleted elements remain deleted.
6. Verify tree tab updates immediately after each delete.
7. Drag left/right panel resizers and verify widths update in real time.
8. Refresh page and verify panel widths were restored from `localStorage`.
9. Click **Reset Layout** and verify default layout returns.
10. Choose **Bootstrap 5** in Design Library, drag a Bootstrap block, and verify it has Bootstrap classes.
11. Switch Design Library to **None** and verify injected library links/scripts are removed from iframe `<head>`.
12. Save patch and verify `demo_project/rel_editor/patch.json` and `demo_project/rel_editor/override.css`.
13. Click **Export Safe** and verify `demo_project/REL_index.html` exists.

## Notes

- This is a local-only tool.
- Runtime `data-rel-id` values are assigned in the live DOM only.
- Source HTML/CSS are not modified during editing.
- In `Vite React (Style only)` mode, global background/color edits on `body` are applied to `html, body, #root, #root > *` to override Vite template defaults reliably.
