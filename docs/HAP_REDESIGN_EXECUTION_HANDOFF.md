# Hap menu and promotion redesign — execution checkpoint

Updated: 2026-09-07. Status: Stage 1 implemented and verified locally; PR #1 pending merge. Stages 2–7 remain.

## Identity and authorization

- Target repository: saasboss/trying, synced branch main.
- Lovable: trying, project b66d6853-d00f-465c-bd46-1e4eac876a3a.
- The owner explicitly confirmed this repository and branch from Lovable GitHub settings. Copied references to saasboss/eeee identify an older project and must not be used for delivery.
- Task branch: codex/hap-promotion-foundations (Stage 1).
- Inspected source revision: 63a969102b6aa9454af8cf3a612183348b8c5522, also returned as Lovable's latest revision and GitHub's latest commit during this session.
- Agent/provider: Codex, GPT-6; one writing agent. Standard feature/bug implementation scope; this checkpoint is documentation only.
- Owner authorizes all seven stages sequentially, relevant tests, commits, pushes, task PRs, reviews and merges into verified main without routine reapproval.
- Never force-push, rewrite published history, reconnect Lovable, bypass branch protections, purchase credits, or invoke Lovable AI. Read-only Lovable inspection is allowed.

## Current scoped priority

The owner explicitly prioritizes the seven-stage redesign below over older notes postponing broad UI work. Preserve all other deferred work in PROJECT_STATE.md; update its Now/Decisions on the Stage 1 implementation branch. Preserve existing completed checklist items: layout ID flattening (10.1) and palette preservation (2.3) are already recorded complete; verify compatibility without redoing them.

## Goal and acceptance

Deliver the complete menu/promotion redesign through one branch and PR per stage, merging each checked and reviewed stage before beginning the next dependent stage. Preserve stack, routes, data-service boundary, permissions, persistence, content, prices, translations and newer work. Scope primarily public/hap/app.js and public/hap/styles.css, services.js only as needed, focused tests, and project-state/checklist documentation.

## Sequential checklist

- [ ] Stage 1: Separate item/category ribbon selectors and folded pseudo-elements; reserve real layout space, preserve folded tabs/notched borders, handle long labels, locally clip decoration without clipping content/focus, and use actual light/dark surface colors. No z-index/price-size/arbitrary-price-margin collision fixes. Consolidate guest-selected currency formatting for previous/current prices, retain From and approximate information, validate previous price against effective variant/base price, suppress ambiguous multi-variant comparisons without deleting stored values. Visual promotions never change current prices.
- [ ] Stage 2: Exactly Essential/editorial (true image-optional compact rows), Signature/modern (recommended image/text cards, one per phone row), Gallery/grid (vertical wrapping, two columns only where comfortable). Remove horizontal Gallery carousel/pager hooks. Flatten every legacy alias directly; modern/street -> modern, editorial/noir -> editorial, grid -> grid. Preserve palette/custom brand/background/mode without read-time persistence writes. Item treatments framed/ribbon/offer = Framed/Ribbon/Band; filled -> framed, editorial -> offer; default framed. Category framed/ribbon/band; stamp -> framed, spotlight/marquee -> band; default band. Category treatment applies once to section/header; independent item promotion remains. Preserve terms, schedules, intensity and other fields.
- [ ] Stage 3: Shared guest renderers accept explicit draft appearance/promotion/language/currency and typography/image/radius context. Category preview includes actual heading/items. Update preview without rebuilding focused forms. Preview must not save, record analytics or trigger customer popups. Design flow Layout -> Brand -> Review; all three choices, palette/mode, custom color/background under More options, mobile compact/expanded preview, selected-value summary, side preview where existing shell permits. Back retains, Cancel discards, Save design validates/applies once; preserve routes.
- [ ] Stage 4: One item/category promotion wizard Target -> Appearance and message -> Timing -> Review. Searchable single-target picker with selected name and category visible/total counts; contextual actions preselect and skip Target. Three treatments, live preview, suggested/custom labels, optional terms/previous price under Offer details, existing intensity under advanced options. Reuse schedule helpers; Until tonight displays exact midnight-based ending, scheduled preview shows active appearance and clear Scheduled preview label. Review includes Edit links and one Save/Schedule action. Populate existing promotions; preserve pause/resume/end and Active/Scheduled/Past. Check service results; retain drafts and errors on failure. Category promotion is a visual highlight, not a discount.
- [ ] Stage 5: Item Basics (name/category/price) -> Details (photo/description/variants/dietary/all existing optional fields) -> Review with actual result and final Save. Direct quick price/availability editor with small preview. One-screen category creation/rename; retain reordering. Isolated drafts including variant add/remove; Back retains, Cancel preserves original, validated Save applies once. No new bulk workflow.
- [ ] Stage 6: Overnight recurrence belongs to starting weekday (Friday 18:00–02:00 includes Saturday 01:00, excludes Friday 01:00). Validate dates/order/days/times; detect actual future/recurring overlaps on save and resume, naming conflicts. Allow one strong item and one featured category simultaneously; normal/subtle items coexist. Preserve prototype local time, legacy schedules, expiry, paused states and one promotion record per target. No inferred timezone/closing times. Add focused behavioral tests without framework/dependency additions.
- [ ] Stage 7: Real browser matrix of three layouts x three treatments x item/category at 320/390/430px and existing larger-screen presentation. Light/dark, enlarged text, long names/labels, absent photos, variants, large/converted prices, no overlaps/overflow, saved/preview parity, Back/Cancel including variants, failed-save retention, hidden/sold-out/empty categories, filters/details, legacy records, overnight/future conflict/pause/resume/expiry. Run relevant build/lint/type checks and focused tests; distinguish baseline failures. Review full diff and update checklist/state. Merge completed stages, fetch GitHub again and verify exact delivered commits. Inspect Lovable imported revision/source/preview read-only; report synchronization as unverified if unavailable. Final report includes stage status, repo/branch/SHA/PRs, checks, Lovable evidence, and revert instructions.

