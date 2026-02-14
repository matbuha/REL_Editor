(function () {
  const registry = {};

  function add(key, title, description, formats, examples, notes) {
    registry[key] = {
      title,
      description,
      formats: Array.isArray(formats) ? formats : [],
      examples: Array.isArray(examples) ? examples : [],
    };
    if (Array.isArray(notes) && notes.length) {
      registry[key].notes = notes;
    }
  }

  add(
    "top.projectRoot",
    "Project Root",
    "Sets the folder REL_EDITOR serves and where rel_editor artifacts are written.",
    ["Absolute or relative filesystem path"],
    ["C:/work/site", "../demo_project"]
  );
  add(
    "top.projectType",
    "Project Type",
    "Chooses static HTML mode or Vite React style-only mode.",
    ["static-html", "vite-react-style"],
    ["Static HTML", "Vite React (Style only)"]
  );
  add("top.indexPath", "Index Path", "Entry HTML file relative to Project Root (static mode).", ["Relative file path"], ["index.html"]);
  add("top.devUrl", "Dev URL", "Origin for the Vite dev server used by the preview proxy.", ["http://host:port"], ["http://localhost:5173"]);
  add("top.startDevServer", "Start Dev Server", "Starts Vite for the selected project and streams status updates.", ["Button action"], ["starting -> running"]);
  add("top.stopDevServer", "Stop Dev Server", "Stops the tracked Vite process and updates status to stopped.", ["Button action"], ["running -> stopped"]);
  add("top.loadProject", "Load Project", "Applies header settings and reloads preview context.", ["Button action"], ["Load after changing root"]);
  add("top.savePatch", "Save Patch", "Writes patch.json and override.css under rel_editor.", ["Button action"], ["rel_editor/patch.json"]);
  add("top.exportSafe", "Export Safe", "Exports REL_* files without touching source files.", ["Button action"], ["REL_index.html", "REL_index.css"]);
  add("top.resetLayout", "Reset Layout", "Resets panel widths to defaults.", ["Button action"], ["Reset left/right panel widths"]);
  add("top.designLibrary", "Design Library", "Injects runtime design library assets.", ["none, bootstrap, bulma, pico, tailwind"], ["Bootstrap 5"]);
  add("top.bootstrapJs", "Bootstrap JS bundle", "Enables Bootstrap JS runtime when Bootstrap is active.", ["Checkbox true/false"], ["Enable for collapse/modal"]);
  add("top.iconSet", "Icon Set", "Injects icon font assets in preview.", ["none, material-icons, font-awesome"], ["Material Icons"]);
  add("top.animateCss", "Animate.css", "Enables Animate.css classes in preview runtime.", ["Checkbox true/false"], ["animate__fadeIn"]);
  add(
    "top.fontLibrary",
    "Font Library",
    "Selects external font provider for runtime font loading.",
    ["none, google, bunny, adobe-edge"],
    ["Google Fonts", "Bunny Fonts"],
    ["Loaded families appear in font-family selectors."]
  );
  add("top.fontFamilyInput", "Font Family", "Adds a family name to the active font provider.", ["Font family name"], ["Poppins", "Source Sans Pro"]);
  add("top.addFont", "Add Font", "Loads typed family into runtime font list.", ["Button action"], ["Type Poppins then add"]);

  add("tab.information", "Information Tab", "Shows selected element metadata and overrides.", ["Tab button"], ["relId, selector, rect"]);
  add("tab.tree", "Tree Tab", "Shows DOM tree snapshot and selection controls.", ["Tab button"], ["search and click nodes"]);
  add("tab.add", "Add Tab", "Contains draggable components.", ["Tab button"], ["drag Section, Card"]);
  add("tab.theme", "Theme Tab", "Manages palettes and font presets.", ["Tab button"], ["apply theme tokens"]);

  add("tree.search", "Tree Search", "Filters tree nodes by tag, id, and class.", ["Free text"], ["header", "#hero", ".card"]);
  add("tree.refresh", "Refresh Tree", "Requests a fresh tree snapshot from overlay.", ["Button action"], ["refresh after DOM updates"]);
  add("tree.node", "Tree Node", "Selects this element in preview and inspector.", ["Button action"], ["click node to select relId"]);
  add(
    "tree.expandToggle",
    "Expand / Collapse",
    "Toggles visibility of child nodes in this branch.",
    ["Click toggle"],
    ["Collapsed -> hidden children", "Expanded -> visible children"],
    ["During drag, holding over a collapsed branch for ~750ms auto-expands it."]
  );
  add(
    "tree.context.duplicate",
    "Duplicate (Context Menu)",
    "Duplicates the clicked tree node and inserts a copy after it in the same parent.",
    ["Right-click action"],
    ["Duplicate section", "Duplicate card block"]
  );
  add(
    "tree.context.delete",
    "Delete (Context Menu)",
    "Deletes the clicked tree node. Protected nodes cannot be deleted.",
    ["Right-click action"],
    ["Delete empty container"]
  );
  add(
    "tree.context.moveBefore",
    "Move before",
    "Moves the clicked node one position up in the same parent (toward previous sibling).",
    ["Right-click action"],
    ["Move before previous section"],
    ["Disabled when the node is already first."]
  );
  add(
    "tree.context.moveAfter",
    "Move after",
    "Moves the clicked node one position down in the same parent (toward next sibling).",
    ["Right-click action"],
    ["Move after next section"],
    ["Disabled when the node is already last."]
  );
  add(
    "tree.context.insertContainerAbove",
    "Insert container above",
    "Inserts a new container directly before the clicked node in the same parent.",
    ["Right-click action"],
    ["Insert container above paragraph"]
  );
  add(
    "tree.context.insertSectionBelow",
    "Insert section below",
    "Inserts a new section directly after the clicked node in the same parent.",
    ["Right-click action"],
    ["Insert section below hero block"]
  );

  add("add.external", "Library Block", "Draggable block from active design library.", ["Drag and drop"], ["Bootstrap Card"]);
  [
    ["section", "Section"],
    ["container", "Container"],
    ["heading-h1", "Heading H1"],
    ["heading-h2", "Heading H2"],
    ["heading-h3", "Heading H3"],
    ["paragraph", "Paragraph"],
    ["button", "Button"],
    ["image", "Image"],
    ["link", "Link"],
    ["card", "Card"],
    ["spacer", "Spacer"],
    ["divider", "Divider"],
  ].forEach(([type, label]) => {
    add(`add.${type}`, `Add ${label}`, `Draggable ${label.toLowerCase()} component.`, ["Drag and drop"], [`Drop ${label} into container`]);
  });

  add("inspector.attr.id", "ID", "Sets element id attribute.", ["HTML id token"], ["main-title"]);
  add("inspector.attr.class", "Class", "Sets class attribute; separate multiple classes by spaces.", ["Class tokens"], ["card highlighted"]);
  add("inspector.delete", "Delete Element", "Deletes selected element from runtime patch.", ["Button action"], ["Delete selected node"]);

  add("link.toggle", "Make this element a link", "Wraps non-anchor elements with link settings.", ["Checkbox true/false"], ["Enable and set href"]);
  add("link.href", "href", "Destination URL/path for the link.", ["https://..., /path, ./path, #anchor, mailto:, tel:"], ["https://example.com", "#features"]);
  add("link.target", "target", "Controls where link opens.", ["_self, _blank, (empty)"], ["_self", "_blank"]);
  add("link.rel", "rel", "Relationship/security tokens for links.", ["Space-separated rel values"], ["noopener noreferrer"], ["Use noopener noreferrer with target=_blank."]);
  add("link.title", "title", "Optional advisory text for the link.", ["Plain text"], ["Open docs"]);

  add("text.content", "Text Content", "Edits text for supported text-like elements.", ["Plain text"], ["Welcome to REL Editor"]);
  add("text.apply", "Apply Text", "Commits text change to selected element.", ["Button action"], ["Apply after editing"]);

  add("image.src", "Image src", "Sets image source path or URL.", ["Relative path or URL"], ["rel_editor/assets/photo.png"]);
  add("image.alt", "Image alt", "Alternative text for accessibility.", ["Short descriptive text"], ["Team photo"]);
  add("image.width", "Image width", "HTML width attribute for img element.", ["Number (pixels)"], ["320"]);
  add("image.height", "Image height", "HTML height attribute for img element.", ["Number (pixels)"], ["180"]);
  add("image.objectFit", "object-fit", "How image content scales in its box.", ["fill, contain, cover, none, scale-down"], ["cover"]);
  add("image.borderRadius", "border-radius", "Rounds image corners.", ["px, %, rem"], ["8px", "50%"]);
  add("image.display", "display", "Image display mode.", ["block, inline-block, inline, none"], ["block"]);
  add("image.upload", "Upload Image", "Uploads local image to project assets and applies src.", ["Local file picker"], ["PNG, JPG, SVG"]);

  add(
    "style.width",
    "width",
    "Controls element width.",
    ["px, %, vw, vh, em, rem, auto"],
    ["100%", "100vw", "100vh", "320px", "auto"],
    ["Full screen width = 100vw.", "Inside containers prefer 100% over 100vw to avoid horizontal scrollbar overflow."]
  );
  add(
    "style.height",
    "height",
    "Controls element height.",
    ["px, %, vw, vh, em, rem, auto"],
    ["100%", "100vh", "320px", "auto"],
    ["Full screen height = 100vh."]
  );
  add("style.padding", "padding", "Inner spacing between content and border.", ["px, rem, em"], ["16px", "1rem"], ["Padding changes inner spacing, not element position."]);
  add("style.margin", "margin", "Outer spacing around element.", ["px, rem, em"], ["24px", "1.5rem"], ["Margin controls spacing outside element bounds."]);
  add("style.backgroundSolid", "Solid Color", "Sets solid background color.", ["hex, rgb/rgba, hsl/hsla"], ["#ffcc00", "rgba(0,0,0,0.35)", "hsl(210 30% 20%)"]);
  add("style.backgroundGradient", "Gradient CSS", "Sets CSS gradient expression for background.", ["linear-gradient(...), radial-gradient(...)"], ["linear-gradient(90deg, #0ea5e9, #0369a1)"]);
  add("style.backgroundImageToggle", "Use background image", "Enables/disables background-image rendering.", ["Checkbox true/false"], ["Enable and provide URL"]);
  add("style.backgroundImageUpload", "Choose Image", "Uploads local image and fills CSS-safe URL.", ["Local file picker"], ["REL_assets/background.png", "/rel_assets/hero.png"]);
  add("style.backgroundImageUrl", "Image URL", "Source used for background-image.", ["Relative path or URL"], ["REL_assets/background.png", "https://images.example.com/bg.jpg"], ["Editor outputs background-image: url(...)."]);
  add("style.backgroundSize", "background-size", "Background image scaling behavior.", ["auto, contain, cover"], ["cover", "contain"]);
  add("style.backgroundPosition", "background-position", "Background image anchor position.", ["center, top, bottom, left, right"], ["center", "top"]);
  add("style.backgroundRepeat", "background-repeat", "Background image tiling behavior.", ["no-repeat, repeat"], ["no-repeat"]);
  add("style.backgroundClearImage", "Clear image", "Removes background image URL and related properties.", ["Button action"], ["Clear background-image settings"]);
  add(
    "style.order",
    "order (Layer Dominance)",
    "Maps to z-index. Higher value renders above lower values.",
    ["Integer 0..1000"],
    ["0", "10", "500", "1000"],
    ["z-index works on positioned elements.", "When order > 0 and position is static, editor auto-sets position: relative for stacking.", "When order returns to 0, only auto-added position override is removed."]
  );
  add("style.orderReset", "Reset order", "Resets layer dominance back to 0.", ["Button action"], ["Set order to 0"]);
  add("style.verticalAlignContent", "vertical-align-content", "Maps top/center/bottom to align-items in flex/grid contexts.", ["top, center, bottom"], ["center"]);
  add("style.shadow.enable", "Enable shadow", "Turns shadow override on/off.", ["Checkbox true/false"], ["Enable shadow"]);
  add("style.shadow.target", "Shadow target", "Choose box-shadow or text-shadow target.", ["box, text"], ["box"]);
  add("style.shadow.preset", "Shadow preset", "Applies predefined or custom shadow.", ["none, soft, medium, strong, inner, custom"], ["soft"]);
  add("style.shadow.raw", "Shadow string", "Direct CSS shadow value.", ["CSS shadow value"], ["0px 6px 18px 0px rgba(0,0,0,0.2)"]);

  add("style.backgroundModeSolid", "Background Mode: Solid", "Switches active background mode to solid.", ["Mode switch"], ["Solid"]);
  add("style.backgroundModeGradient", "Background Mode: Gradient", "Switches active background mode to gradient.", ["Mode switch"], ["Gradient"]);
  add("style.backgroundModeImage", "Background Mode: Image", "Switches active background mode to image.", ["Mode switch"], ["Image"]);

  add("theme.preset", "Theme Preset", "Switches active theme preset.", ["Preset selection"], ["Default"]);
  add("theme.name", "Theme Name", "Name used for create/save preset operations.", ["Plain text"], ["Marketing Light"]);
  add("theme.new", "New Theme", "Creates a new preset from current values.", ["Button action"], ["Clone active preset"]);
  add("theme.save", "Save Theme", "Saves current values into active preset.", ["Button action"], ["Persist edits"]);
  add("theme.delete", "Delete Theme", "Deletes active preset (at least one remains).", ["Button action"], ["Remove temporary preset"]);
  add("theme.addCustomColor", "Add custom color", "Adds named custom palette token.", ["Prompted key"], ["brand-alt"]);
  add("theme.palette.color", "Palette color", "Maps selected element color to theme token.", ["Theme variable key"], ["text", "primary"]);
  add("theme.palette.background", "Palette background-color", "Maps selected element background-color to theme token.", ["Theme variable key"], ["surface", "background"]);
  add("theme.palette.border", "Palette border-color", "Maps selected element border-color to theme token.", ["Theme variable key"], ["border"]);
  add("theme.applyPaletteSelected", "Apply Palette to Selected Element", "Applies selected palette mappings to current element.", ["Button action"], ["Set color/background/border"]);
  add("theme.bodyFont", "Body Font", "Theme font-family for body text.", ["System or loaded external family"], ["\"Segoe UI\", system-ui, sans-serif"]);
  add("theme.headingFont", "Heading Font", "Theme font-family for headings.", ["System or loaded external family"], ["\"Georgia\", serif"]);
  add("theme.bodySize", "Body Size", "Theme body font size token.", ["px, rem"], ["16px"]);
  add("theme.h1Size", "H1 Size", "Theme H1 font size token.", ["px, rem"], ["2.5rem"]);
  add("theme.h2Size", "H2 Size", "Theme H2 font size token.", ["px, rem"], ["2rem"]);
  add("theme.h3Size", "H3 Size", "Theme H3 font size token.", ["px, rem"], ["1.5rem"]);
  add("theme.smallSize", "Small Size", "Theme small text size token.", ["px, rem"], ["0.875rem"]);
  add("theme.lineHeight", "Line Height", "Theme line-height token.", ["Unitless or length"], ["1.5"]);
  add("theme.loadFonts", "Load fonts", "Loads theme font families into runtime provider.", ["Button action"], ["Load body + heading fonts"]);
  add("theme.applyFontsGlobally", "Apply fonts globally", "Loads theme fonts and applies theme globally.", ["Button action"], ["One-click typography apply"]);
  add("theme.applyThemeToPage", "Apply Theme to Page", "Applies theme variables and typography globally.", ["Button action"], ["Inject :root theme css"]);
  add("theme.color.value", "Theme color value", "Sets color value for this palette token.", ["Hex color"], ["#2b6df8"]);
  add("theme.color.copy", "Copy color", "Copies color value to clipboard.", ["Button action"], ["Copy #2b6df8"]);
  add("theme.color.remove", "Remove custom color", "Deletes this custom palette token.", ["Button action"], ["Remove brand-alt"]);

  add("layout.leftResizer", "Left Panel Resizer", "Drag horizontally to resize left panel width.", ["Drag interaction"], ["Drag right to widen left panel"]);
  add("layout.rightResizer", "Right Panel Resizer", "Drag horizontally to resize right panel width.", ["Drag interaction"], ["Drag left to widen right panel"]);

  add("generic.button", "Action control", "Triggers an editor action.", ["Button action"], ["Click to run command"]);
  add("generic.input", "Input control", "Edits field value.", ["Text or numeric input"], ["Type value"]);
  add("generic.select", "Select control", "Choose one option from allowed values.", ["Dropdown"], ["Pick an option"]);
  add("generic.toggle", "Toggle control", "Enables or disables a feature.", ["Checkbox true/false"], ["Checked = enabled"]);

  window.REL_TOOLTIPS_REGISTRY = Object.freeze(registry);
})();
