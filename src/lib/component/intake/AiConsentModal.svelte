<script lang="ts">
	import { ModalDialog } from '@thwbh/veilchen';
	import { Sparkle } from 'phosphor-svelte';

	// One-time consent before the first meal photo is ever uploaded (FR-014). States
	// plainly what is sent and where; nothing uploads until the user accepts (FR-015).
	// Once accepted it is recorded and not shown again (FR-016).
	interface Props {
		/** The provider endpoint the photo would be sent to, for transparency. */
		endpoint?: string;
		onaccept: () => void;
		oncancel: () => void;
	}

	let { endpoint, onaccept, oncancel }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});
</script>

<ModalDialog bind:dialog {oncancel}>
	{#snippet title()}
		<span class="border-l-4 border-accent pl-2 flex items-center gap-2">
			<Sparkle size="1.25rem" /> Use AI to estimate calories?
		</span>
	{/snippet}

	{#snippet content()}
		<div class="flex flex-col gap-3 text-sm">
			<p>
				Your meal photo will be sent <strong>directly from this device</strong> to your configured
				provider{#if endpoint}
					(<span class="break-all opacity-70">{endpoint}</span>){/if}.
			</p>
			<ul class="list-disc pl-5 opacity-80 space-y-1">
				<li>The photo is used only for this estimate and is not stored.</li>
				<li>Location and other metadata are stripped before sending.</li>
				<li>The result pre-fills the form. Nothing is saved until you confirm.</li>
			</ul>
			<p class="opacity-70">You can turn this off any time in AI settings.</p>
		</div>
	{/snippet}

	{#snippet footer()}
		<button class="btn btn-primary" onclick={onaccept}>Accept &amp; continue</button>
		<button class="btn" onclick={oncancel}>Cancel</button>
	{/snippet}
</ModalDialog>
