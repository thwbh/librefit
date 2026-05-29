/**
 * ESLint rule: validation-from-schema
 *
 * Flags hand-rolled bounds or messages inside a `useFieldValidity({ validate })`
 * callback. The expected shape delegates to a generated Zod schema:
 *
 *   const result = schema.safeParse(value);
 *   return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
 *
 * Re-expressing bounds (`value.length <= 40`, `parsed >= 30`) or returning a
 * string-literal `message` duplicates the schema and drifts from the backend.
 * See _conv-validation [VAL-014]..[VAL-016].
 */

const COMPARISON_OPERATORS = new Set(['>=', '<=', '>', '<']);

/** Recursively visit ESTree child nodes, ignoring the `parent` back-reference. */
function walk(node, visit) {
	if (!node || typeof node.type !== 'string') return;
	visit(node);
	for (const key of Object.keys(node)) {
		if (key === 'parent') continue;
		const child = node[key];
		if (Array.isArray(child)) {
			for (const item of child) walk(item, visit);
		} else if (child && typeof child.type === 'string') {
			walk(child, visit);
		}
	}
}

function isNumericLiteral(node) {
	return node && node.type === 'Literal' && typeof node.value === 'number';
}

function propName(property) {
	if (property.type !== 'Property') return undefined;
	if (property.key.type === 'Identifier') return property.key.name;
	if (property.key.type === 'Literal') return String(property.key.value);
	return undefined;
}

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require useFieldValidity validate callbacks to source bounds and messages from generated Zod schemas, not hand-rolled literals.'
		},
		messages: {
			handRolledBound:
				'Hand-rolled numeric/length bound in a validate callback. Source the bound from the generated Zod schema in $lib/api/gen/types via safeParse(...).',
			handRolledMessage:
				'Hand-rolled string-literal validation message. Surface result.error.issues[0].message from the generated Zod schema instead of a literal string.'
		},
		schema: []
	},

	create(context) {
		function checkValidateBody(fnNode) {
			walk(fnNode, (node) => {
				if (
					node.type === 'BinaryExpression' &&
					COMPARISON_OPERATORS.has(node.operator) &&
					(isNumericLiteral(node.left) || isNumericLiteral(node.right))
				) {
					context.report({ node, messageId: 'handRolledBound' });
				}
				if (
					node.type === 'Property' &&
					propName(node) === 'message' &&
					node.value.type === 'Literal' &&
					typeof node.value.value === 'string'
				) {
					context.report({ node, messageId: 'handRolledMessage' });
				}
			});
		}

		return {
			CallExpression(node) {
				if (node.callee.type !== 'Identifier' || node.callee.name !== 'useFieldValidity') {
					return;
				}
				const arg = node.arguments[0];
				if (!arg || arg.type !== 'ObjectExpression') return;
				const validateProp = arg.properties.find(
					(p) => p.type === 'Property' && propName(p) === 'validate'
				);
				if (!validateProp) return;
				const fn = validateProp.value;
				if (fn.type === 'FunctionExpression' || fn.type === 'ArrowFunctionExpression') {
					checkValidateBody(fn.body);
				}
			}
		};
	}
};
