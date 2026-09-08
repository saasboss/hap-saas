from pathlib import Path

CSS_MARKER = "/* --- Scoped category header controls: compact chrome, full tap targets --- */"

css_path = Path("public/hap/styles.css")
css = css_path.read_text()
css_block = r'''

/* --- Scoped category header controls: compact chrome, full tap targets --- */
.category-admin .category-head-row{
  min-height:60px;
  padding:8px 8px 8px 12px;
  gap:4px;
}
.category-admin .category-head-row .category-copy{
  flex:1;
  min-width:0;
  display:flex;
  align-items:center;
  gap:8px;
}
.category-admin .category-name{
  flex:1;
  min-width:0;
  min-height:44px;
  flex-wrap:nowrap;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.category-admin .category-count{
  flex:none;
  min-height:44px;
  padding:0 2px;
  white-space:nowrap;
}
.category-admin .category-actions{
  flex:none;
  gap:0;
}
.category-admin .cat-star,
.category-admin .category-more{
  width:44px;
  min-width:44px;
  height:44px;
  min-height:44px;
  padding:0;
  gap:0;
  border:0;
  border-radius:12px;
  background:transparent;
  box-shadow:none;
  color:var(--muted);
}
.category-admin .category-more svg{
  width:18px;
  height:18px;
}
.category-admin .category-more span{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0 0 0 0);
  white-space:nowrap;
  border:0;
}
.category-admin .cat-star:hover,
.category-admin .category-more:hover{
  background:var(--surface-2);
  color:var(--text);
}
.category-admin .cat-star.on{
  color:var(--brand);
  background:color-mix(in srgb,var(--brand) 10%,transparent);
}
.category-admin .cat-star:focus-visible,
.category-admin .category-more:focus-visible{
  outline:2px solid var(--brand);
  outline-offset:1px;
  background:var(--surface-2);
}
@media(max-width:340px){
  .category-admin .category-head-row{padding-left:10px;padding-right:6px}
  .category-admin .category-head-row .category-copy{gap:5px}
  .category-admin .category-count{font-size:10.5px}
}
'''
if CSS_MARKER not in css:
    css_path.write_text(css.rstrip() + css_block.rstrip() + "\n")

agents_path = Path("AGENTS.md")
agents = agents_path.read_text()
old_start = "## Mandatory design preflight for UI/UX"
new_start = "## Repo-grounded design preflight for UI/UX"
next_heading = "## UI/UX implementation quality gate"
new_section = '''## Repo-grounded design preflight for UI/UX

Every task that materially changes what a user sees or how they interact must complete a design preflight **before implementation begins**. This includes redesigns, layouts, navigation, interaction patterns, component styling, visual hierarchy, responsive fixes, menu presentation, promotions presentation, admin flows, onboarding, forms, sheets, and visual states.

Required order:

1. Inspect the current GitHub/Lovable-synced implementation: route, markup/components, CSS/tokens, state, and existing behavior.
2. Use the user's screenshot or described problem as evidence when supplied.
3. Critique the current UI directly: hierarchy, density, friction, responsiveness, accessibility, and whether each control is primary, secondary, or destructive.
4. Reuse HAP's existing Lovable-built spacing, radii, typography, colors, icons, cards, sheets, buttons, and interaction patterns wherever they fit.
5. Product Design, UX Pilot, and other external UI generators are **not** required and must not introduce a second visual language into HAP.
6. Fix the underlying shared cause when safe rather than adding screenshot-specific hacks or globally changing a primitive that is correct elsewhere.
7. Lock the smallest coherent scope and acceptance criteria.
8. Only then write or modify implementation code.
9. Run the full UI/UX implementation quality gate below before push or merge.

Lovable Agent/Visual Edits are optional implementation tools, not a design authority. Prefer GitHub implementation when it avoids Lovable credit usage. Do not invoke Lovable AI merely to satisfy a process step.

Purely non-visual work — documentation-only changes, backend-only work, CI/configuration, security-only fixes, or data migrations — does not require this preflight unless it also materially changes UI/UX.

'''
if old_start in agents:
    start = agents.index(old_start)
    end = agents.index(next_heading, start)
    agents = agents[:start] + new_section + agents[end:]
elif new_start not in agents:
    raise SystemExit("Design preflight heading not found")

agents = agents.replace(
    "Product Design, UX Pilot, screenshots, Lovable output, generated prototypes, and AI suggestions are design input only. They do not lower the engineering standard required for code entering this repository.",
    "Screenshots, Lovable output, generated prototypes, and AI suggestions are evidence/design input only. They do not lower the engineering standard required for code entering this repository. HAP's existing Lovable-synced UI is the visual reference unless the user explicitly changes direction."
)
agents_path.write_text(agents)

print("category controls patch prepared")
