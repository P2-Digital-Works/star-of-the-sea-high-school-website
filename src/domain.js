export const LEVELS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];
export function seed() {
  return {
    version: 1,
    revision: 0,
    students: [
      "Amara Santos",
      "Luca Reyes",
      "Isla Mendoza",
      "Mateo Cruz",
      "Sofia Dela Peña",
      "Eli Navarro",
      "Mia Ramos",
      "Noah Garcia",
    ].map((name, i) => ({
      id: `DEMO-${1001 + i}`,
      name,
      level: LEVELS[i % 6],
      section: ["Demo Pearl", "Demo Coral", "Demo Harbor"][i % 3],
      fee: 1800000,
      archived: false,
    })),
    payments: [
      {
        id: "DEMO-P001",
        studentId: "DEMO-1001",
        amount: 500000,
        reference: "SAMPLE-001",
        method: "Cash",
        debit: 500000,
        credit: 500000,
        time: "2026-11-02T01:15:00Z",
      },
      {
        id: "DEMO-P002",
        studentId: "DEMO-1002",
        amount: 300000,
        reference: "SAMPLE-002",
        method: "Bank transfer",
        debit: 300000,
        credit: 300000,
        time: "2026-11-02T02:30:00Z",
      },
    ],
    grades: [
      {
        studentId: "DEMO-1001",
        subject: "English",
        scores: [85, 88, 90],
        weights: [30, 50, 20],
        result: 87.5,
        status: "For review",
      },
      {
        studentId: "DEMO-1002",
        subject: "Mathematics",
        scores: [90, 85, 92],
        weights: [30, 50, 20],
        result: 87.9,
        status: "Draft",
      },
    ],
    gate: [
      {
        studentId: "DEMO-1001",
        direction: "Entry",
        time: "2026-11-03T00:00:00Z",
      },
      {
        studentId: "DEMO-1002",
        direction: "Entry",
        time: "2026-11-03T00:05:00Z",
      },
    ],
    audit: [],
  };
}
const copy = (s) => structuredClone(s);
const person = (s, id) => {
  const p = s.students.find((x) => x.id === id);
  if (!p) throw Error("Select an existing demo student.");
  return p;
};
const active = (s, id) => {
  const p = person(s, id);
  if (p.archived)
    throw Error("Restore this archived demo student before adding records.");
  return p;
};
const text = (v, label, max = 80) => {
  v = String(v ?? "").trim();
  if (!v || v.length > max)
    throw Error(`${label} is required and must be ${max} characters or fewer.`);
  return v;
};
export function cents(value) {
  const v = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(v))
    throw Error("Enter a valid amount with at most two decimal places.");
  const n = Math.round(Number(v) * 100);
  if (!Number.isSafeInteger(n) || n > 100000000)
    throw Error("Amount exceeds the demonstration limit.");
  return n;
}
export function balance(s, id) {
  const p = person(s, id);
  return (
    p.fee -
    s.payments
      .filter((x) => x.studentId === id)
      .reduce((a, x) => a + x.amount, 0)
  );
}
function log(s, action) {
  s.audit.unshift({
    action,
    time: new Date().toISOString(),
    actor: "Demo administrator",
  });
  return s;
}
export function createStudent(s, input) {
  const name = text(input.name, "Fictional name"),
    section = text(input.section, "Demo section", 40);
  if (!LEVELS.includes(input.level)) throw Error("Select a grade level.");
  const fee = cents(input.fee);
  const n = copy(s);
  const id = `DEMO-${Math.max(1000, ...s.students.map((x) => Number(x.id.split("-")[1]))) + 1}`;
  n.students.push({
    id,
    name,
    level: input.level,
    section,
    fee,
    archived: false,
  });
  return log(n, `Created fictional student ${id}`);
}
export function updateStudent(s, id, input) {
  person(s, id);
  const n = copy(s),
    p = person(n, id);
  if (input.name !== undefined) p.name = text(input.name, "Fictional name");
  if (input.section !== undefined)
    p.section = text(input.section, "Demo section", 40);
  if (input.level !== undefined) {
    if (!LEVELS.includes(input.level)) throw Error("Select a grade level.");
    p.level = input.level;
  }
  if (input.archived !== undefined) p.archived = Boolean(input.archived);
  return log(n, `Updated fictional student ${id}`);
}
export function recordPayment(s, input) {
  active(s, input.studentId);
  const amount = cents(input.amount);
  if (amount <= 0) throw Error("Payment must be greater than zero.");
  if (amount > balance(s, input.studentId))
    throw Error("Payment exceeds this demo student’s outstanding balance.");
  const reference = text(
    input.reference,
    "Unique sample reference",
    40,
  ).toUpperCase();
  if (s.payments.some((x) => x.reference.toUpperCase() === reference))
    throw Error(
      "This reference already exists. Use a unique sample reference.",
    );
  if (!["Cash", "Bank transfer"].includes(input.method))
    throw Error("Choose a payment method.");
  const n = copy(s);
  n.payments.push({
    id: `DEMO-P${String(s.payments.length + 1).padStart(3, "0")}`,
    studentId: input.studentId,
    amount,
    reference,
    method: input.method,
    debit: amount,
    credit: amount,
    time: new Date().toISOString(),
  });
  return log(n, `Recorded sample payment ${reference}`);
}
export function saveGrade(s, input) {
  active(s, input.studentId);
  const subject = text(input.subject, "Subject", 50);
  const scores = input.scores.map(Number),
    weights = input.weights.map(Number);
  if (
    scores.length !== 3 ||
    scores.some((x) => !Number.isFinite(x) || x < 0 || x > 100)
  )
    throw Error("Each score must be between 0 and 100.");
  if (
    weights.length !== 3 ||
    weights.some((x) => !Number.isFinite(x) || x < 0 || x > 100) ||
    Math.abs(weights.reduce((a, x) => a + x, 0) - 100) > 0.00001
  )
    throw Error("Weights must be between 0 and 100 and total exactly 100%.");
  if (!["Draft", "For review", "Published"].includes(input.status))
    throw Error("Choose a demo review status.");
  const n = copy(s);
  n.grades = n.grades.filter(
    (x) => !(x.studentId === input.studentId && x.subject === subject),
  );
  n.grades.push({
    studentId: input.studentId,
    subject,
    scores,
    weights,
    result:
      Math.round(
        scores.reduce((a, x, i) => a + (x * weights[i]) / 100, 0) * 100,
      ) / 100,
    status: input.status,
  });
  return log(n, `Saved demo grade for ${input.studentId}`);
}
export function recordGate(s, id, direction, time = new Date().toISOString()) {
  active(s, id);
  if (!["Entry", "Exit"].includes(direction))
    throw Error("Choose Entry or Exit.");
  if (Number.isNaN(Date.parse(time))) throw Error("Invalid event timestamp.");
  const last = s.gate.filter((x) => x.studentId === id).at(-1);
  if ((!last && direction === "Exit") || last?.direction === direction)
    throw Error(
      direction === "Exit"
        ? "Record an entry before recording an exit."
        : "This student is already marked inside. Record an exit first.",
    );
  if (last && Date.parse(time) < Date.parse(last.time))
    throw Error("Event cannot precede the last recorded event.");
  const n = copy(s);
  n.gate.push({ studentId: id, direction, time });
  return log(n, `${direction} recorded for ${id}`);
}
export function summary(s) {
  const students = s.students.filter((x) => !x.archived);
  return {
    students: students.length,
    collected: s.payments.reduce((a, x) => a + x.amount, 0),
    outstanding: students.reduce((a, x) => a + balance(s, x.id), 0),
    inside: students.filter(
      (x) =>
        s.gate.filter((e) => e.studentId === x.id).at(-1)?.direction ===
        "Entry",
    ).length,
    review: s.grades.filter((x) => x.status === "For review").length,
  };
}
export function csv(rows) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let v = String(value ?? "");
            if (/^[\s]*[=+@-]/.test(v)) v = "'" + v;
            return '"' + v.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