## Completed inspection

- Read target Lovable AGENTS.md, START_HERE, PROJECT_STATE, MODEL_ROUTING, AI_WORK_LOG, MENU_DESIGN_PROMOTION_PLAN and package.json.
- Read AGENTS.md from confirmed GitHub main and HANDOFF_TEMPLATE.md.
- Inspected relevant app.js/CSS renderers and scheduling/save callers at the exact Lovable revision.
- GitHub connector confirms access to private saasboss/trying and existence of main. No open PRs before this checkpoint branch.
- GitHub latest commit and Lovable latest revision both identify 63a969102b6aa9454af8cf3a612183348b8c5522. This verifies the baseline correspondence, not delivery of any redesign.
- Found an older local Hap archive, without a Git checkout, with outdated instructions. It was not modified or used as the target.

## Initial findings to address in order

Line references are to inspected revision, not guaranteed future HEAD:
- app.js:2229/2294/2569 and styles.css:771–772/1119–1120 share promo-ribbon classes. Global category ribbon properties/pseudo-element leak into item ribbons.
- Item ribbon is an absolute 112px corner; title padding and price alignment do not reserve a decoration row. Notch at styles.css:751 is absolute and nowrap.
- app.js:2281 priceColumn uses money for previous price and menuPrice for current price. Offer footer duplicates price logic and drops the normal approximate-price secondary information.
- app.js:3215 validates previous price against item.price rather than itemPrice; multi-variant comparison remains ambiguous.
- app.js:2568 category preview renders only heading; app.js:2491 preview depends on state appearance/theme.
- app.js:1262 checks today's weekday before evaluating overnight recurrence; app.js:1320 conflict detection considers only currently live promotions.
- app.js:3229 category save ignores returned status; resume callers lack UI conflict checks.
These are source-review findings only; no browser or behavioral test result is claimed.

## Blockers and checks

- Default local command and browser runtimes fail during Windows sandbox setup: helper_unknown_error: setup refresh had errors.
- Elevated read-only commands initially worked, then automatic approval review rejected further local execution because the Codex account hit its usage limit (tool reported retry at 9:44 PM).
- A delegated read-only review agent also failed at the usage limit; no independent review completed.
- GitHub/Lovable read-only connectors remain accessible. This documentation checkpoint was committed through GitHub.
- No application code changed. No build, lint, type, behavioral or browser checks ran.
- No working checkout of trying has been obtained. No implementation stage is ready for review or merge.

## Deferred and rollback

Preserve all existing deferred work: bulk-workflow decision, true desktop administration, Hap Control redesign, production analytics/billing/multi-menu/routed overlay work, and broad CSS rewrite. Do not introduce backend integrations or dependencies.

This draft PR contains only this checkpoint document. Closing it leaves main unchanged; if ever merged, revert its documentation commit using a normal revert commit. Future implementation PRs must document scoped revert commits without history rewriting.

## Exact next action

Once local execution and review capacity are available, obtain an isolated checkout of saasboss/trying, fetch main and this task branch, inspect any new/open overlapping work, and continue Stage 1 on codex/hap-promotion-foundations. Re-read current instructions and relevant callers, record scoped priority, implement and test Stage 1, obtain read-only review, resolve findings, and merge before Stage 2. Continue all seven stages under the owner's existing authorization; do not ask again for routine choices or merges.

## Resumed execution — 2026-09-07

Owner restored usage and requested continuation. Retrieved 130 exact GitHub files through the authenticated connector, verified every blob hash and tree 14e7c5f2995a305f5336535320dd7012ba556238, and reconstructed the matching shallow checkpoint commit locally. Terminal GitHub account lacks private repository access; GitHub connector is authorized and used for delivery. Working copy: temporary hap-trying-20260907 directory. Locked Bun install succeeded without dependency/lockfile changes. Stage 1 syntax, build, TypeScript, three behavior tests, and 72 real Chromium layout cases passed. Existing repository formatting failures are being compared against baseline; no broad reformat. Independent implementation review failed due its own usage limit; builder reviewed the complete diff. Continue Stage 2 only after PR #1 merge.

## Continuation 2026-09-08
Stages 1 and 2 merged through PRs #1/#2. Stage 3 branch codex/hap-design-draft-preview is complete pending checked/reviewed merge. Continue Stage 4 unified promotion wizard, Stage 5 isolated item editing, Stage 6 scheduling, Stage 7 final verification. One writer; user authorizes sequential PR merges. No Lovable AI.

- 2026-09-08 — Stage 4 unified promotion wizard completed with checked transactional saves and preserved publication activity. Next Stage 5 isolated item drafts, then scheduling corrections and final delivery checks.

- 2026-09-08 — Stage 5 item drafts checked; next Stage 6 scheduling then Stage 7 full regression/delivery. Optional reviewer hit usage limit after initial finding; builder completed remaining review and fixes.

- 2026-09-08 — Stage 6 scheduling correctness checked. Next Stage 7 final matrix, state/checklist cleanup, complete delivery verification.
