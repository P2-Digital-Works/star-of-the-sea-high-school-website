import test from "node:test";
import assert from "node:assert/strict";
const d = await import("../src/domain.js").catch(() => ({}));
test("connected payment decreases balance and creates balanced journal", () => {
  assert.equal(typeof d.seed, "function");
  let s = d.seed();
  const before = d.balance(s, "DEMO-1001");
  s = d.recordPayment(s, {
    studentId: "DEMO-1001",
    amount: "1250.25",
    reference: "TEST-REF",
    method: "Cash",
  });
  assert.equal(d.balance(s, "DEMO-1001"), before - 125025);
  const p = s.payments.at(-1);
  assert.equal(p.debit, p.credit);
  assert.equal(p.credit, 125025);
});
test("rejects invalid, duplicate and excessive payments without mutating state", () => {
  let s = d.seed();
  for (const amount of ["0", "-1", "NaN", "0.001", "999999"])
    assert.throws(() =>
      d.recordPayment(s, {
        studentId: "DEMO-1001",
        amount,
        reference: "X",
        method: "Cash",
      }),
    );
  let n = d.recordPayment(s, {
    studentId: "DEMO-1001",
    amount: "1",
    reference: "X",
    method: "Cash",
  });
  assert.throws(() =>
    d.recordPayment(n, {
      studentId: "DEMO-1001",
      amount: "1",
      reference: " x ",
      method: "Cash",
    }),
  );
  assert.equal(s.payments.length, 2);
});
test("grades require valid scores and weights; use explicit demo weighting", () => {
  let s = d.seed();
  s = d.saveGrade(s, {
    studentId: "DEMO-1001",
    subject: "English",
    scores: [80, 90, 100],
    weights: [30, 50, 20],
    status: "For review",
  });
  assert.equal(s.grades.at(-1).result, 89);
  assert.throws(() =>
    d.saveGrade(s, {
      studentId: "DEMO-1001",
      subject: "English",
      scores: [101, 90, 80],
      weights: [30, 50, 20],
    }),
  );
  assert.throws(() =>
    d.saveGrade(s, {
      studentId: "DEMO-1001",
      subject: "English",
      scores: [80, 90, 80],
      weights: [30, 40, 20],
    }),
  );
});
test("gate enforces entry then exit and rejects duplicate direction", () => {
  let s = d.seed();
  assert.throws(() =>
    d.recordGate(s, "DEMO-1003", "Exit", "2026-11-03T00:00:00Z"),
  );
  s = d.recordGate(s, "DEMO-1003", "Entry", "2026-11-03T00:00:00Z");
  assert.throws(() =>
    d.recordGate(s, "DEMO-1003", "Entry", "2026-11-03T01:00:00Z"),
  );
  s = d.recordGate(s, "DEMO-1003", "Exit", "2026-11-03T02:00:00Z");
  assert.equal(s.gate.at(-1).direction, "Exit");
});
test("students can be created edited archived and restored with linked records retained", () => {
  let s = d.seed();
  s = d.createStudent(s, {
    name: "Fictional New Learner",
    level: "Grade 8",
    section: "Demo Coral",
    fee: "1000",
  });
  let id = s.students.at(-1).id;
  assert.equal(d.balance(s, id), 100000);
  s = d.updateStudent(s, id, { name: "Fictional Updated Learner" });
  assert.equal(s.students.at(-1).name, "Fictional Updated Learner");
  s = d.updateStudent(s, id, { archived: true });
  assert.throws(() => d.recordGate(s, id, "Entry", new Date().toISOString()));
  s = d.updateStudent(s, id, { archived: false });
  assert.equal(s.students.at(-1).archived, false);
  assert.throws(() =>
    d.createStudent(s, {
      name: "",
      level: "Grade 7",
      section: "Demo",
      fee: "0",
    }),
  );
});
test("report reflects actual data and CSV neutralizes spreadsheet formula injection", () => {
  let s = d.seed();
  assert.equal(d.summary(s).students, 8);
  assert.match(d.csv([["=1+1", "A,B", '"Q"']]), /"'=1\+1"/);
  assert.match(d.csv([["A,B"]]), /"A,B"/);
});
