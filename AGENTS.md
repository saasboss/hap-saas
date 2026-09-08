<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Hap agent rules

These rules are mandatory for Codex, Claude, Lovable, and any other coding agent.

## Read first

Before planning or editing, read:

1. `docs/START_HERE.md`
2. `docs/PROJECT_STATE.md`
3. `docs/MODEL_ROUTING.md`
4. `docs/AI_WORK_LOG.md`
5. `docs/MENU_DESIGN_PROMOTION_PLAN.md` — the living checklist for menu design and
   promotion work. Do the first unchecked box, tick it when done, and append a dated
   line to its progress log. Never re-audit or redo checked items.
6. The active pull request and current task or handoff, if one exists

If these documents conflict, this file wins. Ask the user only when a decision would materially change the product, security, cost, or scope.

## Git safety

- `main` must always remain usable.
- Never work directly on `main`. Use one new branch and one pull request per task.
- Use `codex/<task>`, `claude/<task>`, `lovable/<task>`, or `docs/<task>`.
- One task, branch, and file set has one active writing agent. Other agents may review read-only.
- Do not edit unrelated files, reformat the whole project, or “clean up” outside the task.
- Never force-push or rewrite published history.
- Before editing, state the goal, acceptance criteria, intended files, model tier, and rollback.
- Before merging, inspect the complete diff and run checks appropriate to the changed files.
- Merge only when the user explicitly asks for it or requests an end-to-end finished task.

## Shared AI coordination

- GitHub is the shared memory. Private Codex, Claude, and Lovable chats are not shared automatically.
- Before writing, inspect open pull requests and `docs/AI_WORK_LOG.md`. If another agent owns an overlapping task, branch, or file set, stop and coordinate instead of duplicating work.
- The active pull request is the task's shared conversation. Record material decisions, review findings, checks, blockers, and next actions in its description or comments.
- One provider builds. A different provider may review the same pull request read-only, but must not edit the builder's branch unless explicitly assigned.
- Before switching providers/accounts or stopping unfinished work, post a handoff in the active pull request using `docs/HANDOFF_TEMPLATE.md`.
- Do not commit full private-chat transcripts. Preserve concise facts and decisions, and never include secrets or credentials.
- After merge and verification, update `docs/PROJECT_STATE.md` when the product's Now, Next, Later/deferred, Done, or Decisions changed.

## Product-state discipline

- `docs/PROJECT_STATE.md` is the human-readable source for the product idea, Now, Next, Later/deferred, Done, and decisions.
- A new feature starts in Now before implementation.
- Anything intentionally postponed goes in Later/deferred; never silently forget it.
- Move an item to Done only after it is merged and verified.
- Do not invent product decisions. Record assumptions and request approval when they affect behavior.

## Model and credit discipline

Use the lowest tier that is safe for the task; see `docs/MODEL_ROUTING.md`.

- Economy: docs, renames, searches, mechanical edits, and known one-file fixes.
- Standard: normal features, ordinary bugs, tests, and routine refactors.
- Expert: architecture, security, authentication, database changes, payments, migrations, secrets, destructive actions, or a problem that defeated Standard.
- Give Economy or Standard one serious attempt. If evidence shows the task is beyond it, save a checkpoint and escalate one tier.
- Do not burn credits through repeated blind retries.
- Never weaken tests or safety checks merely to make a task pass.

## Mandatory design preflight for UI/UX

Every task that materially changes what a user sees or how they interact must complete a design preflight **before implementation begins**. This includes redesigns, layouts, navigation, interaction patterns, component styling, visual hierarchy, responsive fixes, menu presentation, promotions presentation, admin flows, onboarding, forms, sheets, and visual states.

Required order:

1. Inspect the current implementation, relevant route, components/styles, state, and existing behavior.
2. Use Product Design when it is available in the current environment.
3. If Product Design is unavailable, use UX Pilot as the approved fallback and generate a visual or flow direction before implementation.
4. Treat Product Design/UX Pilot output as design input, not automatically-correct instructions.
5. Critically compare the output with HAP's existing architecture, canonical flows, product scope, friction goals, established design language, supported mobile widths, and maintainability requirements.
6. Reject stale, duplicate, generic, low-value, or architecture-breaking suggestions.
7. Lock the smallest approved UI/UX scope and acceptance criteria.
8. Only then write or modify implementation code.
9. Run the full UI/UX implementation quality gate below before push or merge.

