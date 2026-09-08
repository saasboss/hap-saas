from pathlib import Path

changed = []


def replace(path, old, new, all_matches=False):
    p = Path(path)
    text = p.read_text()
    if old in text:
        text = text.replace(old, new) if all_matches else text.replace(old, new, 1)
        p.write_text(text)
        if str(p) not in changed:
            changed.append(str(p))
        return
    if new not in text:
        raise SystemExit(f"Expected snippet not found in {path}: {old[:120]}")


replace(
    "public/hap/app.js",
    """ const body = tab==='design' ? (canAccess('design')?appearancePage():noPermissionPage('design'))
  : tab==='promotions' ? adminPromote()
  : adminMenuItems();""",
    """ const body = tab==='design' ? (canAccess('design')?appearancePage():noPermissionPage('design'))
  : tab==='promotions' ? (canAccess('promotions')?adminPromote():noPermissionPage('promotions'))
  : adminMenuItems();""",
)

replace(
    "scripts/verify-menu-dod-final.mjs",
    """  await page.goto(`${baseUrl}${path}`,{waitUntil:'networkidle'});
}""",
    """  await page.goto(`${baseUrl}${path}`,{waitUntil:'networkidle'});
  if(path.startsWith('/menu/')) {
    const language=guest?.language||'English';
    const gate=page.locator(`[data-action=\"select-language\"][data-lang=\"${language}\"]`);
    if(await gate.count()) { try { await gate.click({timeout:1500}); } catch {} }
  }
}""",
)
replace(
    "scripts/verify-menu-dod-final.mjs",
    "assert(m.presentImg&&m.imgLoaded,'Neighbouring valid photo did not render');",
    "assert(m.presentImg===(layout!=='editorial'),`Valid-photo rendering mismatch in ${layout}`);",
)
replace(
    "scripts/verify-menu-dod-final.mjs",
    "assert(m.secondImg&&m.imgLoaded,'Valid mixed photo did not load');",
    "assert(m.secondImg===(layout!=='editorial'),`Mixed-photo rendering mismatch in ${layout}`);",
)
replace(
    "scripts/verify-menu-dod-final.mjs",
    "await seed(s,'/menu/sofra',{language:'English',displayCurrency:display}); await page.locator('.public-root').waitFor();",
    """await seed(s,'/menu/sofra',{language:'English',displayCurrency:display}); await page.locator('.public-root').waitFor();
      if(display==='EUR'){ await page.locator('[data-action=\"display-currency\"]').click(); await page.locator('[data-action=\"set-display-currency\"][data-code=\"EUR\"]').click(); await page.locator('.public-root').waitFor(); }""",
)
replace(
    "scripts/verify-menu-dod-final.mjs",
    """await seed(s,'/r/sofra/admin/menu/promotions/new'); await page.locator('[data-action=\"promotion-target\"][data-id=\"truffle-burger\"]').click();""",
    """await seed(s,'/r/sofra/admin/menu/promotions'); await page.locator('[data-action=\"promo-chooser\"]').click(); await page.locator('[data-action=\"promotion-target\"][data-id=\"truffle-burger\"]').click();""",
    all_matches=True,
)
replace(
    "scripts/verify-menu-dod-final.mjs",
    """const s=clone(baseState); await seed(s,'/r/sofra/admin/menu'); const row=page.locator('[data-action=\"expand-item\"][data-id=\"octopus\"]');""",
    """const s=clone(baseState); await seed(s,'/r/sofra/admin/menu'); await page.locator('[data-action=\"jump-category\"][data-id=\"mains\"]').click(); const row=page.locator('[data-action=\"expand-item\"][data-id=\"octopus\"]');""",
)

agents = Path("AGENTS.md")
agent_text = agents.read_text()
header = "## GitHub execution discipline — learn from failures"
if header not in agent_text:
    discipline = """## GitHub execution discipline — learn from failures

Every failed test, workflow, patch, or verification attempt must improve the next attempt. Do not blindly retry the same approach.

1. **Classify first.** Determine whether the failure is product code, test fixture, tooling/workflow, stale assumption, or environment. Never change product code until a product defect is proven.
2. **Read repository reality.** Verify actual routes, state, persistence keys, component behavior, and existing interaction paths before writing tests or patches. Never invent convenience routes or state contracts from memory.
3. **Use real user paths.** Test the actual button/sheet/action flow unless a canonical deep link is present in the route map.
4. **Respect intentional behavior.** Do not call deliberate behavior a bug: layouts may intentionally hide photos, images may lazy-load, categories may be collapsed, and controls may appear only in specific states.
5. **Prefer stable assertions.** Verify user-visible behavior, semantics, geometry, persisted data, and canonical routes. Avoid fragile timing/image-decode/incidental-DOM assertions unless those are the requirement.
6. **Patch narrowly.** Inspect the exact target snippet first. No broad replacements, giant blind file rewrites, or loosening a failed matcher until it could hit unrelated code.
7. **Keep CI simple.** Put nontrivial patch/test logic in a temporary script file rather than complex multiline code embedded in workflow YAML.
8. **Checks before commit.** Syntax/build/relevant tests must pass before a code-changing automation commits. Failed checks leave product code uncommitted.
9. **Read logs before retrying.** Inspect the exact failing step and artifacts; correct the proven assumption rather than making cosmetic retries.
10. **Sequential writes only.** Use current blob SHAs and one write path at a time for a file/ref.
11. **Temporary tooling stays temporary.** Remove debug workflows, patch scripts, Playwright harnesses, and artifacts before the final PR unless deliberately adopting them as maintained tests.
12. **Final diff is the gate.** Compare the branch to `main` before PR/merge and confirm only intended product/docs changes remain.

Project-specific lessons already learned: `/r/:slug/admin/menu/promotions` is canonical; do not invent `/menu/promotions/new`. Essential may intentionally suppress photos. Do not require immediate `naturalWidth` for lazy images. Do not guess guest language/currency state instead of using the product's real interaction/storage contract. Do not embed complicated Python patching inside GitHub Actions YAML.

"""
    marker = "## High-risk gate\n"
    if marker not in agent_text:
        raise SystemExit("AGENTS.md high-risk marker not found")
    agents.write_text(agent_text.replace(marker, discipline + marker, 1))
    changed.append(str(agents))

print("Changed:", ", ".join(changed) if changed else "none")
