# Digital campus pitch design
The current user request authorizes implementation of the previously approved Option B. Institutional-only Option A would omit the main operational pitch; full ERP Option C would overstate readiness. Build the integrated public website and browser-local interactive portal.

The public experience introduces the school with verified identity and location, proposed editorial branding and transparent pending content. A visible P2 Digital Works proposal strip prevents mistaken endorsement. Never fabricate a school photo; use an explicitly illustrative ocean photograph as a visual metaphor.

The portal begins with a conspicuous demo acknowledgment. It is not authentication. Shared fictional students connect register, grades, payments, journal, entry/exit, reports and internal summaries. Data persists in localStorage with a version, handles unavailable or corrupt storage, and detects changes in another tab before saving. All exports are watermarked DEMO and carry no official receipt/form claim.

Domain decisions (developer choices for demonstration only): money stored in integer centavos, positive payments capped at balance, unique reference, one cash debit/receivable credit per payment; configurable percentage weights sum to 100, scores 0–100, draft/review/published labels are demonstration workflow only. QR payloads use DEMO-SSHS IDs and no personal details. Entry must precede exit; reject repeated direction. Camera permission is requested only on start, with manual/scanner input always available. No class attendance inference.

Architecture: vanilla ES modules with pure domain functions, shared templates/form primitives, esbuild bundles, self-hosted fonts and QR dependencies. Static hash routes work on any HTTP host without rewrites. No backend, tracking or real submissions. Current school policies, real auth/authorization, backups, migration and privacy review remain pilot prerequisites.
