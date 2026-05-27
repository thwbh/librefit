<script lang="ts">
	import type { Intake, NewIntake } from '$lib/api';
	import { NewIntakeSchema } from '$lib/api/gen/types';
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { useFieldValidity } from '$lib/composition/useFieldValidity.svelte';
	import { AlertBox, AlertType, AlertVariant, ModalDialog } from '@thwbh/veilchen';
	import { Trash } from 'phosphor-svelte';
	import IntakeMask from './IntakeMask.svelte';

	interface Props {
		dialog?: HTMLDialogElement;
		entry: Intake | NewIntake | null | undefined;
		mode: 'create' | 'edit' | 'delete';
		enableDelete?: boolean;
		errorMessage?: string;
		onsave?: (event?: Event) => Promise<boolean> | boolean | void;
		oncancel: () => void;
		onrequestdelete?: () => void;
		/**
		 * Symmetric to `onrequestdelete`: invoked when the user toggles the
		 * trash button OFF while the modal is already in delete-confirm view.
		 * Wired to `useEntryModal.cancelDelete()` on the route side so the
		 * composable's `enableDelete` flag flips back to false in-place.
		 */
		oncanceldelete?: () => void;
		ondelete?: (event?: Event) => Promise<boolean> | boolean | void;
	}

	let {
		dialog = $bindable(),
		entry = $bindable(),
		mode,
		enableDelete = false,
		errorMessage,
		onsave,
		oncancel,
		onrequestdelete,
		oncanceldelete,
		ondelete
	}: Props = $props();

	// True whenever the modal renders as a delete-confirm view — either entered
	// via the in-place edit→trash flip, or opened directly via openDelete().
	const isDeleteView = $derived(mode === 'delete' || (mode === 'edit' && enableDelete));
	// Title follows the *view*, not the mode prop — when the user toggles the
	// trash from edit mode, the title flips to "Delete Intake" too.
	const titleText = $derived(
		isDeleteView ? 'Delete Intake' : mode === 'create' ? 'Add Intake' : 'Edit Intake'
	);
	const dateLabel = $derived(entry?.added ? convertDateStrToDisplayDateStr(entry.added) : '');

	function handleTrashClick() {
		// Acts as a toggle: enter delete-confirm if currently editing, exit
		// back to edit if already in delete-confirm. Symmetric callbacks let
		// the route's useEntryModal track its own `enableDelete` state.
		if (isDeleteView) {
			oncanceldelete?.();
		} else {
			onrequestdelete?.();
		}
	}

	// Per [VAL-014]: whole-entry validation through the generated schema, so any
	// invalid field (amount, category, description length, etc.) surfaces the
	// same message the backend would emit. The first issue wins — Zod returns
	// them in schema-key order, which roughly matches form layout (amount → ...).
	const validity = useFieldValidity({
		source: () => entry,
		validate: (value) => {
			const result = NewIntakeSchema.safeParse(value);
			return result.success ? { ok: true } : { ok: false, message: result.error.issues[0].message };
		}
	});

	// Per [VAL-012] / [VAL-013]: don't pre-emptively disable Save; gate the
	// actual save behind `validity.attempt()` and shake on the first invalid
	// attempt of each "still invalid" period.
	let shaken = $state(false);
	let shakeKey = $state(0);

	$effect(() => {
		if (validity.displayValid) shaken = false;
	});

	function handleSaveClick(event?: Event) {
		if (!onsave) return;
		if (validity.attempt()) {
			onsave(event);
			return;
		}
		if (!shaken) {
			shaken = true;
			shakeKey++;
		}
	}
</script>

<ModalDialog bind:dialog onconfirm={handleSaveClick} {oncancel}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">{titleText}</span>
		<span class="flex items-center gap-2">
			{#if dateLabel}
				<span class="text-xs opacity-70">{dateLabel}</span>
			{/if}
			{#if mode === 'edit' && onrequestdelete}
				<button
					class="btn btn-xs btn-error"
					aria-label="Delete intake"
					aria-pressed={isDeleteView}
					onclick={handleTrashClick}
				>
					<Trash size="1rem" />
				</button>
			{/if}
		</span>
	{/snippet}

	{#snippet content()}
		{#if entry}
			<IntakeMask bind:entry readonly={isDeleteView} />
		{/if}
		{#if !isDeleteView && (errorMessage || validity.showError)}
			<AlertBox type={AlertType.Error} variant={AlertVariant.Box}>
				{errorMessage ?? validity.errorMessage}
			</AlertBox>
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if isDeleteView && ondelete}
			<button class="btn btn-error" onclick={ondelete}>Delete</button>
		{:else}
			{#key shakeKey}
				<button
					class="btn btn-primary save-button"
					class:shake={shakeKey > 0}
					onclick={handleSaveClick}
				>
					Save
				</button>
			{/key}
		{/if}
		<button class="btn" onclick={oncancel}>Cancel</button>
	{/snippet}
</ModalDialog>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}

	.save-button.shake {
		animation: shake 0.3s ease-in-out;
	}
</style>