Do not skip the design preflight because a change looks small, obvious, urgent, already has a screenshot/mockup, or was suggested by Claude, Lovable, Codex, ChatGPT, or another AI. If neither Product Design nor UX Pilot is available, stop the UI implementation and report the blocker rather than silently proceeding without a preflight.

Purely non-visual work — documentation-only changes, backend-only work, CI/configuration, security-only fixes, or data migrations — does not require a design preflight unless it also materially changes UI/UX.

## UI/UX implementation quality gate

Product Design, UX Pilot, screenshots, Lovable output, generated prototypes, and AI suggestions are design input only. They do not lower the engineering standard required for code entering this repository.

Before any UI/UX implementation is pushed or merged, it must pass all of the following:

1. **Reuse before invention.** Inspect the existing route, component, styling, interaction, and state patterns first. Reuse or extend existing components and utilities where they fit. Do not create a parallel design system, duplicate route logic, or another version of an existing control to save time.
2. **Smallest safe change.** Change only what is needed for the approved UI/UX outcome. Do not rewrite working architecture, convert unrelated files, introduce broad global CSS, or add dependencies for styling or interactions that the current stack can already handle.
3. **No prototype shortcuts in production paths.** Reject hardcoded behavior that should use existing state, fake interactions, placeholder logic, dead controls, duplicated demo state, copied markup with no reuse path, or visual-only implementations that break the existing flow.
4. **No generated-code sludge.** Reject unnecessarily monolithic components, excessive wrapper markup, giant inline-style objects, unexplained magic numbers, duplicated CSS blocks, cascading `!important` patches, brittle absolute positioning, dead code, unused abstractions, or one-off hacks that merely make a screenshot look correct.
5. **Architecture stays coherent.** Follow the existing React/TanStack/Tailwind/shadcn/Radix patterns and the repository's established ownership boundaries. Prefer existing primitives over raw custom replacements unless there is a documented reason.
6. **Responsive behavior is proven.** Phase 1 UI changes must be checked at 320px, 390px, and 430px. Check 700px+ for regressions when the changed surface is visible there. No horizontal overflow, clipped labels, overlapping content, inaccessible controls, or interaction targets that become unusable at supported widths.
7. **Interaction quality matters, not just appearance.** Verify loading/disabled/selected/open/closed/error/empty states when relevant. Preserve keyboard behavior, focus visibility, semantic labels, readable contrast, and minimum practical touch targets. A pretty screenshot is not proof of a good implementation.
8. **Design intent must survive real content.** Test long labels, long item names, price variations, empty descriptions, promoted states, and other realistic content that could break the layout. Do not optimize only for the sample text shown in a mockup.
9. **No silent scope expansion.** A UI task must not introduce backend, auth, billing, data-model, tenancy, analytics, or permissions behavior unless separately approved.
10. **Evidence before push.** Inspect the complete diff, run `npm run build` and the relevant lint/tests, and visually verify the affected screens. If a claim such as “fixed on mobile” or “no overlap” matters, provide direct evidence appropriate to that claim.
11. **Challenge the finished implementation.** Before declaring the task complete, actively look for the easiest ways it could fail: another viewport, longer content, another state, another route, regressions from shared CSS, duplicated logic, or unnecessary complexity. Fix material issues before requesting merge.

If an implementation looks correct but fails any rule above, it is not ready to push or merge. Prefer a smaller, maintainable implementation over a faster AI-generated one.

## GitHub execution discipline — learn from failures

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

## High-risk gate

For authentication, authorization, payments, database schema or migrations, secrets, production infrastructure, dependency upgrades with breaking changes, destructive operations, or security controls:

1. Use an Expert model.
2. Produce a plan and rollback first.
3. Do not implement until the user approves the plan.
4. Require a second-agent review before merge.

## Credit-limit checkpoint

At a usage warning or before switching accounts/providers:

1. Stop at the next safe boundary.
2. Run the available checks.
3. Commit and push the safe work; never leave half-applied changes on `main`.
4. Fill in `docs/HANDOFF_TEMPLATE.md` in the task/PR description or a task-specific handoff file.
5. Report the branch, last safe commit, changed files, checks, remaining work, risks, and exact next action.

Never share passwords, cookies, API keys, or account credentials. A new agent receives context from GitHub plus the handoff, not from account sharing.

## Required final report

Every implementation report must include:

- Result and acceptance-criteria status
- Branch and commit
- Files changed
- Checks and results
- Deferred items
- Risks or assumptions
- Rollback method
- Exact recommended next step
