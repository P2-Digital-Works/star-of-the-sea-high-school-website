import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  LEVELS,
  seed,
  createStudent,
  updateStudent,
  recordPayment,
  saveGrade,
  recordGate,
  balance,
  summary,
  csv,
} from "./domain.js";
import { openStore } from "./storage.js";
const app = document.querySelector("#app");
let disk;
try {
  disk = window.localStorage;
} catch {
  disk = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
}
let store = openStore(disk),
  state = store.state,
  dirty = false,
  stream = null,
  scanFrame = null,
  route = "",
  toastTimer,
  lastHash = location.hash || "#/",
  navigationPending = false;
let entered = false;
try {
  entered = sessionStorage.getItem("p2-demo-entry") === "yes";
} catch {}
const e = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    n / 100,
  );
const stamp = (v) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(v));
const student = (id) => state.students.find((s) => s.id === id);
const activeStudents = () => state.students.filter((s) => !s.archived);
const icons = {
  arrow: "M5 12h14m-5-5 5 5-5 5",
  home: "m3 10 9-7 9 7v10h-6v-7H9v7H3Z",
  grid: "M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7.87a4 4 0 0 1 0 7.75",
  book: "M4 3h16v18H4Zm4 0v18m4-12h5m-5 4h5",
  wallet: "M3 5h16v4H3V5Zm0 4h18v11H3Zm13 4h5v4h-5Z",
  scan: "M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5m4-4h10m-5-5v10",
  chart: "M4 3v18h17M8 16v-4m5 4V8m5 8V5",
  file: "M5 3h9l5 5v13H5Zm9 0v6h5M9 13h6m-6 4h6",
  logout: "M9 3H3v18h6m4-14 5 5-5 5m-5-5h10",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  chevron: "m9 5 7 7-7 7",
  menu: "M3 6h18M3 12h18M3 18h18",
  search: "M21 21l-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z",
  clock: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(icons[name] ?? icons.file).split(" ").length ? `<path d="${icons[name] ?? icons.file}"/>` : ""}</svg>`;
const link = (to, label, cls = "") =>
  `<a class="${cls}" href="#${to}">${label}</a>`;
const badge = (text, kind = "") =>
  `<span class="badge ${kind}">${e(text)}</span>`;
const errorBox = () => '<p class="form-error" role="alert" hidden></p>';
function field(label, name, content, help = "") {
  return `<div class="field"><label for="${name}">${label}</label>${content}${help ? `<small id="${name}-help">${help}</small>` : ""}</div>`;
}
const input = (name, type = "text", value = "", attrs = "") =>
  `<input id="${name}" name="${name}" type="${type}" value="${e(value)}" ${attrs}>`;
const select = (name, values, value = "", attrs = "") =>
  `<select id="${name}" name="${name}" ${attrs}>${values.map((v) => `<option value="${e(typeof v === "object" ? v.value : v)}" ${(typeof v === "object" ? v.value : v) === value ? "selected" : ""}>${e(typeof v === "object" ? v.label : v)}</option>`).join("")}</select>`;
const studentSelect = (
  name = "studentId",
  value = "",
  includeArchived = false,
) =>
  select(
    name,
    [
      { value: "", label: "Choose a fictional student" },
      ...(includeArchived ? state.students : activeStudents()).map((s) => ({
        value: s.id,
        label: `${s.name} · ${s.id}${s.archived ? " · Archived" : ""}`,
      })),
    ],
    value,
    "required",
  );
const requestedActive = () => {
  const requested = new URLSearchParams(location.hash.split("?")[1]).get(
    "student",
  );
  return requested
    ? activeStudents().some((s) => s.id === requested)
      ? requested
      : ""
    : (activeStudents()[0]?.id ?? "");
};
function table(headers, rows, empty = "No records yet.") {
  return `<div class="table-scroll" role="region" aria-label="${e(headers.join(", "))} table" tabindex="0"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
}
function notify(message) {
  const n = document.querySelector("#notice");
  clearTimeout(toastTimer);
  n.textContent = message;
  n.hidden = false;
  toastTimer = setTimeout(() => (n.hidden = true), 5000);
}
function commit(next, message) {
  state = store.save(next);
  store.warning = "";
  dirty = false;
  if (message) notify(message);
}
async function confirmAction(title, text, button) {
  const d = document.querySelector("#confirm-dialog");
  d.querySelector("h2").textContent = title;
  d.querySelector("p").textContent = text;
  d.querySelector("[value=confirm]").textContent = button;
  d.showModal();
  return new Promise((resolve) =>
    d.addEventListener("close", () => resolve(d.returnValue === "confirm"), {
      once: true,
    }),
  );
}
function bindForm(id, handler) {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener("input", () => (dirty = true));
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const box = form.querySelector(".form-error");
    box.hidden = true;
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((n) => n.removeAttribute("aria-invalid"));
    const invalid = [...form.elements].find(
      (el) => el.willValidate && !el.checkValidity(),
    );
    if (invalid) {
      invalid.setAttribute("aria-invalid", "true");
      invalid.setAttribute("aria-describedby", `${id}-error`);
      box.id = `${id}-error`;
      box.textContent = `${form.querySelector(`label[for="${invalid.id}"]`)?.textContent ?? "Field"}: ${invalid.validationMessage}`;
      box.hidden = false;
      invalid.focus();
      return;
    }
    const button = form.querySelector("[type=submit]");
    if (button) button.disabled = true;
    try {
      await handler(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      box.id = `${id}-error`;
      box.textContent = err.message;
      box.hidden = false;
      box.tabIndex = -1;
      box.focus();
    } finally {
      if (button) button.disabled = false;
    }
  });
}
const schoolMark = () =>
  `<span class="wordmark"><strong>Star of the Sea</strong><span>HIGH SCHOOL, INC.</span></span>`;
