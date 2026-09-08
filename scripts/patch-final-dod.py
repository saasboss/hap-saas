from pathlib import Path

changed = []


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Expected snippet not found in {path}: {old[:140]}")
    p.write_text(text.replace(old, new, 1))
    if str(p) not in changed:
        changed.append(str(p))


def replace_all_exact(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        return
    p.write_text(text.replace(old, new))
    if str(p) not in changed:
        changed.append(str(p))


# Real product defect proven by 11.10: Menu > Promotions did not apply the
# existing promotions permission fallback that Menu > Design already used.
replace_once(
    "public/hap/app.js",
    """ const body = tab==='design' ? (canAccess('design')?appearancePage():noPermissionPage('design'))
  : tab==='promotions' ? adminPromote()
  : adminMenuItems();""",
    """ const body = tab==='design' ? (canAccess('design')?appearancePage():noPermissionPage('design'))
  : tab==='promotions' ? (canAccess('promotions')?adminPromote():noPermissionPage('promotions'))
  : adminMenuItems();""",
)

# Public render listeners are attached in requestAnimationFrame after render.
# Wait for two frames after any language-gate interaction instead of relying on
# a fixed sleep or firing an input event before the real listener exists.
replace_once(
    "scripts/verify-menu-dod-final.mjs",
    """  if(path.startsWith('/menu/')) {
    const language=guest?.language||'English';
    const gate=page.locator(`[data-action=\"select-language\"][data-lang=\"${language}\"]`);
    if(await gate.count()) { try { await gate.click({timeout:1500}); } catch {} }
  }
}""",
    """  if(path.startsWith('/menu/')) {
    const language=guest?.language||'English';
    const gate=page.locator(`[data-action=\"select-language\"][data-lang=\"${language}\"]`);
    if(await gate.count()) { try { await gate.click({timeout:1500}); } catch {} }
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
}""",
)

# The previous temporary patch was not idempotent because the old currency line
# remained as a prefix of the replacement. Collapse any duplicate it created.
euro_line = "      if(display==='EUR'){ await page.locator('[data-action=\"display-currency\"]').click(); await page.locator('[data-action=\"set-display-currency\"][data-code=\"EUR\"]').click(); await page.locator('.public-root').waitFor(); }"
replace_all_exact(
    "scripts/verify-menu-dod-final.mjs",
    euro_line + "\n" + euro_line,
    euro_line,
)

# Use the actual visible wizard controls rather than ambiguous data-action
# selectors that match both the step navigation and Continue/Back buttons.
replace_once(
    "scripts/verify-menu-dod-final.mjs",
    """    await page.locator('[data-action=\"promotion-step\"][data-step=\"1\"]').click();
    await page.locator('[data-action=\"promo-temp\"][data-key=\"style\"][data-value=\"ribbon\"]').click();
    const input=page.locator('[data-action=\"promo-temp-input\"][data-key=\"label\"]'); await input.fill('Draft survives Back');
    await page.locator('[data-action=\"promotion-step\"][data-step=\"2\"]').click(); await page.locator('[data-action=\"promotion-step\"][data-step=\"1\"]').click();""",
    """    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.locator('[data-action=\"promo-temp\"][data-key=\"style\"][data-value=\"ribbon\"]').click();
    const input=page.locator('[data-action=\"promo-temp-input\"][data-key=\"label\"]'); await input.fill('Draft survives Back');
    await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.getByRole('button',{name:'Back',exact:true}).click();""",
)

replace_once(
    "scripts/verify-menu-dod-final.mjs",
    """    await page.locator('[data-action=\"promotion-step\"][data-step=\"1\"]').click(); await page.locator('[data-action=\"promo-temp\"][data-key=\"style\"][data-value=\"ribbon\"]').click();
    await page.locator('[data-action=\"promo-temp-input\"][data-key=\"label\"]').fill('Failure draft label'); await page.locator('[data-action=\"promotion-step\"][data-step=\"3\"]').click();""",
    """    await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.locator('[data-action=\"promo-temp\"][data-key=\"style\"][data-value=\"ribbon\"]').click();
    await page.locator('[data-action=\"promo-temp-input\"][data-key=\"label\"]').fill('Failure draft label'); await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.getByRole('button',{name:'Continue',exact:true}).click();""",
)

# Search verification waits for the actual visibility change rather than an
# arbitrary 80 ms delay.
replace_once(
    "scripts/verify-menu-dod-final.mjs",
    """    const s=clone(baseState); await seed(s); await page.locator('#public-search-input').fill('Octopus');
    await page.waitForTimeout(80);""",
    """    const s=clone(baseState); await seed(s); await page.locator('#public-search-input').fill('Octopus');
    await page.locator('[data-item-id=\"truffle-burger\"]').waitFor({state:'hidden'});""",
)

# 11.10 is testing that item expansion still works, not category navigation.
# Use the default-expanded Popular category rather than adding a second behavior
# dependency to the same assertion.
replace_once(
    "scripts/verify-menu-dod-final.mjs",
    """    const s=clone(baseState); await seed(s,'/r/sofra/admin/menu'); await page.locator('[data-action=\"jump-category\"][data-id=\"mains\"]').click(); const row=page.locator('[data-action=\"expand-item\"][data-id=\"octopus\"]'); await row.scrollIntoViewIfNeeded(); await row.click();""",
    """    const s=clone(baseState); await seed(s,'/r/sofra/admin/menu'); const row=page.locator('[data-action=\"expand-item\"][data-id=\"truffle-burger\"]'); await row.scrollIntoViewIfNeeded(); await row.click();""",
)

# Persist the failure-learning rules in the repository, including the new
# lessons from this rerun: unique selectors, idempotent automation and waiting
# for observable state rather than arbitrary delays.
agents = Path("AGENTS.md")
agent_text = agents.read_text()
if "## GitHub execution discipline — learn from failures" not in agent_text:
    raise SystemExit("GitHub execution discipline section missing from AGENTS.md")
old_rules = """11. **Temporary tooling stays temporary.** Remove debug workflows, patch scripts, Playwright harnesses, and artifacts before the final PR unless deliberately adopting them as maintained tests.
12. **Final diff is the gate.** Compare the branch to `main` before PR/merge and confirm only intended product/docs changes remain.

Project-specific lessons already learned:"""
new_rules = """11. **Temporary tooling stays temporary.** Remove debug workflows, patch scripts, Playwright harnesses, and artifacts before the final PR unless deliberately adopting them as maintained tests.
12. **Final diff is the gate.** Compare the branch to `main` before PR/merge and confirm only intended product/docs changes remain.
13. **Selectors must be unique and user-real.** Scope browser selectors to the intended container/control or prefer role + visible label when the same `data-action` appears in navigation and action buttons. Strict-selector ambiguity is a fixture bug, not a reason to weaken strict mode.
14. **Automation must be idempotent.** Re-running a patch or migration on an already-correct branch must produce no additional diff. Never use a matcher where the old text remains embedded inside the replacement without checking for the completed state first.
15. **Wait for observable state, not arbitrary sleeps.** Prefer an element state, route, persisted value, animation-frame boundary, or other deterministic condition over fixed `waitForTimeout` delays.

Project-specific lessons already learned:"""
if new_rules not in agent_text:
    if old_rules not in agent_text:
        raise SystemExit("AGENTS.md discipline insertion point not found")
    agents.write_text(agent_text.replace(old_rules, new_rules, 1))
    changed.append(str(agents))

print("Changed:", ", ".join(changed) if changed else "none")
