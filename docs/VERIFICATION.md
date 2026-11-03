# Verification — 3 November 2026

## Automated checks
- `npm test`: 11 passed, 0 failed. Connected balances/journal, invalid/duplicate/excessive payments, grade bounds/weight total, gate event order, student creation/update/archive/restore, report summary, CSV formula neutralization, persistence/stale writes, corrupt/unavailable storage and invalid-schema reset.
- QR integration: qrcode PNG generation → jsQR decode returns exact DEMO-SSHS payload.
- `npm run build`: successful static production bundle.
- Impeccable detector on authored JS/CSS/HTML: no findings (`work-detector.json`). Linked stylesheet warning came from pre-build public HTML; authored CSS was included independently.

## Connected-browser checks
Tested with the available in-app browser at 1440×1000 and 390×844:
- Demo acknowledgment required; no password/real-auth claim.
- Student create → search → view → edit → archive → restore.
- Empty required field and no-result search with recovery.
- Sample payment 1250.25 accepted; learner balance updated to 16749.75 for the created learner; duplicate reference and overpayment rejected.
- Invalid grade total rejected; corrected grade 86.80 appeared for the same learner.
- QR-prefixed student ID accepted; exit-before-entry rejected; entry recorded with Manila timestamp.
- Internal student summary retained the selected learner, grade and balance; unofficial DEMO watermark present.
- CSV download completed; reloading retained the created record.
- Mobile public menu opened and navigated; tables remained contained horizontally.
- Read-only DOM measurements: no document overflow at 390 or 1440; one h1; no unlabeled fields on sampled forms; tokenized scrollbar. Direct-text contrast sampling of homepage and dashboard found no below-threshold pairs (not an exhaustive WCAG audit).
- Reviewer fixes: archived profile mutation links absent; archived report retained DEMO-1009; direct archived payment URL required a new explicit selection; Cancel preserved draft 123 after both Leave demo and actual browser Back.
- Reset restored eight starting learners before delivery.

## Independent review
Impeccable finish reviewer: initial disposition **fix** for archived-learner selection and unsaved exits. Targeted follow-up scored both **resolved**, disposition **ship within agreed demo scope**. Reviewer independently ran the 11 tests. Follow-up assessed current source and two targeted captures; it did not repeat all browser interactions.

## Limits
Camera start reached the permission request; a live hardware scan/permission completion was not verified. Actual QR generation/decode and manual gate events were verified. Print layout is provided with a DEMO watermark; no official PDF/form compliance is claimed. No server exists, so multi-user authentication, authorization, backups, network mutation failures and real payment settlement are outside this demo. The browser checks are not a formal assistive-technology or full WCAG certification. No automated Playwright/axe run is claimed.

## Static auditor limitation
The separate frontend-premium strict auditor was invoked twice but did not complete while parsing the template-based app source; both attempts were interrupted. `docs/premium-audit-status.json` records this incomplete check. No full premium static-audit pass is claimed. The independent reviewer, browser tests, domain tests, production build and Impeccable detector completed as described above.
- Official `designmd lint DESIGN.md`: 0 errors after replacing fluid expressions in machine-readable font-size fields with concrete dimensions. Eight advisory warnings remain (no primary alias and tokens not used in component frontmatter); the runtime palette is documented without inventing extra CSS tokens.
