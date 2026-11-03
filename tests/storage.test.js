import test from "node:test";
import assert from "node:assert/strict";
const m = await import("../src/storage.js").catch(() => ({}));
const memory = () => {
  let value = null;
  return { getItem: () => value, setItem: (k, v) => (value = v) };
};
test("storage persists state with revisions and detects competing tab changes", () => {
  assert.equal(typeof m.openStore, "function");
  const disk = memory(),
    a = m.openStore(disk),
    b = m.openStore(disk);
  const saved = a.save({ ...a.state, revision: 0 });
  assert.equal(saved.revision, 1);
  assert.throws(() => b.save(b.state), /another tab/i);
  assert.equal(m.openStore(disk).state.revision, 1);
});
test("invalid storage recovers with warning and unavailable storage does not claim persistence", () => {
  const bad = m.openStore({ getItem: () => "{bad", setItem: () => {} });
  assert.match(bad.warning, /could not be read/);
  const partial = m.openStore({
    getItem: () => JSON.stringify({ version: 1, students: [] }),
    setItem: () => {},
  });
  assert.match(partial.warning, /could not be read/);
  const offline = m.openStore({
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  });
  assert.match(offline.warning, /unavailable/);
  assert.throws(() => offline.save(offline.state), /could not be saved/);
});
test("corrupt persisted data can be explicitly reset", () => {
  let value = "{bad";
  const disk = { getItem: () => value, setItem: (k, v) => (value = v) };
  const store = m.openStore(disk);
  store.save(store.state);
  assert.equal(JSON.parse(value).students.length, 8);
});
test("invalid schema with a stale revision can be explicitly replaced by reset", () => {
  let value = JSON.stringify({ version: 1, revision: 7, students: [] });
  const disk = { getItem: () => value, setItem: (k, v) => (value = v) };
  const store = m.openStore(disk);
  store.save(store.state);
  assert.equal(JSON.parse(value).students.length, 8);
});
