<script lang="ts">
	import type { Intake, NewIntake } from '$lib/api';
	import { convertDateStrToDisplayDateStr } from '$lib/date';
	import { ModalDialog } from '@thwbh/veilchen';
	import { Trash } from 'phosphor-svelte';
	import IntakeMask from './IntakeMask.svelte';

	interface Props {
		dialog?: HTMLDialogElement;
		entry: Intake | NewIntake | null | undefined;
		mode: 'create' | 'edit';
		enableDelete?: boolean;
		errorMessage?: string;
		onsave: (event?: Event) => Promise<boolean> | boolean | void;
		oncancel: () => void;
		onrequestdelete?: () => void;
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
		ondelete
	}: Props = $props();

	const titleText = $derived(mode === 'create' ? 'Add Intake' : 'Edit Intake');
	const dateLabel = $derived(entry?.added ? convertDateStrToDisplayDateStr(entry.added) : '');
</script>

<ModalDialog bind:dialog onconfirm={onsave} {oncancel}>
	{#snippet title()}
		<span class="modal-header border-l-4 border-accent pl-2">{titleText}</span>
		<span class="flex items-center gap-2">
			{#if dateLabel}
				<span class="text-xs opacity-70">{dateLabel}</span>
			{/if}
			{#if mode === 'edit' && onrequestdelete}
				<button class="btn btn-xs btn-error" aria-label="Delete intake" onclick={onrequestdelete}>
					<Trash size="1rem" />
				</button>
			{/if}
		</span>
	{/snippet}

	{#snippet content()}
		{#if errorMessage}
			<div class="alert alert-error mb-4" role="alert">
				<span>{errorMessage}</span>
			</div>
		{/if}
		{#if entry}
			<IntakeMask bind:entry isEditing={true} readonly={enableDelete} />
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if mode === 'edit' && enableDelete && ondelete}
			<button class="btn btn-error" onclick={ondelete}>Delete</button>
		{:else}
			<button class="btn btn-primary" onclick={onsave}>Save</button>
		{/if}
		<button class="btn" onclick={oncancel}>Cancel</button>
	{/snippet}
</ModalDialog>
