import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_REPOS, ciState, parseRepos, shapeLinear, shapePull } from "../src/autogroup-ops.js";

test("ciState: failing beats pending beats passing; empty is none", () => {
  assert.equal(ciState([]), "none");
  assert.equal(ciState([{ status: "completed", conclusion: "success" }, { status: "completed", conclusion: "skipped" }]), "passing");
  assert.equal(ciState([{ status: "completed", conclusion: "success" }, { status: "in_progress", conclusion: null }]), "pending");
  assert.equal(ciState([{ status: "in_progress", conclusion: null }, { status: "completed", conclusion: "failure" }]), "failing");
  assert.equal(ciState([{ status: "completed", conclusion: "cancelled" }]), "failing");
});

test("parseRepos keeps only owner/name entries and falls back to defaults", () => {
  assert.deepEqual(parseRepos("a/b, c/d ,bad,../x,e/f/g"), ["a/b", "c/d"]);
  assert.deepEqual(parseRepos(""), DEFAULT_REPOS);
  assert.deepEqual(parseRepos("nonsense"), DEFAULT_REPOS);
});

test("shapePull truncates titles and flags drafts", () => {
  const out = shapePull("a/b", { number: 3, title: "x".repeat(300), draft: true, html_url: "u" }, "passing");
  assert.equal(out.title.length, 120);
  assert.equal(out.draft, true);
});

test("shapeLinear returns the newest update or null", () => {
  assert.equal(shapeLinear(null), null);
  assert.equal(shapeLinear({ name: "P", projectUpdates: { nodes: [] } }).update, null);
  assert.equal(shapeLinear({ name: "P", projectUpdates: { nodes: [{ health: "onTrack", body: "hi", createdAt: "t" }] } }).update.health, "onTrack");
});
