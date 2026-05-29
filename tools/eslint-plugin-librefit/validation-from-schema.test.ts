import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import * as svelteParser from 'svelte-eslint-parser';
import rule from './validation-from-schema.js';

// Run the rule through the real svelte parser the same way eslint.config.js
// wires it, and assert on the violations it surfaces. This exercises the actual
// `npm run lint:conventions` behavior the scenarios describe.
const linter = new Linter({ configType: 'flat' });
const config = [
	{
		files: ['**/*.svelte'],
		languageOptions: { parser: svelteParser },
		plugins: { librefit: { rules: { 'validation-from-schema': rule } } },
		rules: { 'librefit/validation-from-schema': 'warn' }
	}
];

function lint(code: string) {
	return linter
		.verify(code, config, { filename: 'src/lib/component/x/Fixture.svelte' })
		.filter((m) => m.ruleId === 'librefit/validation-from-schema');
}

const HAND_ROLLED = `
<script>
	import { useFieldValidity } from '$lib/composition/useFieldValidity.svelte';
	const v = useFieldValidity({
		matches: '#name',
		source: () => value,
		validate: (value) => {
			if (value.length <= 40) return { ok: false, message: 'Too long' };
			return { ok: true };
		}
	});
</script>
`;

const SCHEMA_DRIVEN = `
<script>
	import { useFieldValidity } from '$lib/composition/useFieldValidity.svelte';
	import { LibreUserSchema } from '$lib/api/gen/types';
	const schema = LibreUserSchema.shape.name;
	const v = useFieldValidity({
		matches: '#name',
		source: () => value,
		validate: (value) => {
			const result = schema.safeParse(value);
			return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
		}
	});
</script>
`;

describe('librefit/validation-from-schema', () => {
	it('[VAL-015] lint flags hand-rolled bounds/message in a validate callback', () => {
		const messages = lint(HAND_ROLLED);
		expect(messages.length).toBeGreaterThan(0);
		const ids = messages.map((m) => m.messageId);
		expect(ids).toContain('handRolledBound'); // value.length <= 40
		expect(ids).toContain('handRolledMessage'); // message: 'Too long'
	});

	it('[VAL-016] lint passes for a schema-driven validator', () => {
		const messages = lint(SCHEMA_DRIVEN);
		expect(messages).toHaveLength(0);
	});
});
