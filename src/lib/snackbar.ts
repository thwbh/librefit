import { snackbar } from '@thwbh/veilchen';

/** Default time an undoable snackbar stays before the action lapses. */
export const UNDO_SNACKBAR_DURATION = 6000;

/** How long a failure-recovery snackbar stays before its action lapses. */
export const ACTION_SNACKBAR_DURATION = 6000;

/**
 * Enqueue a snackbar that explains a failure and offers a single recovery
 * action. Used by AI meal-photo capture to turn a failed analysis into a one-tap
 * "Add manually" path (FR-028..030/FR-039) instead of a passive alert. Show it
 * *after* any originating dialog closes so it isn't hidden behind a backdrop.
 */
export function actionSnackbar(message: string, actionLabel: string, onAction: () => void): void {
	snackbar.add(message, {
		actionLabel,
		onAction,
		duration: ACTION_SNACKBAR_DURATION
	});
}

/**
 * Enqueue a snackbar that offers a single Undo action, shown *after* the
 * originating modal closes (a layout-level snackbar would otherwise sit behind a
 * dialog backdrop). The action fires `onUndo` once; letting it time out keeps the
 * mutation. Centralised so the wording/duration of the undo affordance stays
 * consistent across surfaces (e.g. batch exercise tagging — WO-041/WO-042).
 */
export function undoSnackbar(message: string, onUndo: () => void): void {
	snackbar.add(message, {
		actionLabel: 'Undo',
		onAction: onUndo,
		duration: UNDO_SNACKBAR_DURATION
	});
}