const publicNav = [
  ["/", "Home"],
  ["/about", "About"],
  ["/academics", "Academics"],
  ["/admissions", "Admissions"],
  ["/news", "News"],
  ["/contact", "Contact"],
];
function publicShell(content) {
  return `<div class="proposal-bar"><span>Independent website proposal · Provisional branding</span><span>Designed by <strong>P2 Digital Works</strong></span></div><header class="public-header"><a href="#/" class="brand" aria-label="Star of the Sea High School home">${schoolMark()}</a><button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="public-nav">${icon("menu")}</button><nav id="public-nav" aria-label="Main navigation">${publicNav.map(([p, t]) => `<a href="#${p}" ${route === p ? 'aria-current="page"' : ""}>${t}</a>`).join("")}${link("/portal", `School portal ${icon("arrow", 16)}`, "button compact")}</nav></header><main id="main" tabindex="-1">${content}</main><footer class="public-footer"><div>${schoolMark()}<p>Tukuran, Zamboanga del Sur, Philippines</p></div><div><p>A proposed digital campus by P2 Digital Works.</p><p>Not an official school website or school endorsement.<br>All portal records and example announcements are fictional.</p><a href="#/proposal">Demo scope &amp; readiness</a></div><div><p>School ID 404868</p><a href="https://www.deped.gov.ph/wp-content/uploads/ESC-Participating-School.pdf" target="_blank" rel="noopener">View DepEd source ${icon("arrow", 14)}</a><p>Colors and typography are provisional.</p></div></footer>`;
}
function home() {
  return `<section class="hero"><div class="hero-copy"><h1>A place to learn,<br>grow, and find<br><em>your way.</em></h1><p>Star of the Sea High School, Inc.<br>A proposed digital home for a school community in Tukuran, Zamboanga del Sur.</p><div class="actions">${link("/admissions", `Explore admissions ${icon("arrow")}`, "button gold")}${link("/about", "Discover the school", "text-link light")}</div><p class="hero-note">Illustrative headline and copy · subject to school approval</p></div><figure class="hero-image"><img src="./assets/ocean.jpg" alt="Sunlight falling across blue ocean waves" fetchpriority="high"><figcaption>Illustrative ocean photograph · not a school or campus image</figcaption></figure></section><div class="quick-links"><a href="#/academics"><div><small>For learners &amp; families</small><strong>Explore academics</strong></div>${icon("arrow")}</a><a href="#/admissions"><div><small>Plan your next step</small><strong>Admissions guide</strong></div>${icon("arrow")}</a><a href="#/portal"><div><small>For the school community</small><strong>Try the campus portal</strong></div>${icon("arrow")}</a></div><section class="welcome section-wrap"><div><h2>A school community.<br>A more connected campus.</h2><p>This proposal brings the public school website and everyday school administration into one clear, accessible experience.</p>${link("/about", `Meet the proposed experience ${icon("arrow", 18)}`, "text-link")}</div><div class="welcome-note"><h3>Rooted in Tukuran.<br>Ready for the next chapter.</h3><p>Public DepEd records identify Star of the Sea High School in Tukuran, Zamboanga del Sur, under School ID 404868.</p><p>The school’s history, mission, official imagery and current offerings will be added with its approval.</p>${badge("School content pending approval")}</div></section><section class="academic-home section-wrap"><div class="section-top"><h2>Room to discover.<br>Space to grow.</h2><p>A clear way for families to explore the school’s learning pathways. Current offerings and details require school confirmation.</p></div><div class="pathways"><a href="#/academics"><span>Junior high school</span><h3>Build a strong foundation.</h3><p>Preview how Grade 7–10 information could be organized for learners and families.</p><span class="text-link">View the academic preview ${icon("arrow")}</span></a><a href="#/academics"><span>Senior high school</span><h3>Look toward what’s next.</h3><p>Preview a space for Grade 11–12 information, with strands and requirements to be confirmed.</p><span class="text-link">View the academic preview ${icon("arrow")}</span></a></div></section><section class="portal-invite section-wrap"><div><h2>The school office,<br>connected.</h2><p>One fictional learner. One connected journey.<br>Explore records, grades, payments and gate attendance in a working demonstration.</p>${link("/portal", `Open the interactive demo ${icon("arrow")}`, "button gold")}</div><div class="journey"><div><span>Registrar</span><strong>Create a student record</strong></div><div><span>Teacher &amp; cashier</span><strong>Record grades and payments</strong></div><div><span>Gate &amp; administration</span><strong>Log entry, review reports</strong></div><p>Fictional data only · saved in this browser</p></div></section><section class="section-wrap home-news"><div class="section-top"><h2>A window into school life.</h2>${link("/news", `All sample updates ${icon("arrow")}`, "text-link")}</div><div class="news-list">${newsItems
    .slice(0, 2)
    .map(
      (n) =>
        `<a href="#/news/${n.id}"><div>${badge("Fictional example")}<span>${n.category}</span></div><h3>${n.title}</h3><p>${n.short}</p><span class="text-link">Read example ${icon("arrow", 18)}</span></a>`,
    )
    .join("")}</div></section>`;
}
const newsItems = [
  {
    id: "welcome",
    category: "Community",
    title: "A new space for school updates",
    short:
      "A sample announcement showing how school news could reach families.",
    body: "This fictional announcement demonstrates a simple, readable home for school updates. Approved articles could include important dates, learner activities and messages from the school. No event, date or school announcement is asserted here.",
  },
  {
    id: "admissions",
    category: "Admissions",
    title: "Getting ready for your next chapter",
    short:
      "An illustrative guide to finding admissions information in one place.",
    body: "This example shows how families could find a school-approved admissions guide. Enrollment dates, eligibility, fees and documentary requirements must be provided and approved by the school before publication.",
  },
  {
    id: "campus",
    category: "Campus life",
    title: "Celebrating learning, together",
    short: "A placeholder for authorized stories from the school community.",
    body: "This is fictional editorial content, not a report of an actual activity. The production website can feature school-approved stories and photographs, with the necessary permissions.",
  },
];
const pageHead = (title, description) =>
  `<section class="page-head section-wrap"><h1>${title}</h1><p>${description}</p></section>`;
