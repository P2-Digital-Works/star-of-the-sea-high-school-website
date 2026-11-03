# Digital Campus Implementation Plan
> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.
**Goal:** Deliver a portable, polished, connected pitch demo.
**Architecture:** Static app with pure domain module, shared UI, hash routes, browser-local persistence and bundled QR support.
**Tech Stack:** HTML, CSS, JavaScript ES modules, esbuild, qrcode, jsQR, node:test, Playwright, axe.
**Spec:** ../specs/2026-11-03-digital-campus-design.md
## Global Constraints
Fictional data only. Provisional branding. No school endorsement. No real student/financial data or official forms. PHP centavos, English, Asia/Manila.
## Review Focus
Invalid/corrupt storage must recover visibly; overpayment/duplicates must fail; entry/exit ordering must hold; text must be escaped; narrow screens and keyboard must retain actions.
### Task 1: Connected domain
Files: src/domain.js, tests/domain.test.js. Interface: seed(), createStudent(state,input), updateStudent(state,id,input), recordPayment(state,input), saveGrade(state,input), recordGate(state,id,direction,time), balance(state,id), summary(state), csv(rows).
- [ ] Write domain tests for connected student/grade/payment/gate/report behavior and invalid inputs. Run to observe missing implementation failure.
- [ ] Implement immutable domain state and integer-centavo journal.
- [ ] Run npm test; expect all passing.
### Task 2: Public and portal experience
Files: src/app.js, src/styles.css, public/index.html, src/storage.js.
- [ ] Add storage tests first, then implement corrupt/unavailable/conflict recovery.
- [ ] Build complete public routes and shared portal navigation/forms/tables with connected mutations and reset.
- [ ] Add QR generation, camera decode, scanner/manual fallback, CSV exports and printable internal summary.
- [ ] Build, inspect desktop/mobile, test keyboard, validation, CRUD, payment/journal, QR and no-results.
### Task 3: Review and delivery
Files: README.md, docs/VERIFICATION.md, DESIGN.md, UX-CONTRACT.md, .impeccable/design.json.
- [ ] Run complete tests, production build, accessibility scans and static design audit.
- [ ] Run Impeccable detector, finish reviewer and documenter, fix material findings.
- [ ] Package source and static build, synchronize repository and publish private preview if service permits. Record honest status.
