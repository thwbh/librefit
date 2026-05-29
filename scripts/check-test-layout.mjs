#!/usr/bin/env node
/**
 * Test-file layout check (convention rule 3).
 *
 *  - Every `src/**\/*.test.ts` must be colocated next to a sibling source file.
 *  - No `+`-prefixed test file (`+page.test.ts`, ...) may live under `src/routes/`
 *    (the `+` prefix is reserved by SvelteKit and breaks the dev server).
 *
 * Shared test infrastructure under `tests/` is exempt by design (not colocated).
 *
 * Exit 0 = clean, 1 = violations.
 */
import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * True if the test imports anything from the same directory (`from './...'`).
 * A same-dir relative import is colocation intent — that's the signal we want,
 * independent of whether the target is present on disk (e.g. `target.test.ts`
 * imports the generated `./gen`, which is gitignored and absent on a bare CI
 * checkout). On-disk resolution would couple this layout check to build order.
 */
function hasSameDirImport(file) {
	const text = readFileSync(file, "utf8");
	return /(?:from|import)\s+['"]\.\/[^'"]+['"]/.test(text);
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(REPO_ROOT, "src");

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else out.push(p);
	}
	return out;
}

/** Candidate sibling source filenames for a test whose base name is `base`. */
function siblingCandidates(base) {
	const c = new Set();
	for (const ext of [".ts", ".js", ".svelte", ".svelte.ts"]) c.add(base + ext);
	// Route files carry a `+` prefix that the test name drops.
	for (const ext of [".svelte", ".ts", ".js"]) c.add("+" + base + ext);
	// Multi-part bases (e.g. `page.load`, `layout.render`) point at the
	// first segment's route file (`+page.ts`, `+layout.svelte`).
	if (base.includes(".")) {
		const head = base.split(".")[0];
		for (const ext of [".svelte", ".ts", ".js"]) c.add("+" + head + ext);
	}
	// A `.svelte`-suffixed base (Foo.svelte.test.ts) sits next to Foo.svelte.
	if (base.endsWith(".svelte")) c.add(base);
	return c;
}

const violations = [];
const files = existsSync(SRC_DIR) ? walk(SRC_DIR) : [];

for (const file of files) {
	const name = basename(file);
	const dir = dirname(file);
	const isTest = name.endsWith(".test.ts") || name.endsWith(".test.js");
	if (!isTest) continue;

	const rel = file.slice(REPO_ROOT.length + 1);

	if (name.startsWith("+")) {
		violations.push(
			`${rel}: test file has a reserved \`+\` prefix; drop it (SvelteKit reserves \`+\` and it breaks the dev server)`
		);
		continue;
	}

	const base = name.replace(/\.test\.(ts|js)$/, "");
	const candidates = siblingCandidates(base);
	const hasSibling = [...candidates].some((c) => existsSync(join(dir, c)));
	// Aggregation tests (e.g. target.test.ts exercising generated `./gen`
	// commands) have no base-name sibling but still live with the code they
	// test. Accept them when they import from the same directory.
	const hasLocalImport = !hasSibling && hasSameDirImport(file);
	if (!hasSibling && !hasLocalImport) {
		violations.push(
			`${rel}: no colocated source sibling found (looked for ${base}.{ts,svelte,svelte.ts} and route variants, and same-dir imports)`
		);
	}
}

if (violations.length > 0) {
	console.error("Test-layout violations:");
	for (const v of violations) console.error("  " + v);
	process.exit(1);
}

console.log(`Test-layout: ${files.filter((f) => /\.test\.(ts|js)$/.test(f)).length} colocated test(s) checked, all clean.`);
