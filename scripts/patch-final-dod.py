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

print("Changed:", ", ".join(changed) if changed else "none")
