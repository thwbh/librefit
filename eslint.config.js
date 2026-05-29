import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelteParser from 'svelte-eslint-parser';
import librefit from './tools/eslint-plugin-librefit/index.js';

const JS_TS = ['**/*.{js,mjs,cjs,ts}'];
// The convention targets PRODUCTION validators. Test files legitimately
// hand-roll inline validators to exercise the composition itself.
const RULE_IGNORES = ['**/*.test.ts', '**/*.test.js', 'tests/**'];

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Base JS/TS linting. Scoped to JS/TS so the recommended rule sets do NOT
	// bleed onto .svelte files (which would surface a flood of pre-existing,
	// unrelated violations). Svelte is handled by the dedicated block below.
	{ files: JS_TS },
	{ files: JS_TS, languageOptions: { globals: globals.browser } },
	{ ...pluginJs.configs.recommended, files: JS_TS },
	...tseslint.configs.recommended.map((c) => ({ ...c, files: JS_TS })),

	// Convention rule on JS/TS validators (e.g. *.svelte.ts composition files).
	{
		files: JS_TS,
		ignores: RULE_IGNORES,
		plugins: { librefit },
		rules: { 'librefit/validation-from-schema': 'warn' }
	},

	// Convention rule on .svelte files. Scoped to ONLY our rule — we intentionally
	// do not pull in eslint-plugin-svelte's recommended set. The TS sub-parser is
	// required so <script lang="ts"> blocks parse.
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: { parser: tseslint.parser }
		},
		plugins: { librefit },
		rules: { 'librefit/validation-from-schema': 'warn' }
	}
];
