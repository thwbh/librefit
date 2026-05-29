import tseslint from 'typescript-eslint';
import svelteParser from 'svelte-eslint-parser';
import librefit from './tools/eslint-plugin-librefit/index.js';

// Conventions-only ESLint config used by `npm run lint:conventions`. It runs
// ONLY the librefit convention rules — no recommended rule sets — so the
// command reports convention violations exclusively and stays green on the
// current tree regardless of unrelated pre-existing lint debt. Editor squiggles
// and full linting come from eslint.config.js instead.

// The convention targets PRODUCTION validators; test files legitimately
// hand-roll inline validators to exercise the composition itself.
const RULE_IGNORES = ['**/*.test.ts', '**/*.test.js', 'tests/**'];

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		ignores: RULE_IGNORES,
		languageOptions: { parser: tseslint.parser },
		plugins: { librefit },
		rules: { 'librefit/validation-from-schema': 'warn' }
	},
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
