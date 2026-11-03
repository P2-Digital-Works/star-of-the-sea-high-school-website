# UX Contract
## Product context
School corporation pitch; English Philippines; PHP; Asia/Manila timestamps. Keyboard/mobile baseline targets WCAG 2.2 AA. Demo-only data; policy source PRODUCT.md and docs/superpowers/specs/2026-11-03-digital-campus-design.md.
## Business-context sources
| Scope | Source | Type | Reviewed |
|---|---|---|---|
| Permissions, data lifecycle, retention, payment and disclosure | PRODUCT.md; docs/superpowers/specs/2026-11-03-digital-campus-design.md | Current user brief and explicitly labeled developer demo rules | 2026-11-03 |
| Public school identity | docs/FACTS.md | DepEd | 2026-11-03 |
## Visual contract
Runtime src/styles.css is canonical; DESIGN.md records it. One light portal theme with navy public field. No official identity claims.
## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | native select via field() | src/app.js | native | browser keyboard |
| Form | bindForm(), field() | src/app.js | create/edit | browser validation |
| Scrollbar | global CSS | src/styles.css | global | computed style |
| Toast | notify() live region | src/app.js | success/error | browser status |
| CRUD | domain.js + student views | src/app.js | archive/restore | browser full flow |
| Table | table() | src/app.js | horizontal overflow | mobile browser |
## Component behavior
Native buttons/links, visible focus ring, disabled/hover states. Native selects intentionally delegate popup geometry/keyboard to OS. Forms use noValidate, inline alert and first-invalid focus. No native alert/confirm/prompt. Native dialog only for reset confirmation.
## Dataset navigation
Local student search stored in URL query within hash route, grade filter and active/archive view. Search has clear. No pagination for small dataset. No matches gives clear recovery. All tables scroll within labeled region on narrow screens.
## Flow ledger
| Operation | Trigger | Success | Failure | Focus | Source |
|---|---|---|---|---|---|
| Create/edit | Save fictional student | return to student list and live feedback | preserve fields + inline error | heading on return; first invalid on error | spec |
| Archive/restore | Record detail action | retained record, linked history, undo by restore | inline error | detail heading | spec |
| Payment/grade/gate | Record/save | persist atomically, refreshed history | preserve input + inline error | status or error | spec |
| Search | typing/clear | local result update | no results with recovery | input retained | PRODUCT.md |
## Navigation and responsive behavior
Hash routes; route titles and heading focus. Invalid routes show return link. Mobile public menu toggles with aria-expanded. Portal nav becomes horizontal scroll. Tables retain actions through scroll. Internal preview prints without site chrome. Dirty forms guard internal route navigation with native dialog and preserve form on cancel.
## Overlays and feedback
Native dialog handles focus trapping/Escape, explicit cancel and confirm, return focus. Reset names scope and deletes only browser demo records. Status region is polite. Persistent disclosure always visible.
## Async and resilience
Synchronous local mutations; save precedes UI success. Storage failure shows error, no success. Cross-tab revision mismatch blocks stale writes, requires reload. Camera begins only on explicit click, stops on navigation. No server, no pretend sync. No credential entry. Demo acknowledgment stored only in sessionStorage.
## Validation
Required native controls plus domain validation. Application calls checkValidity() with inline error and aria-invalid. Money is integer centavos. Unique references; rejected overpayment. Grade weights must total 100. Gate ordering enforced. Text escaped; CSV formula prefixes neutralized.
## Verification
node:test for domain/storage, Playwright workflow with axe, mobile screenshots, static premium audit. No claim of production security or compliance.