function about() {
  return (
    pageHead(
      "A home for the school’s story.",
      "Star of the Sea High School, Inc. · Tukuran, Zamboanga del Sur",
    ) +
    `<section class="section-wrap reading-layout"><div><h2>Introduce the school with confidence.</h2><p>This proposed website gives families a welcoming place to discover the school and helps the administration keep information easy to find.</p><h3>The story belongs to the school.</h3><p>Its history, mission and vision deserve the institution’s own words. This preview reserves space for approved content rather than inventing a school identity.</p><div class="content-placeholder"><h3>School profile</h3><p>History, mission, vision and leadership information will appear here after school review.</p>${badge("Awaiting official content")}</div></div><aside class="facts-panel"><h3>Public record</h3><dl><dt>Institution</dt><dd>Star of the Sea High School, Inc.</dd><dt>Location</dt><dd>Tukuran, Zamboanga del Sur</dd><dt>DepEd ID</dt><dd>404868</dd></dl><a href="https://www.deped.gov.ph/wp-content/uploads/Participating-School-in-SHSVP.pdf" target="_blank" rel="noopener">View the DepEd listing</a><p class="muted">Listing verifies identity and location; current programs require school confirmation.</p></aside></section>`
  );
}
function academics() {
  return (
    pageHead(
      "A clearer view of learning.",
      "Proposed academic information layout · details to be confirmed by the school",
    ) +
    `<section class="section-wrap"><div class="info-banner">${icon("book")}<p>Grade groupings below demonstrate the website structure. They are not confirmation of current offerings, strands or enrollment availability.</p></div><div class="academic-detail"><article><h2>Junior high school</h2><p>Grades 7–10 · illustrative grouping</p><p>A dedicated page can help families understand the curriculum, learner support and progression through junior high school.</p><details><summary>What this page can include</summary><p>School-approved curriculum overview, subjects, learner support, academic calendar and enrollment guidance.</p></details></article><article><h2>Senior high school</h2><p>Grades 11–12 · illustrative grouping</p><p>A space to explain confirmed senior high school pathways and help learners make informed choices.</p><details><summary>Strands and requirements</summary><p>Current strands, subject lists, eligibility and fees have not been supplied. These details require school confirmation.</p></details></article></div>${link("/admissions", `Explore the sample admissions guide ${icon("arrow")}`, "button")}</section>`
  );
}
function admissions() {
  const checks = [
    "Review the school-approved program information",
    "Ask the school about requirements and eligibility",
    "Prepare the documents confirmed by the school",
    "Complete the school’s approved enrollment process",
  ];
  return (
    pageHead(
      "Your next chapter starts here.",
      "An illustrative admissions journey for families, subject to school review.",
    ) +
    `<section class="section-wrap reading-layout"><div><h2>Take it one step at a time.</h2><p>No admissions are open or accepted through this demo. Dates, fees, requirements and available places must be confirmed directly with the school.</p><ol class="admissions-steps">${checks.map((c, i) => `<li><span>${i + 1}</span><div><h3>${c}</h3><p>${["Discover the proposed academic pages.", "Official contact information will be supplied by the school.", "This demo does not prescribe official documentary requirements.", "No application or personal document is collected here."][i]}</p></div></li>`).join("")}</ol></div><aside class="checklist-panel"><h3>Your planning checklist</h3><p>Try this interactive sample. Nothing is sent or stored.</p>${checks.map((c, i) => `<label class="check-row"><input type="checkbox" class="admission-check">${e(c)}</label>`).join("")}<p id="check-count" role="status">0 of 4 steps checked</p><button class="button secondary" id="download-checklist">${icon("download")} Download sample checklist</button></aside></section>`
  );
}
function news(detail) {
  if (detail) {
    const n = newsItems.find((x) => x.id === detail);
    if (!n) return notFound();
    return (
      pageHead(
        n.title,
        "Fictional example · not an official school announcement",
      ) +
      `<article class="section-wrap article"><p>${n.body}</p>${link("/news", "Back to sample updates", "text-link")}</article>`
    );
  }
  return (
    pageHead(
      "News &amp; community.",
      "Example editorial content · no actual school announcements or events are published here.",
    ) +
    `<section class="section-wrap"><div class="filter-row"><label for="news-filter">Category</label>${select("news-filter", ["All updates", "Community", "Admissions", "Campus life"])}</div><div class="news-list" id="news-results">${newsItems.map((n) => newsCard(n)).join("")}</div></section>`
  );
}
const newsCard = (n) =>
  `<a href="#/news/${n.id}"><div>${badge("Fictional example")}<span>${e(n.category)}</span></div><h2>${n.title}</h2><p>${n.short}</p><span class="text-link">Read example ${icon("arrow", 18)}</span></a>`;
