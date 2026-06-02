#!/usr/bin/env node
/**
 * Check that every spec scenario ID is referenced by at least one test.
 *
 * Enforces the spec→test direction strictly: any scenario without a test
 * reference fails the build. The reverse is NOT enforced — a test that cites no
 * scenario is fine (helpers, pure-unit tests, fixtures).
 *
 * Exit codes:
 *   0  all scenarios covered
 *   1  one or more orphan scenarios found
 *   2  no specs found (configuration error)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(REPO_ROOT, "openspec", "specs");
const ID_RE = /\[[A-Z][A-Z0-9]*-[0-9]{3}\]/g;

// Search roots for test references (Rust + Vitest + lint-rule tests).
const TEST_ROOTS = [
	"src-tauri/tests",
	"src-tauri/src",
	"src",
	"tests",
	"tools",
].map((r) => join(REPO_ROOT, r));

// Meta-convention scenarios excluded from the spec→test requirement.
// `_conv-test-traceability` (TRC-*) describes the traceability rule that THIS
// script enforces — requiring a test to "cite" the rule that governs test
// citation is circular. These are enforced by tooling/review instead.
const META_PREFIXES = ["TRC"];

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		let s;
		try {
			s = statSync(p);
		} catch {
			continue;
		}
		if (s.isDirectory()) walk(p, out);
		else out.push(p);
	}
	return out;
}

function idsIn(text) {
	return text.match(ID_RE) ?? [];
}

if (!existsSync(SPEC_DIR)) {
	console.error(`::error::Spec directory not found: ${SPEC_DIR}`);
	process.exit(2);
}

// Collect every ID declared in specs.
const specIdSet = new Set();
for (const name of readdirSync(SPEC_DIR)) {
	const specPath = join(SPEC_DIR, name, "spec.md");
	if (!existsSync(specPath)) continue;
	for (const id of idsIn(readFileSync(specPath, "utf8"))) specIdSet.add(id);
}

let specIds = [...specIdSet].filter(
	(id) => !META_PREFIXES.some((p) => id.startsWith(`[${p}-`))
);

if (specIds.length === 0) {
	console.error(`::error::No scenario IDs found in ${SPEC_DIR}`);
	process.exit(2);
}

// Collect every ID referenced from test sources.
const testIdSet = new Set();
for (const root of TEST_ROOTS) {
	if (!existsSync(root)) continue;
	for (const file of walk(root)) {
		let text;
		try {
			text = readFileSync(file, "utf8");
		} catch {
			continue;
		}
		for (const id of idsIn(text)) testIdSet.add(id);
	}
}

const orphans = specIds.filter((id) => !testIdSet.has(id)).sort();

console.log(`Spec scenarios:   ${specIds.length}`);
console.log(`Covered by tests: ${specIds.length - orphans.length}`);
console.log(`Orphan scenarios: ${orphans.length}`);

if (orphans.length > 0) {
	console.error("");
	console.error("::error::The following spec scenarios have no test reference:");
	for (const id of orphans) console.error("  " + id);
	console.error("");
	console.error("Each spec scenario MUST be referenced by at least one test");
	console.error("(unit or integration). Cite the ID in the test name or in a");
	console.error("comment within a few lines of the test declaration.");
	process.exit(1);
}

console.log("");
console.log("All spec scenarios have test coverage. Traceability gate passed.");
