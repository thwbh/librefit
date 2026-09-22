import { error as logError } from '@tauri-apps/plugin-log';
import { ZodError } from 'zod';
import { formatZodError } from './error-formatter';

/** Shown for unexpected faults — technical detail goes to the log, not the user. */
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Handle a caught error once: log the full technical detail (message + stack) through
 * `tauri-plugin-log` — which reaches the terminal (Stdout) and the app log file in both
 * dev and prod — and return a **clean, user-safe message with no stacktrace** for the
 * UI (alert box / inline error).
 *
 * The log line is prefixed with the call site (e.g. `TemplateFormModal.svelte:save`),
 * derived automatically from the stack so callers don't repeat it — pass `context` only
 * to override. Auto-detection is readable in dev; in prod the frames may be minified, but
 * the original error's own stack is logged too, so the throw location is never lost.
 *
 * Display policy keyed on what the generated `$lib/api` commands throw:
 *  - `ZodError`      → the first field message (a correctable validation issue).
 *  - `string`        → backend `Result<_, String>` errors are written for users; shown as-is.
 *  - `Error` / other → an unexpected frontend fault; the user sees a generic line while the
 *                      real message + stack stay in the log.
 *
 * @returns the message to display to the user.
 */
export function reportError(e: unknown, context?: string): string {
	const site = context ?? callSite();
	const detail = e instanceof Error ? (e.stack ?? e.message) : stringify(e);
	// Fire-and-forget; logging must never mask the original failure.
	void logError(`[${site}] ${detail}`);

	if (e instanceof ZodError) return formatZodError(e);
	if (typeof e === 'string') return e;
	return GENERIC_MESSAGE;
}

/**
 * Derive `file:function` for the frame that called `reportError`, from a fresh stack:
 * frame 0 is `callSite`, 1 is `reportError`, 2 is the caller.
 */
function callSite(): string {
	const stack = new Error().stack;
	if (!stack) return 'app';
	const frame = stack
		.split('\n')
		.map((l) => l.trim())
		.find((l, i) => i > 0 && l.startsWith('at ') && !l.includes('report-error'));
	if (!frame) return 'app';

	// V8: "at fnName (url:line:col)" or "at url:line:col".
	const withFn = frame.match(/^at\s+(.+?)\s+\((.+)\)$/);
	const fn = withFn ? withFn[1] : '';
	const loc = withFn ? withFn[2] : frame.replace(/^at\s+/, '');
	// Basename of the module, without the vite query string or :line:col suffix.
	const file =
		loc
			.split('/')
			.pop()
			?.split('?')[0]
			?.replace(/:\d+:\d+$/, '') ?? loc;

	return fn ? `${file}:${fn}` : file || 'app';
}

function stringify(e: unknown): string {
	try {
		return typeof e === 'object' && e !== null ? JSON.stringify(e) : String(e);
	} catch {
		return String(e);
	}
}
