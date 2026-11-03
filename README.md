# Star of the Sea — Digital Campus MVP

A deployable pitch demo by **P2 Digital Works** for **Star of the Sea High School, Inc.** Public website + connected interactive management portal. This is an independent proposal, not an official school website or school-endorsed service.

## Open the demo

The hosted preview is private to its owner. The confirmed hosting status and URL accompany the delivery; Site setup details are in `docs/DELIVERY.md`. To enter the portal, select **School portal**, read the demo notice, tick the acknowledgment, and select **Enter demo portal**. No password: this is explicitly not authentication.

For a local preview (Node.js 22+ and Python 3):

```sh
npm ci
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:4173. A prebuilt `dist/` is included; it can be served by any static HTTP server. Hash routes require no server rewrite. Opening `index.html` directly with `file://` is not supported.

## Working features

- Public homepage, about, academics, admissions planning checklist/download, example news with filters/detail pages, contact inquiry preview (nothing sent).
- Clear demo acknowledgment and administration dashboard.
- Create, search/filter, edit, archive and restore fictional students.
- Grade entry with editable percentage weights, weighted-average calculation and demonstration review state.
- Payment recording in integer centavos, positive amount/balance/unique-reference validation, linked student balances and balanced sample debit/credit journal.
- Real QR creation/download and camera decoding with jsQR; explicit camera permission request and stop controls; typed or scanner-keyboard ID fallback. Detection fills an ID; the user reviews and records the event.
- Entry-before-exit and repeated-direction validation. Campus gate events are explicitly separate from class attendance.
- CSV reports, local activity history, printable internal student summaries (Print / Save PDF).
- Browser-local persistence, corrupted-data recovery, storage-error feedback, stale-tab write prevention, reset, and unsaved-form navigation protection.

## Pitch walkthrough

1. Show the proposed public website and its admissions/news pages.
2. Enter the portal and create a fictional learner.
3. Save a demo grade with weights totaling 100%.
4. Record a sample payment and review its balance and accounting journal.
5. Use the learner’s demo QR/ID to record gate entry, then exit.
6. Export a collection report and print the internal learner summary.
7. Reset the fictional dataset for the next presentation.

Starting dataset: eight fictional learners, two payments, two grades and two gate events. Demo year 2026–2027; displayed timestamps use Asia/Manila. All names, school figures, fees, grades, example announcements and records are fictional.

## Deployment

Run `npm run build`, then deploy the contents of `dist/` to a static host (Cloudflare Pages, Netlify, or an equivalent HTTPS host). No environment variables, database, credentials or API keys are needed. For Sites, `.openai/hosting.json` identifies the private pitch Site. The `_headers` file supplies recommended security headers on hosts that support it; confirm the host applies them. The application and bundled fonts/QR libraries run without external requests. Camera access requires HTTPS or localhost plus browser permission.

For reuse under a different Site, remove this Site’s `project_id` and register a new Site; do not deploy over another owner’s project.

## Important boundaries

**Never enter real student, guardian, financial or educational records.** This app has no server, secure authentication, user authorization, tamper-proof audit trail, database backup or payment processing. Browser storage is editable and visible to users of the browser profile. A private hosting wrapper does not make the portal a production student system.

Grades use a configurable demonstration formula, not an asserted school/DepEd policy. Payments are not official receipts. School form previews are unofficial internal summaries, not DepEd forms or LIS replacements. Camera hardware and permission completion were not verified in the connected preview; manual gate recording and generated-QR decode were verified.

Before a real pilot: obtain school-approved content and policies; implement server authentication/role permissions, private storage/database, validation, backups, audit controls and recovery; review privacy/security; conduct school-staff acceptance testing. Commercial licensing, source ownership, hosting, maintenance and support require a separate agreement.

## Source map

- `src/domain.js`: immutable connected domain rules and CSV escaping.
- `src/storage.js`: versioned browser storage and stale-write protection.
- `src/app.js`: routes, shared UI and connected interactions.
- `src/styles.css`: canonical design tokens and responsive/print styles.
- `public/`: HTML, self-hosted photo/fonts and license notices.
- `tests/`: domain, storage and real QR round-trip tests.
- `PRODUCT.md`, `DESIGN.md`, `UX-CONTRACT.md`: scope, design and behavior.
- `docs/FACTS.md`, `docs/ASSETS.md`, `docs/VERIFICATION.md`: evidence and boundaries.

See the verification report for actual checks and limitations. No production readiness or formal accessibility certification is claimed.
