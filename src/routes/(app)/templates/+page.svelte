<script lang="ts">
	import { onMount } from 'svelte';
	import { EmptyState, SwipeableListItem } from '@thwbh/veilchen';
	import { ClipboardText, Copy, Pencil, Plus, Trash } from 'phosphor-svelte';
	import {
		listWorkoutTemplates,
		deleteWorkoutTemplate,
		cloneWorkoutTemplate,
		createWorkoutTemplate,
		createCommandHooks,
		type TemplateDetail
	} from '$lib/api';
	import TemplateFormModal from '$lib/component/workout/TemplateFormModal.svelte';
	import { longpress } from '$lib/gesture/long-press';
	import { undoSnackbar } from '$lib/snackbar';

	// Template management screen (WO-037/038). Lists predefined + user templates;
	// predefined ones are read-only and offer Clone-into-an-editable-copy (WO-038),
	// user ones use the `_conv-gestures` rows (swipe-left/long-press edit, swipe-right
	// delete, reversible via `_conv-undo`). Reached from Settings. Starting a workout
	// from a template lives in the Start Workout flow, not here.
	let templates = $state<TemplateDetail[]>([]);
	let loading = $state(true);

	let editing = $state<TemplateDetail | null>(null);
	let creating = $state(false);

	const predefined = $derived(templates.filter((t) => t.template.isPredefined));
	const userTemplates = $derived(templates.filter((t) => !t.template.isPredefined));

	const summary = (t: TemplateDetail) =>
		t.exercises.length === 0
			? 'No exercises'
			: `${t.exercises.length} exercise${t.exercises.length === 1 ? '' : 's'} · ${t.exercises
					.slice(0, 3)
					.map((e) => e.name)
					.join(', ')}${t.exercises.length > 3 ? '…' : ''}`;

	async function load() {
		loading = true;
		try {
			templates = await listWorkoutTemplates();
		} catch {
			// Background fetch — keep last-known state (ERR-003).
		} finally {
			loading = false;
		}
	}

	const silent = () => createCommandHooks({ showInvokeErrors: false, showValidationErrors: false });

	function onSaved() {
		editing = null;
		creating = false;
		load();
	}

	async function clone(t: TemplateDetail) {
		try {
			const copy = await cloneWorkoutTemplate({ id: t.template.id }, silent());
			await load();
			// Drop straight into the editable copy — the clone-and-swap flow (WO-038).
			editing = copy;
		} catch {
			// ignore; list unchanged
		}
	}

	async function removeTemplate(t: TemplateDetail) {
		try {
			await deleteWorkoutTemplate({ id: t.template.id }, silent());
			await load();
			undoSnackbar(`Deleted “${t.template.name}”.`, () => restore(t));
		} catch {
			// ignore
		}
	}

	async function restore(t: TemplateDetail) {
		try {
			await createWorkoutTemplate(
				{
					input: {
						name: t.template.name,
						description: t.template.description ?? undefined,
						exercises: t.exercises.map((e) => ({
							exerciseId: e.exerciseId,
							targetReps: e.targetReps ?? undefined,
							targetWeightKg: e.targetWeightKg ?? undefined,
							notes: e.notes ?? undefined
						}))
					}
				},
				silent()
			);
			await load();
		} catch {
			// best-effort restore (ERR-003)
		}
	}

	onMount(load);

	const cubicOut = 'cubic-bezier(0.33, 1, 0.68, 1)';
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		node.style.opacity = '0';
		node.style.transition = `opacity 150ms ${cubicOut}`;
		setTimeout(() => (node.style.opacity = '1'), 100);
		return {
			destroy() {
				node.style.transition = `opacity 100ms ${cubicOut}`;
				node.style.opacity = '0';
				setTimeout(() => node.remove(), 100);
			}
		};
	};
</script>

<svelte:head>
	<title>Templates</title>
</svelte:head>

<div class="flex flex-col overflow-x-hidden">
	<h1 class="sr-only">Manage workout templates</h1>

	<div class="bg-primary text-primary-content px-6 pb-14 safe-top">
		<div class="flex items-center gap-3">
			<ClipboardText size="1.75rem" weight="bold" />
			<div class="flex flex-col gap-1">
				<span class="text-3xl font-bold">Templates</span>
				<span class="text-sm opacity-70">Reusable workout routines</span>
			</div>
		</div>
	</div>

	<div class="bg-base-100 rounded-t-3xl -mt-6 relative z-10 flex flex-col gap-4 p-4 pt-6">
		{#if loading}
			<span class="loading loading-spinner self-center"></span>
		{:else if templates.length === 0}
			<EmptyState
				title="No templates yet"
				description="Build a routine to reuse it, or clone a predefined one and tweak it. Tap + to start."
			>
				{#snippet icon()}
					<ClipboardText size="2.5rem" weight="duotone" class="text-primary" />
				{/snippet}
			</EmptyState>
		{:else}
			{#if userTemplates.length > 0}
				<ul class="flex flex-col gap-1" data-testid="user-template-list">
					{#each userTemplates as t (t.template.id)}
						<li class="overflow-hidden rounded-box border border-base-200">
							<SwipeableListItem
								onleft={() => {
									editing = t;
								}}
								onright={() => removeTemplate(t)}
							>
								{#snippet leftAction()}
									<span><Pencil size="1.75rem" color={'var(--color-primary)'} /></span>
								{/snippet}
								{#snippet rightAction()}
									<span><Trash size="1.75rem" color={'var(--color-error)'} /></span>
								{/snippet}
								<div
									class="bg-base-100 flex flex-col items-start gap-0.5 p-3"
									data-testid="user-template-row"
									use:longpress
									onlongpress={() => (editing = t)}
								>
									<span class="font-medium">{t.template.name}</span>
									<span class="text-xs opacity-60">{summary(t)}</span>
								</div>
							</SwipeableListItem>
						</li>
					{/each}
				</ul>
			{/if}

			{#if predefined.length > 0}
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium uppercase tracking-wide opacity-50">Predefined</span>
					<ul class="flex flex-col gap-1" data-testid="predefined-template-list">
						{#each predefined as t (t.template.id)}
							<li
								class="flex items-center gap-2 rounded-box border border-base-200 p-3"
								data-testid="predefined-template-row"
							>
								<span class="flex flex-1 flex-col items-start">
									<span class="font-medium">{t.template.name}</span>
									<span class="text-xs opacity-60">{summary(t)}</span>
								</span>
								<button
									class="btn btn-ghost btn-sm gap-1"
									aria-label={`Clone ${t.template.name}`}
									onclick={() => clone(t)}
									data-testid="clone-template"
								>
									<Copy size="1.125rem" /> Clone
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>
</div>

<button
	use:portal
	class="fixed bottom-20 right-4 z-[39] btn btn-xl btn-circle btn-primary shadow-lg"
	aria-label="New template"
	data-testid="add-template"
	onclick={() => (creating = true)}
>
	<Plus size="1.5em" />
</button>

{#if creating}
	<TemplateFormModal mode="create" onsaved={onSaved} onclose={() => (creating = false)} />
{/if}
{#if editing}
	<TemplateFormModal
		mode="edit"
		detail={editing}
		onsaved={onSaved}
		onclose={() => (editing = null)}
	/>
{/if}
