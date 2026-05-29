#!/usr/bin/env node
/**
 * Scenario-ID hygiene check (convention rule 2).
 *
 * For every openspec/specs/<spec>/spec.md:
 *  - The spec declares `**ID prefix:** \`XX\`` in its Purpose.
 *  - Every `#### Scenario:` heading begins with `[PREFIX-NNN]`.
 *  - PREFIX matches the declared prefix; NNN is zero-padded to 3 digits.
 *  - IDs are unique within the spec (no number is reused).
 *
 * NOTE: physical ordering is intentionally NOT enforced. The convention
 * [TRC-002] says a scenario keeps its ID even when it moves between
 * requirements, so a later-numbered scenario can legitimately appear earlier in
 * the document (see onboarding's OB-018..020). Uniqueness — "numbers never get
 * reused" — is the real invariant.
 *
 * Exit 0 = clean, 1 = violations, 2 = no specs found.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(REPO_ROOT, "openspec", "specs");

if (!existsSync(SPEC_DIR)) {
	console.error(`No spec directory found: ${SPEC_DIR}`);
	process.exit(2);
}

const violations = [];

const specDirs = readdirSync(SPEC_DIR)
	.map((name) => join(SPEC_DIR, name))
	.filter((p) => statSync(p).isDirectory());

let specFileCount = 0;

for (const dir of specDirs) {
	const specName = basename(dir);
	const specPath = join(dir, "spec.md");
	if (!existsSync(specPath)) continue;
	specFileCount++;

	const text = readFileSync(specPath, "utf8");
	const lines = text.split("\n");

	const prefixMatch = text.match(/\*\*ID prefix:\*\*\s*`([A-Z][A-Z0-9]*)`/);
	if (!prefixMatch) {
		violations.push(`${specName}: missing \`**ID prefix:**\` declaration in Purpose`);
		continue;
	}
	const prefix = prefixMatch[1];

	const seen = new Map(); // number -> first line it appeared on
	lines.forEach((line, i) => {
		if (!line.startsWith("#### Scenario:")) return;
		const lineNo = i + 1;
		const idMatch = line.match(/#### Scenario:\s*\[([A-Z][A-Z0-9]*)-(\d+)\]/);
		if (!idMatch) {
			violations.push(
				`${specName}:${lineNo}: scenario heading missing well-formed [PREFIX-NNN] id -> "${line.trim()}"`
			);
			return;
		}
		const [, idPrefix, digits] = idMatch;
		if (idPrefix !== prefix) {
			violations.push(
				`${specName}:${lineNo}: id prefix [${idPrefix}-] does not match declared prefix \`${prefix}\``
			);
		}
		if (digits.length !== 3) {
			violations.push(
				`${specName}:${lineNo}: id number "${digits}" must be zero-padded to 3 digits`
			);
		}
		const num = Number(digits);
		if (seen.has(num)) {
			violations.push(
				`${specName}:${lineNo}: id number ${digits} is reused (first seen at line ${seen.get(num)})`
			);
		} else {
			seen.set(num, lineNo);
		}
	});
}

if (specFileCount === 0) {
	console.error(`No spec.md files found under ${SPEC_DIR}`);
	process.exit(2);
}

if (violations.length > 0) {
	console.error("Scenario-ID hygiene violations:");
	for (const v of violations) console.error("  " + v);
	process.exit(1);
}

console.log(`Scenario-ID hygiene: ${specFileCount} spec(s) checked, all clean.`);
