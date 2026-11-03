import { seed } from "./domain.js";
export const KEY = "p2-sshs-fictional-demo-v1";
function valid(s) {
  return (
    s?.version === 1 &&
    Number.isSafeInteger(s.revision) &&
    s.revision >= 0 &&
    ["students", "payments", "grades", "gate", "audit"].every((k) =>
      Array.isArray(s[k]),
    ) &&
    s.students.every(
      (p) =>
        typeof p.id === "string" &&
        p.id.startsWith("DEMO-") &&
        typeof p.name === "string" &&
        Number.isSafeInteger(p.fee) &&
        p.fee >= 0 &&
        typeof p.archived === "boolean",
    ) &&
    s.payments.every(
      (p) =>
        Number.isSafeInteger(p.amount) &&
        p.amount > 0 &&
        typeof p.reference === "string" &&
        s.students.some((x) => x.id === p.studentId),
    ) &&
    s.grades.every(
      (g) =>
        Number.isFinite(g.result) &&
        Array.isArray(g.scores) &&
        Array.isArray(g.weights) &&
        s.students.some((x) => x.id === g.studentId),
    ) &&
    s.gate.every(
      (g) =>
        ["Entry", "Exit"].includes(g.direction) &&
        !Number.isNaN(Date.parse(g.time)) &&
        s.students.some((x) => x.id === g.studentId),
    )
  );
}
export function openStore(disk) {
  let state = seed(),
    warning = "",
    observed = null;
  try {
    const raw = disk.getItem(KEY);
    observed = raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!valid(parsed)) throw Error("schema");
      state = parsed;
    }
  } catch (e) {
    warning =
      e.message === "denied"
        ? "Browser storage is unavailable. Changes cannot be saved."
        : "Saved demo data could not be read. A fresh fictional dataset is shown; reset the demo to replace it.";
  }
  return {
    state,
    warning,
    save(next) {
      let current;
      try {
        current = disk.getItem(KEY);
        if (current !== observed)
          throw Error("Another tab changed this demo. Reload before saving.");
        const updated = { ...next, revision: (state.revision ?? 0) + 1 };
        disk.setItem(KEY, JSON.stringify(updated));
        state = updated;
        observed = JSON.stringify(updated);
        return updated;
      } catch (e) {
        if (/another tab/i.test(e.message)) throw e;
        throw Error(
          "Changes could not be saved. Enable browser storage, or reload and try again.",
        );
      }
    },
  };
}
