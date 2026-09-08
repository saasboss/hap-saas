# Project state

Last updated: 2026-09-08

## Product idea

**Working description:** Hap is a mobile-first restaurant menu and operations workspace. It gives an owner or manager one place to organize categories and dishes, update prices and availability, run promotions, publish a guest-facing menu, share it by QR code, and understand basic guest activity.

**Prototype evidence:** the current product already demonstrates the restaurant-admin, public-menu, QR, promotion, design, settings, insights, and Hap Control surfaces.

**Still needs owner confirmation before production implementation:** the exact first customer segment, the first paid workflow, the smallest production-ready boundary, and the success metric. Agents should use the existing product and this description as context; they should not restart with generic questions that the repository already answers.

## Now — one current priority

Return to Hap's production-MVP definition from the verified browser prototype. The scoped menu/design/promotion redesign and its Definition of Done are complete through 11.10 in `saasboss/remix-of-trying`; do not restart that redesign or launch another broad UI-polish pass without new regression evidence or explicit owner priority.

Start with the smallest complete restaurant workflow: an owner or manager can set up a restaurant menu, create and organize categories and items, update price and availability, publish the mobile guest menu, and share it by QR code. Confirm only the decisions that materially affect product behavior, security, cost, or scope before turning this workflow into production implementation tasks.

No further broad UI-polish work should begin until the MVP boundary and first success metric are recorded here.

## Next — ordered queue

1. Confirm the first customer segment and first paid use case without re-asking facts already visible in the product.
2. Set one measurable MVP success condition.
3. Split the complete workflow into small, independently reviewable vertical slices.
4. Plan production foundations, including authentication, tenancy, persistence, deployment, and automated checks, through the high-risk gate where applicable.
5. Implement one task per branch and pull request, verifying every merge in Lovable.

## Later / deferred

- **Menu bulk behaviour (Phase 1 Task 12)** — deferred until the owner chooses the exact bulk workflow; resume after that product decision.
- **True desktop/tablet administration layout (Phase 2)** — Phase 1 only verified that the existing framed presentation does not regress at ≥700px.
- **Hap Control redesign** — excluded from the restaurant-admin polish phase.
- **Real analytics, self-serve billing, multi-menu UI, and routed sheet/back-button overlay handling** — require separate product and technical scopes.
- **Broad/global CSS rewrite** — not justified by Phase 1 and must not be mixed into feature work.

Never delete a deferred item merely because it is inconvenient. Record its reason, dependency or resume condition, date, and decision owner when it becomes active.

## Done — merged and verified

- Lovable project **Remix of trying** is connected to GitHub repository `saasboss/remix-of-trying`; GitHub-to-Lovable synchronization has been verified.
- Beginner AI workflow, model routing, safety rules, design-preflight gate, UI implementation quality gate, and credit handoff system added.
- **Phase 1 UI/UX, information architecture, action hierarchy, accessibility, and visual-polish tasks completed**, except the intentionally deferred Task 12 bulk-workflow decision.
- Phase 1 screen work was delivered through separate pull requests and verified in the exact Lovable build.
- Final responsive matrix passed on the guest menu, Overview, Menu Items, Design, Promotions, QR, Insights, Settings Restaurant/Team/Billing, and Hap Control at 320, 390, 430, and 800px with zero horizontal overflow and no console errors.
- Final UI verification commit from the earlier Phase 1 pass: `dbceba376b3d413e6ecf4be72f7273f60e749be1`.
- Canonical numbered plan restored at `.lovable/plan.md` while preserving Lovable's separate public-menu category-header plan.
- **Menu Design + Promotions Definition of Done 11.1–11.10 completed and browser-verified.** Coverage includes promotion/content overlap, 320/390/430 overflow, enlarged/translated/large-price stress content, mixed/missing photos, light/dark and guest currency, preview parity, Back/Cancel navigation, failed-save draft retention, hidden/sold-out/empty states, canonical/legacy routes, permissions, public search/filter, item details, and admin item expansion.
- Final regression verification exposed and corrected one real permissions inconsistency: Menu › Promotions now respects `access.promotions=false` and renders the same existing no-permission fallback pattern used by Design.
- GitHub execution discipline now requires classifying product vs fixture/tooling failures, real route/state inspection, idempotent automation, unique selectors, observable waits, narrow patches, and removal of temporary verification tooling before merge.

## Decisions

- GitHub `main` is the shared source of truth.
- The active connected repository for this project is `saasboss/remix-of-trying`.
- `main` must stay usable.
- Work uses one task, one branch, one writing agent, and one pull request.
- Other agents review read-only unless explicitly assigned a separate fix.
- High-risk changes require an Expert model, approved plan, rollback, and second review.
- Agent continuity comes from commits and handoffs, never credential sharing.
- Phase 1 is complete; Task 12 remains deferred rather than silently absorbed into another task.
- The Menu Design + Promotions redesign is complete through Definition of Done 11.10; do not reopen completed stages without new evidence of a regression.
- Broad UI-polish passes stop here. New work must support the recorded MVP workflow or be explicitly prioritized.

## Open owner decisions

1. Which independent restaurant segment is first?
2. What is the first paid use case?
3. What single measurable result proves the MVP works?