function contact() {
  return (
    pageHead(
      "Let’s make the next step clear.",
      "School contact details will be published after verification and approval.",
    ) +
    `<section class="section-wrap reading-layout"><div><h2>Visit the school.</h2><p>Tukuran, Zamboanga del Sur, Philippines</p><p>A precise campus address, telephone number, school email and office hours have not been verified for this proposal.</p><div class="content-placeholder"><h3>Official contact details</h3><p>Awaiting school-supplied information. This demo does not provide a working school inquiry channel.</p></div>${link("/proposal", "About this proposal", "text-link")}</div><form id="contact-form" class="panel form-panel" novalidate><h2>Try an inquiry preview.</h2><p>Use fictional details only. This form shows a local preview and sends no message.</p>${errorBox()}${field("Fictional name", "contact-name", input("contact-name", "text", "Demo visitor", 'required maxlength="80" autocomplete="off"'))}${field("Example message", "contact-message", '<textarea id="contact-message" name="message" rows="4" required maxlength="500">I would like to learn about the proposed school website.</textarea>')}<button class="button" type="submit">Preview inquiry ${icon("arrow")}</button><div id="inquiry-preview" hidden role="status"></div></form></section>`
  );
}
function proposal() {
  return (
    pageHead(
      "A proposal you can explore.",
      "P2 Digital Works · independent demonstration, not a school-endorsed service",
    ) +
    `<section class="section-wrap reading-layout"><div><h2>Working in this MVP</h2><ul class="plain-list"><li>Responsive public website and interactive browser-local portal</li><li>Fictional student registration, editing, archive and restore</li><li>Configurable demo grade calculation and review states</li><li>Sample payment recording, linked balances and balanced journal</li><li>QR generation, camera decoding where supported, manual gate entry/exit</li><li>CSV reports and printable internal student summary</li></ul><h2>Before an operational pilot</h2><p>School-approved identity and content, real authentication and server-enforced permissions, a secure database, audit controls, backups, school policies, validation with school staff, and privacy review are required.</p><h3>Ownership discussion</h3><p>A perpetual school license can be discussed with P2 Digital Works. Source-code ownership, hosting, domain renewals, maintenance and support require a separate written agreement. No price or commercial commitment is made by this demo.</p></div><aside class="facts-panel"><h3>Demonstration boundaries</h3><p>No real enrollment, payment processing, official receipt, class attendance or official school-form issuance.</p><p>Browser-local records are editable and visible to anyone using this browser profile. The demo entry screen is not secure authentication.</p><p>Internal summaries are not official DepEd forms or substitutes for LIS records.</p>${link("/portal", `Explore the demo ${icon("arrow")}`, "button")}</aside></section>`
  );
}
const portalLinks = [
  ["dashboard", "grid", "Overview"],
  ["students", "users", "Student records"],
  ["grades", "book", "Grading"],
  ["payments", "wallet", "Payments"],
  ["journal", "file", "Accounting journal"],
  ["attendance", "scan", "Gate attendance"],
  ["reports", "chart", "Reports & forms"],
];
function portalShell(content) {
  const area = route.split("/")[2] ?? "dashboard";
  return `<div class="portal-layout"><aside class="sidebar"><a href="#/" class="brand">${schoolMark()}</a><div class="portal-name">Campus portal <span>DEMO</span></div><nav aria-label="Portal navigation">${portalLinks.map(([p, i, t]) => `<a href="#/portal/${p}" ${area === p ? 'aria-current="page"' : ""}>${icon(i)}<span>${t}</span></a>`).join("")}</nav><div class="sidebar-bottom"><a href="#/">${icon("home")} Public website</a><button id="leave-demo">${icon("logout")} Leave demo</button><p>Proposed by<br><strong>P2 Digital Works</strong></p></div></aside><div class="portal-main"><div class="demo-ribbon">${icon("shield", 17)}<span><strong>Fictional demo data only.</strong> Saved in this browser. Do not enter real student or financial information.</span><button id="reset-demo">Reset demo</button></div><header class="portal-top"><span>Star of the Sea High School, Inc.</span><span class="demo-user"><span class="avatar small">DA</span>Demo administrator</span></header>${store.warning ? `<div class="storage-warning" role="alert">${e(store.warning)} <button id="reload-demo">Reload demo</button></div>` : ""}<main id="main" class="portal-content" tabindex="-1">${content}</main><footer class="portal-footer">P2 Digital Works · Pitch MVP · Provisional design<span>Not connected to school systems</span></footer></div></div>`;
}
function portalHeading(title, description, action = "") {
  return `<div class="portal-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}
function login() {
  return `<section class="login section-wrap"><div class="login-story"><h1>One school.<br>A connected<br><em>everyday.</em></h1><p>Explore how a digital campus could bring the school office, classroom and gate together.</p><div class="login-flow"><span>Student records</span>${icon("arrow")}<span>Grades &amp; payments</span>${icon("arrow")}<span>Reports</span></div><p class="muted">A working pitch by P2 Digital Works.</p></div><form id="enter-form" class="panel login-panel" novalidate>${badge("DEMONSTRATION ACCESS")}<h2>Enter the school portal demo.</h2><p>No password is needed. This entry screen is an acknowledgment, not secure authentication.</p><div class="info-banner"><p>All names, balances, grades and events are fictional. Changes stay in this browser and can be reset.</p></div>${errorBox()}<label class="check-row"><input type="checkbox" id="acknowledge" name="acknowledge" required>I understand this is a demo and will use fictional data only.</label><button type="submit" class="button wide">Enter demo portal ${icon("arrow")}</button><p class="muted">Demo administrator · all modules available for the pitch</p>${link("/proposal", "Read scope and production requirements", "text-link")}</form></section>`;
}
function dashboard() {
  const m = summary(state);
  return (
    portalHeading(
      "School overview",
      "Sample school year 2026–2027 · All figures are fictional",
      link(
        "/portal/students/new",
        `${icon("plus")} Add demo student`,
        "button",
      ),
    ) +
    `<div class="stats-grid">${[
      ["Active students", m.students, "Fictional learner records", "users"],
      [
        "Recorded collections",
        money(m.collected),
        "Sample payments only",
        "wallet",
      ],
      [
        "Currently inside",
        m.inside,
        "Gate status, not class attendance",
        "scan",
      ],
      ["Grades for review", m.review, "Demonstration workflow", "book"],
    ]
      .map(
        ([t, v, n, i]) =>
          `<div class="stat"><div><span>${t}</span>${icon(i)}</div><strong>${v}</strong><small>${n}</small></div>`,
      )
      .join(
        "",
      )}</div><div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h2>A connected school day</h2>${badge("Try the workflow")}</div><ol class="workflow-list">${[
      [
        "students",
        "Register a fictional learner",
        "Create a profile and assign a sample grade and section.",
      ],
      [
        "grades",
        "Record a grade",
        "Set scores and weights, then mark it for review.",
      ],
      [
        "payments",
        "Record a sample payment",
        "Watch the balance, journal and reports update.",
      ],
      [
        "attendance",
        "Log a gate event",
        "Use a demo QR or student ID to record entry or exit.",
      ],
    ]
      .map(
        ([p, t, d], i) =>
          `<li><span class="step-dot">${i + 1}</span><div><a href="#/portal/${p}">${t}</a><p>${d}</p></div>${icon("chevron", 16)}</li>`,
      )
      .join(
        "",
      )}</ol></section><section class="panel"><div class="panel-heading"><h2>At a glance</h2>${link("/portal/reports", "View reports", "text-link")}</div><dl class="summary-list"><div><dt>Outstanding sample balance</dt><dd>${money(m.outstanding)}</dd></div><div><dt>Gate events recorded</dt><dd>${state.gate.length}</dd></div><div><dt>Sample journal status</dt><dd>${badge("Balanced", "success")}</dd></div></dl><div class="quiet-note"><h3>Built for the conversation.</h3><p>These eight starting records are fictional. This dashboard makes no claims about the school’s actual enrollment or collections.</p></div></section></div><section class="panel"><div class="panel-heading"><h2>Recent sample payments</h2>${link("/portal/payments", "Record a payment", "text-link")}</div>${paymentTable(state.payments.slice(-4).reverse())}</section>`
  );
}
function studentRows(list) {
  return list.map((s) => [
    `<div class="student-name"><span class="avatar">${e(
      s.name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join(""),
    )}</span><div><a href="#/portal/students/${s.id}">${e(s.name)}</a><small>${s.id} · fictional</small></div></div>`,
    e(s.level),
    e(s.section),
    money(balance(state, s.id)),
    badge(s.archived ? "Archived" : "Active", s.archived ? "" : "success"),
    link(`/portal/students/${s.id}`, "View record", "table-link"),
  ]);
}
function studentsPage() {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  const q = params.get("q") ?? "",
    level = params.get("level") ?? "All grades",
    status = params.get("status") ?? "Active";
  const filtered = filterStudents(q, level, status);
  return (
    portalHeading(
      "Student records",
      "Fictional learners shared across every demonstration module.",
      link(
        "/portal/students/new",
        `${icon("plus")} Add demo student`,
        "button",
      ),
    ) +
    `<section class="panel"><div class="table-toolbar"><div class="search-box"><label for="student-search" class="sr-only">Search demo students</label>${icon("search", 18)}<input type="search" id="student-search" value="${e(q)}" placeholder="Search name or demo ID"><button id="clear-search" class="text-link" ${q ? "" : "hidden"}>Clear</button></div><div class="filter-row"><label for="grade-filter">Grade</label>${select("grade-filter", ["All grades", ...LEVELS], level)}<label for="status-filter">Status</label>${select("status-filter", ["Active", "Archived", "All records"], status)}</div></div><div id="students-table">${table(["Student", "Grade", "Section", "Balance", "Status", "Action"], studentRows(filtered), "No students match these filters. Clear search or change the filters.")}</div><p class="table-count" id="student-count">${filtered.length} demo records</p></section>`
  );
}
function filterStudents(q, level, status) {
  return state.students.filter(
    (s) =>
      (status === "All records" || s.archived === (status === "Archived")) &&
      (level === "All grades" || s.level === level) &&
      `${s.name} ${s.id}`.toLowerCase().includes(q.toLowerCase()),
  );
}
function studentForm(id) {
  const s = id ? student(id) : null;
  if (id && !s) return notFound();
  return (
    portalHeading(
      s ? "Edit demo student" : "Add a demo student",
      "Use a fictional name only. Do not enter personal information.",
    ) +
    `<form class="panel form-panel max-form" id="student-form" novalidate>${errorBox()}<div class="form-grid">${field("Fictional full name", "name", input("name", "text", s?.name ?? "", 'required maxlength="80" autocomplete="off"'))}${field("Grade level", "level", select("level", LEVELS, s?.level ?? "Grade 7", "required"))}${field("Demo section", "section", input("section", "text", s?.section ?? "Demo Pearl", 'required maxlength="40"'))}${s ? "" : field("Sample assessed fees (PHP)", "fee", input("fee", "text", "18000", 'required inputmode="decimal" aria-describedby="fee-help"'), "Illustrative amount only; not the school’s tuition.")}</div><div class="form-actions"><button class="button" type="submit">${s ? "Save demo student" : "Create demo student"}</button>${link(s ? `/portal/students/${id}` : "/portal/students", "Cancel", "button secondary")}</div></form>`
  );
}
function studentDetail(id) {
  const s = student(id);
  if (!s) return notFound();
  return (
    portalHeading(
      e(s.name),
      `${s.id} · Fictional student · ${e(s.level)} / ${e(s.section)}`,
      link(
        `/portal/students/${id}/edit`,
        "Edit demo student",
        "button secondary",
      ),
    ) +
    `<div class="detail-grid"><section class="panel"><div class="panel-heading"><h2>Student summary</h2>${badge(s.archived ? "Archived" : "Active", s.archived ? "" : "success")}</div><dl class="summary-list"><div><dt>Sample assessed fees</dt><dd>${money(s.fee)}</dd></div><div><dt>Sample payments</dt><dd>${money(s.fee - balance(state, id))}</dd></div><div><dt>Outstanding balance</dt><dd>${money(balance(state, id))}</dd></div></dl><div class="actions">${s.archived ? '<p class="muted">Restore this demo student before recording payments or grades.</p>' : link(`/portal/payments?student=${id}`, "Record payment", "button") + link(`/portal/grades?student=${id}`, "Enter grades", "button secondary")}</div><button class="text-link archive-action" data-id="${id}" data-archived="${s.archived}">${s.archived ? "Restore demo student" : "Archive demo student"}</button><p class="muted">Archiving retains linked records. You can restore this fictional student at any time.</p></section><section class="panel qr-panel"><h2>Demo gate pass</h2><canvas id="profile-qr" aria-label="Demo QR gate pass" role="img"></canvas><p>${s.id}</p><p class="muted">QR contains only a demo ID.<br>It is not a secure identity credential.</p><button id="download-qr" class="button secondary">${icon("download")} Download QR</button></section></div><section class="panel"><div class="panel-heading"><h2>Academic records</h2>${link(`/portal/reports?student=${id}`, "Preview internal summary", "text-link")}</div>${gradeTable(state.grades.filter((g) => g.studentId === id))}</section><section class="panel"><div class="panel-heading"><h2>Sample payment history</h2></div>${paymentTable(state.payments.filter((p) => p.studentId === id).reverse())}</section>`
  );
}
const paymentTable = (rows) =>
  table(
    ["Reference", "Fictional student", "Amount", "Method", "Recorded (Manila)"],
    rows.map((p) => [
      e(p.reference),
      e(student(p.studentId)?.name),
      money(p.amount),
      e(p.method),
      stamp(p.time),
    ]),
    "No sample payments recorded.",
  );
const gradeTable = (rows) =>
  table(
    ["Fictional student", "Subject", "Calculated grade", "Status"],
    rows.map((g) => [
      e(student(g.studentId)?.name),
      e(g.subject),
      g.result.toFixed(2),
      badge(g.status, g.status === "Published" ? "success" : ""),
    ]),
    "No demo grades recorded.",
  );
function grades() {
  const id = requestedActive();
  return (
    portalHeading(
      "Grading",
      "Configurable demonstration formula · not the school’s grading policy",
    ) +
    `<div class="info-banner">${icon("book")}<p>Scores are percentages. The three editable weights must total 100%. Results are a simple weighted average, with no official transmutation. Re-saving a learner and subject replaces its demo grade.</p></div><form class="panel form-panel" id="grade-form" novalidate>${errorBox()}<div class="form-grid three">${field("Demo student", "studentId", studentSelect("studentId", id))}${field("Subject", "subject", select("subject", ["English", "Mathematics", "Science", "Filipino"]))}${field("Review status", "status", select("status", ["Draft", "For review", "Published"]))}</div><div class="grade-scores">${["Written work", "Performance tasks", "Assessment"].map((t, i) => `<fieldset><legend>${t}</legend>${field("Score (%)", `score${i}`, input(`score${i}`, "number", 85 + i * 2, 'required min="0" max="100" step="0.01"'))}${field("Weight (%)", `weight${i}`, input(`weight${i}`, "number", [30, 50, 20][i], 'required min="0" max="100" step="0.01"'))}</fieldset>`).join("")}</div><div class="form-actions"><p id="grade-preview" role="status">Calculated demo grade: 86.80 · Total weight: 100%</p><button class="button" type="submit">Save demo grade</button></div></form><section class="panel"><div class="panel-heading"><h2>Grade register</h2>${badge("Fictional academic records")}</div>${gradeTable(state.grades)}</section>`
  );
}
function payments() {
  const id = requestedActive();
  return (
    portalHeading(
      "Payment recording",
      "Record sample collections. No money is collected or transferred.",
    ) +
    `<div class="detail-grid"><form class="panel form-panel" id="payment-form" novalidate><h2>Record a sample payment</h2>${errorBox()}${field("Demo student", "studentId", studentSelect("studentId", id))}<p class="balance-line" id="payment-balance">Outstanding sample balance <strong>${id ? money(balance(state, id)) : money(0)}</strong></p><div class="form-grid">${field("Amount (PHP)", "amount", input("amount", "text", "", 'required inputmode="decimal" placeholder="e.g. 1,000 without commas"'))}${field("Method", "method", select("method", ["Cash", "Bank transfer"]))}</div>${field("Unique sample reference", "reference", input("reference", "text", "", 'required maxlength="40" placeholder="e.g. DEMO-PITCH-001"'))}<button class="button" type="submit">Record sample payment ${icon("check")}</button></form><aside class="panel payment-note"><h2>One entry. Connected records.</h2><p>Recording a sample payment updates the learner’s outstanding balance, the collection report and a balanced demonstration journal entry.</p><dl class="summary-list"><div><dt>Debit</dt><dd>Cash / Bank</dd></div><div><dt>Credit</dt><dd>Student receivable</dd></div></dl><p class="muted">These are illustrative accounting entries. Payment records are not official receipts and cannot be used for school transactions.</p>${link("/portal/journal", `View accounting journal ${icon("arrow")}`, "text-link")}</aside></div><section class="panel"><div class="panel-heading"><h2>Sample payment register</h2>${badge(`${state.payments.length} records`)}</div>${paymentTable([...state.payments].reverse())}</section>`
  );
}
function journal() {
  return (
    portalHeading(
      "Accounting journal",
      "Illustrative double-entry records generated by sample payments.",
    ) +
    `<section class="panel"><div class="panel-heading"><h2>Sample collections journal</h2>${badge("Debits equal credits", "success")}</div>${table(
      [
        "Reference",
        "Fictional student",
        "Debit · Cash / Bank",
        "Credit · Receivable",
      ],
      state.payments.map((p) => [
        e(p.reference),
        e(student(p.studentId)?.name),
        money(p.debit),
        money(p.credit),
      ]),
    )}<div class="journal-total"><span>Demonstration total</span><strong>${money(summary(state).collected)} debit</strong><strong>${money(summary(state).collected)} credit</strong></div></section><section class="panel"><div class="panel-heading"><h2>Local demonstration activity</h2></div>${table(
      ["Action", "Demo actor", "Time (Manila)"],
      state.audit
        .slice(0, 20)
        .map((a) => [e(a.action), e(a.actor), stamp(a.time)]),
      "No changes yet. Create a record to see the local activity trail.",
    )}<p class="panel-footnote">Browser-local history is editable and resettable. It is not a tamper-proof production audit log.</p></section>`
  );
}
function attendance() {
  const first = activeStudents()[0]?.id;
  return (
    portalHeading(
      "QR gate attendance",
      "Campus entry and exit only. This does not establish official class attendance.",
    ) +
    `<div class="attendance-grid"><form class="panel form-panel" id="gate-form" novalidate><h2>Record a gate event</h2>${errorBox()}${field("Demo QR payload or student ID", "gate-code", input("gate-code", "text", first ?? "", 'required autocomplete="off" placeholder="DEMO-1001"'), "Use a QR scanner keyboard, camera, or type a demo ID.")}${field("Direction", "direction", select("direction", ["Entry", "Exit"]))}<p class="muted">Timestamp is recorded at save, in Asia/Manila time.</p><button class="button" type="submit">Record gate event ${icon("check")}</button><div class="camera-tools"><button type="button" id="start-camera" class="button secondary">${icon("scan")} Start camera scanner</button><button type="button" id="stop-camera" class="text-link" hidden>Stop camera</button></div><p id="camera-status" role="status">Camera is off. Manual entry works without camera access.</p><video id="scanner-video" muted playsinline hidden aria-label="Camera QR preview"></video><canvas id="scan-buffer" hidden></canvas></form><section class="panel qr-panel"><h2>Try a demo gate pass</h2>${field("Fictional student", "qr-student", studentSelect("qr-student", first))}<canvas id="attendance-qr" role="img" aria-label="Scannable QR for selected fictional student"></canvas><p id="qr-label">${first ?? "No active students"}</p><button id="use-qr-id" class="button secondary">Use selected demo ID</button><p class="muted">Scan from another screen or use the ID directly. A QR alone is not proof of identity.</p></section></div><section class="panel"><div class="panel-heading"><h2>Gate event log</h2>${badge(`${summary(state).inside} currently inside`, "success")}</div>${table(
      ["Fictional student", "Direction", "Time (Manila)"],
      [...state.gate]
        .reverse()
        .map((g) => [
          e(student(g.studentId)?.name),
          badge(g.direction, g.direction === "Entry" ? "success" : ""),
          stamp(g.time),
        ]),
      "No demo gate events yet.",
    )}</section>`
  );
}
function reports() {
  const id =
    new URLSearchParams(location.hash.split("?")[1]).get("student") ??
    activeStudents()[0]?.id;
  return (
    portalHeading(
      "Reports &amp; school forms",
      "Export fictional summaries and preview an internal student record.",
    ) +
    `<div class="report-options"><section class="panel form-panel"><h2>Download a demo report</h2>${field("Report type", "report-type", select("report-type", ["Student register", "Collections", "Gate events", "Grades"]))}<button id="export-report" class="button">${icon("download")} Export demo CSV</button><p class="muted">Exports are labeled DEMO. Financial records are sample collections, not official receipts.</p></section><section class="panel form-panel"><h2>Preview an internal summary</h2>${field("Demo student", "report-student", studentSelect("report-student", id, true))}<button id="preview-summary" class="button secondary">${icon("file")} Preview summary</button><p class="muted">This internal layout is not an official DepEd form and does not replace LIS-issued records.</p></section></div><section id="summary-preview" class="panel internal-summary" hidden></section><section class="panel"><div class="panel-heading"><h2>Fictional dataset summary</h2>${badge("Live from demo records")}</div><dl class="report-summary"><div><dt>Active learners</dt><dd>${summary(state).students}</dd></div><div><dt>Sample collections</dt><dd>${money(summary(state).collected)}</dd></div><div><dt>Outstanding sample balances</dt><dd>${money(summary(state).outstanding)}</dd></div></dl></section>`
  );
}
function internalSummary(id) {
  const s = student(id);
  return `<div class="print-watermark">DEMO · FICTIONAL DATA · NOT VALID FOR OFFICIAL USE</div><div class="panel-heading"><div><h2>Internal student summary</h2><p>Star of the Sea High School, Inc. · Proposed layout by P2 Digital Works</p></div><button id="print-summary" class="button secondary">Print / save PDF</button></div><h3>${e(s.name)} · ${s.id}</h3><p>${e(s.level)} · ${e(s.section)} · Sample year 2026–2027</p><p>Outstanding sample balance: <strong>${money(balance(state, id))}</strong></p>${gradeTable(state.grades.filter((g) => g.studentId === id))}<p>Gate events: ${state.gate.filter((g) => g.studentId === id).length}. Gate activity is separate from class attendance.</p><p class="muted">Not an official report card, payment acknowledgment, DepEd school form or LIS substitute. All names and values are fictional.</p>`;
}
function notFound() {
  return (
    pageHead(
      "This page isn’t here.",
      "Choose a page from the navigation to continue.",
    ) +
    `<div class="section-wrap">${link("/", "Return to the homepage", "button")}</div>`
  );
}
function stopCamera() {
  if (scanFrame) cancelAnimationFrame(scanFrame);
  scanFrame = null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}
function getRoute() {
  return (
    (location.hash.slice(1).split("?")[0] || "/").replace(/\/$/, "") || "/"
  );
}
function render(focus = true) {
  stopCamera();
  route = getRoute();
  lastHash = location.hash || "#/";
  dirty = false;
  const portal = route.startsWith("/portal/");
  let content, title;
  if (route === "/portal" || (portal && !entered)) {
    content = publicShell(login());
    title = "Demo portal access";
  } else if (portal) {
    const parts = route.split("/");
    const area = parts[2];
    if (area === "dashboard") content = dashboard();
    else if (area === "students") {
      content =
        parts[3] === "new"
          ? studentForm()
          : parts[3]
            ? parts[4] === "edit"
              ? studentForm(parts[3])
              : studentDetail(parts[3])
            : studentsPage();
    } else
      content = (
        { grades, payments, journal, attendance, reports }[area] ?? notFound
      )();
    title = portalLinks.find((x) => x[0] === area)?.[2] ?? "Page not found";
    content = portalShell(content);
  } else {
    content =
      route === "/"
        ? home()
        : route === "/about"
          ? about()
          : route === "/academics"
            ? academics()
            : route === "/admissions"
              ? admissions()
              : route.startsWith("/news")
                ? news(route.split("/")[2])
                : route === "/contact"
                  ? contact()
                  : route === "/proposal"
                    ? proposal()
                    : notFound();
    title = publicNav.find(([p]) => p === route)?.[1] ?? "Website proposal";
    content = publicShell(content);
  }
  app.innerHTML = content;
  document.title = `${title} · Star of the Sea · P2 demo`;
  bind();
  if (focus) {
    document.querySelector("#main")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}
function download(name, content, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Demo file downloaded.");
}
function qr(canvas, id) {
  if (!canvas) return;
  if (!id) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  QRCode.toCanvas(
    canvas,
    `DEMO-SSHS:${id}`,
    {
      width: 192,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#102b46", light: "#ffffff" },
    },
    (err) => {
      if (err) notify("QR could not be drawn. Use the demo ID instead.");
    },
  );
}
function bind() {
  document.querySelector(".menu-toggle")?.addEventListener("click", (ev) => {
    const b = ev.currentTarget;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    document.querySelector("#public-nav").classList.toggle("open", open);
  });
  bindForm("enter-form", () => {
    entered = true;
    try {
      sessionStorage.setItem("p2-demo-entry", "yes");
    } catch {}
    dirty = false;
    location.hash = "/portal/dashboard";
  });
  document.querySelector("#leave-demo")?.addEventListener("click", async () => {
    if (
      dirty &&
      !(await confirmAction(
        "Leave this unfinished form?",
        "Your unsaved fictional changes will be discarded.",
        "Leave form",
      ))
    )
      return;
    entered = false;
    try {
      sessionStorage.removeItem("p2-demo-entry");
    } catch {}
    dirty = false;
    location.hash = "/portal";
  });
  document.querySelector("#reset-demo")?.addEventListener("click", async () => {
    if (
      await confirmAction(
        "Reset this demo?",
        "This removes all fictional changes saved in this browser and restores the eight starting demo students.",
        "Reset demo",
      )
    ) {
      try {
        commit(
          { ...seed(), revision: state.revision },
          "Fictional demo data reset.",
        );
        render(false);
      } catch (err) {
        notify(err.message);
      }
    }
  });
  document.querySelector("#reload-demo")?.addEventListener("click", () => {
    store = openStore(disk);
    state = store.state;
    render();
  });
  document
    .querySelectorAll(".admission-check")
    .forEach((c) =>
      c.addEventListener(
        "change",
        () =>
          (document.querySelector("#check-count").textContent =
            `${document.querySelectorAll(".admission-check:checked").length} of 4 steps checked`),
      ),
    );
  document
    .querySelector("#download-checklist")
    ?.addEventListener("click", () =>
      download(
        "DEMO-admissions-planning.txt",
        "DEMO — ILLUSTRATIVE CHECKLIST\nNot official school requirements.\n\nReview school-approved program information.\nAsk the school about requirements.\nPrepare confirmed documents.\nComplete the school-approved enrollment process.",
        "text/plain",
      ),
    );
  document.querySelector("#news-filter")?.addEventListener("change", (ev) => {
    document.querySelector("#news-results").innerHTML = newsItems
      .filter(
        (n) =>
          ev.target.value === "All updates" || n.category === ev.target.value,
      )
      .map(newsCard)
      .join("");
  });
  bindForm("contact-form", (data) => {
    const box = document.querySelector("#inquiry-preview");
    box.hidden = false;
    box.innerHTML = `<h3>Local inquiry preview</h3><p><strong>${e(data["contact-name"])}</strong></p><p>${e(data.message)}</p><p>No message was sent. This is a demonstration only.</p>`;
    dirty = false;
    notify("Inquiry preview ready. Nothing was sent.");
  });
  if (document.querySelector("#student-search")) {
    const update = () => {
      const q = document.querySelector("#student-search").value,
        level = document.querySelector("#grade-filter").value,
        status = document.querySelector("#status-filter").value;
      const list = filterStudents(q, level, status);
      document.querySelector("#students-table").innerHTML = table(
        ["Student", "Grade", "Section", "Balance", "Status", "Action"],
        studentRows(list),
        "No students match these filters. Clear search or change the filters.",
      );
      document.querySelector("#student-count").textContent =
        `${list.length} demo records`;
      document.querySelector("#clear-search").hidden = !q;
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (level !== "All grades") params.set("level", level);
      if (status !== "Active") params.set("status", status);
      lastHash = `#/portal/students${params.size ? "?" + params : ""}`;
      history.replaceState(null, "", lastHash);
    };
    document.querySelector("#student-search").addEventListener("input", update);
    document.querySelector("#grade-filter").addEventListener("change", update);
    document.querySelector("#status-filter").addEventListener("change", update);
    document.querySelector("#clear-search").addEventListener("click", () => {
      document.querySelector("#student-search").value = "";
      update();
      document.querySelector("#student-search").focus();
    });
  }
  bindForm("student-form", (data) => {
    const id = route.split("/")[3];
    const editing = route.endsWith("/edit");
    commit(
      editing ? updateStudent(state, id, data) : createStudent(state, data),
      editing ? "Demo student saved." : "Fictional student created.",
    );
    location.hash = editing ? `/portal/students/${id}` : "/portal/students";
  });
  document.querySelector(".archive-action")?.addEventListener("click", (ev) => {
    const { id, archived } = ev.currentTarget.dataset;
    try {
      commit(
        updateStudent(state, id, { archived: archived !== "true" }),
        archived === "true"
          ? "Demo student restored."
          : "Demo student archived. Restore is available here.",
      );
      render(false);
    } catch (err) {
      notify(err.message);
    }
  });
  const profileId = route.split("/")[3];
  qr(document.querySelector("#profile-qr"), profileId);
  document.querySelector("#download-qr")?.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = `DEMO-${profileId}-gate-QR.png`;
    a.href = document.querySelector("#profile-qr").toDataURL();
    a.click();
  });
  const previewGrade = () => {
    const f = document.querySelector("#grade-form");
    const scores = [0, 1, 2].map((i) => Number(f.elements[`score${i}`].value)),
      weights = [0, 1, 2].map((i) => Number(f.elements[`weight${i}`].value));
    const total = weights.reduce((a, x) => a + x, 0);
    document.querySelector("#grade-preview").textContent =
      `Calculated demo grade: ${scores.reduce((a, x, i) => a + (x * weights[i]) / 100, 0).toFixed(2)} · Total weight: ${total}%${total !== 100 ? " (must total 100%)" : ""}`;
  };
  document
    .querySelector("#grade-form")
    ?.addEventListener("input", previewGrade);
  if (document.querySelector("#grade-form")) previewGrade();
  bindForm("grade-form", (data) => {
    commit(
      saveGrade(state, {
        ...data,
        scores: [data.score0, data.score1, data.score2],
        weights: [data.weight0, data.weight1, data.weight2],
      }),
      "Demo grade saved.",
    );
    render(false);
  });
  document
    .querySelector("#payment-form #studentId")
    ?.addEventListener(
      "change",
      (ev) =>
        (document.querySelector("#payment-balance").innerHTML =
          `Outstanding sample balance <strong>${money(balance(state, ev.target.value))}</strong>`),
    );
  bindForm("payment-form", (data) => {
    commit(
      recordPayment(state, data),
      "Sample payment recorded. Balance and journal updated.",
    );
    render(false);
  });
  const qselect = document.querySelector("#qr-student");
  if (qselect) {
    qr(document.querySelector("#attendance-qr"), qselect.value);
    qselect.addEventListener("change", () => {
      qr(document.querySelector("#attendance-qr"), qselect.value);
      document.querySelector("#qr-label").textContent = qselect.value;
    });
    document.querySelector("#use-qr-id").addEventListener("click", () => {
      document.querySelector("#gate-code").value = qselect.value;
      document.querySelector("#gate-code").focus();
    });
  }
  bindForm("gate-form", (data) => {
    const id = data["gate-code"].trim().replace(/^DEMO-SSHS:/, "");
    commit(
      recordGate(state, id, data.direction),
      `${data.direction} recorded for ${id}.`,
    );
    render(false);
  });
  document
    .querySelector("#start-camera")
    ?.addEventListener("click", startCamera);
  document.querySelector("#stop-camera")?.addEventListener("click", () => {
    stopCamera();
    document.querySelector("#scanner-video").hidden = true;
    document.querySelector("#stop-camera").hidden = true;
    document.querySelector("#camera-status").textContent =
      "Camera stopped. You can use a demo ID instead.";
  });
  document.querySelector("#export-report")?.addEventListener("click", () => {
    const type = document.querySelector("#report-type").value;
    let rows;
    if (type === "Student register")
      rows = [
        [
          "DEMO student ID",
          "Fictional name",
          "Grade",
          "Section",
          "Archived",
          "Sample balance PHP",
        ],
        ...state.students.map((s) => [
          s.id,
          s.name,
          s.level,
          s.section,
          s.archived,
          (balance(state, s.id) / 100).toFixed(2),
        ]),
      ];
    if (type === "Collections")
      rows = [
        [
          "DEMO reference",
          "DEMO student ID",
          "Amount PHP",
          "Method",
          "UTC timestamp",
        ],
        ...state.payments.map((p) => [
          p.reference,
          p.studentId,
          (p.amount / 100).toFixed(2),
          p.method,
          p.time,
        ]),
      ];
    if (type === "Gate events")
      rows = [
        [
          "DEMO student ID",
          "Direction (not class attendance)",
          "UTC timestamp",
        ],
        ...state.gate.map((g) => [g.studentId, g.direction, g.time]),
      ];
    if (type === "Grades")
      rows = [
        ["DEMO student ID", "Subject", "Calculated demo grade", "Status"],
        ...state.grades.map((g) => [
          g.studentId,
          g.subject,
          g.result,
          g.status,
        ]),
      ];
    download(
      `DEMO-${type.toLowerCase().replaceAll(" ", "-")}.csv`,
      csv([["DEMO — FICTIONAL DATA — NOT VALID FOR OFFICIAL USE"], ...rows]),
    );
  });
  document.querySelector("#preview-summary")?.addEventListener("click", () => {
    if (!student(document.querySelector("#report-student").value)) {
      notify("Choose a fictional student to preview.");
      return;
    }
    const box = document.querySelector("#summary-preview");
    box.hidden = false;
    box.innerHTML = internalSummary(
      document.querySelector("#report-student").value,
    );
    document
      .querySelector("#print-summary")
      .addEventListener("click", () => window.print());
    box.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  });
}
async function startCamera() {
  const status = document.querySelector("#camera-status"),
    button = document.querySelector("#start-camera");
  button.disabled = true;
  status.textContent = "Requesting camera access…";
  const captureRoute = route;
  try {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error(
        "Camera access is unavailable in this browser. Use a demo ID or scanner keyboard.",
      );
    const acquired = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    if (route !== captureRoute) {
      acquired.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = acquired;
    const video = document.querySelector("#scanner-video"),
      buffer = document.querySelector("#scan-buffer");
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    document.querySelector("#stop-camera").hidden = false;
    status.textContent =
      "Point the camera at a demo QR. Detection fills the ID; review and record the event.";
    const loop = () => {
      if (!stream) return;
      if (video.readyState >= 2) {
        buffer.width = video.videoWidth;
        buffer.height = video.videoHeight;
        const ctx = buffer.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0);
        const frame = ctx.getImageData(0, 0, buffer.width, buffer.height),
          code = jsQR(frame.data, frame.width, frame.height);
        if (code && /^DEMO-SSHS:DEMO-\d+$/.test(code.data)) {
          document.querySelector("#gate-code").value = code.data;
          status.textContent =
            "Demo QR detected. Review the direction, then record the gate event.";
          stopCamera();
          video.hidden = true;
          document.querySelector("#stop-camera").hidden = true;
          return;
        }
      }
      scanFrame = requestAnimationFrame(loop);
    };
    loop();
  } catch (err) {
    stopCamera();
    if (route === captureRoute)
      status.textContent =
        err.name === "NotAllowedError"
          ? "Camera permission was not granted. Type a demo ID or use a scanner keyboard."
          : err.message;
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}
document.querySelector(".skip-link").addEventListener("click", (ev) => {
  ev.preventDefault();
  document.querySelector("#main")?.focus();
});
window.addEventListener("beforeunload", (ev) => {
  if (dirty) {
    ev.preventDefault();
    ev.returnValue = "";
  }
});
window.addEventListener("storage", (ev) => {
  if (ev.key === "p2-sshs-fictional-demo-v1") {
    store.warning =
      "Another tab changed this demo. Reload before saving to avoid overwriting changes.";
    const existing = document.querySelector(".storage-warning");
    if (existing) existing.textContent = store.warning;
    else {
      const el = document.createElement("div");
      el.className = "storage-warning";
      el.setAttribute("role", "alert");
      el.textContent = store.warning;
      document.querySelector(".portal-top")?.after(el);
    }
  }
});
window.addEventListener("hashchange", async () => {
  if (navigationPending) {
    history.replaceState(null, "", lastHash);
    return;
  }
  if (dirty) {
    navigationPending = true;
    const target = location.hash;
    history.replaceState(null, "", lastHash);
    const proceed = await confirmAction(
      "Leave this unfinished form?",
      "Your unsaved fictional changes will be discarded.",
      "Leave form",
    );
    navigationPending = false;
    if (proceed) {
      dirty = false;
      history.pushState(null, "", target);
      render();
    }
  } else render();
});
window.addEventListener("pagehide", stopCamera);
render(false);
