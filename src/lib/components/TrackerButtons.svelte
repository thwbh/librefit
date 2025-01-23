<script lang="ts">
	import Trash from '$lib/assets/icons/trash.svg?component';
	import AddKcal from '$lib/assets/icons/hamburger-plus.svg?component';
	import AddWeight from '$lib/assets/icons/plus.svg?component';
	import Add from '$lib/assets/icons/plus.svg?component';
	import Edit from '$lib/assets/icons/pencil.svg?component';
	import Check from '$lib/assets/icons/check.svg?component';
	import CancelDelete from '$lib/assets/icons/trash-off.svg?component';
	import CancelEdit from '$lib/assets/icons/pencil-off.svg?component';
	import type { TrackerButtonEvent } from '$lib/event';

	let btnAdd: HTMLButtonElement = $state();
	let btnConfirm: HTMLButtonElement = $state();
	let btnCancel: HTMLButtonElement = $state();

	let editing = $state(false);

	interface Props {
		existing?: boolean;
		disabled?: boolean;
		unit: any;
		previous: any;
		changeAction: any;
		category: any;
		value: any;
		onAdd: (event: TrackerButtonEvent) => void;
		onUpdate: (event: TrackerButtonEvent) => void;
		onDelete: (event: TrackerButtonEvent) => void;
	}

	let {
		existing = false,
		disabled = $bindable(false),
		unit,
		previous = $bindable(),
		changeAction = $bindable(),
		category = $bindable(),
		value = $bindable(),
		onAdd,
		onUpdate,
		onDelete
	}: Props = $props();

	const discard = () => {
		disabled = true;
		editing = false;

		if (changeAction === 'update') {
			value = previous.value;
			category = previous.category;
		}
	};

	const postAction = (error?: string) => {
		if (editing) {
			btnConfirm.disabled = false;
			btnCancel.disabled = false;
		}

		if (error) discard();
		else {
			disabled = true;
			editing = false;
		}
	};

	const add = () => {
		btnAdd.disabled = true;

		onAdd({
			callback: () => (btnAdd.disabled = false)
		});
	};

	const change = (action) => {
		return () => {
			disabled = false;
			editing = true;

			changeAction = action;

			if (action === 'update') {
				previous = { category, value };
			}
		};
	};

	const update = () => {
		btnConfirm.disabled = true;
		btnCancel.disabled = true;

		if (value !== previous.value || category !== previous.category) {
			onUpdate({
				callback: postAction
			});
		} else {
			postAction();
		}
	};

	const remove = () => {
		btnConfirm.disabled = true;
		btnCancel.disabled = true;

		onDelete({
			target: btnConfirm,
			callback: postAction
		});
	};
</script>

<div class="flex flex-row gap-1 justify-end">
	{#if !existing}
		<div>
			<button
				aria-label="add"
				bind:this={btnAdd}
				class="btn-icon variant-filled-primary"
				onclick={() => add()}
			>
				<span>
					{#if unit === 'kcal'}
						<AddKcal />
					{:else if unit === 'kg'}
						<AddWeight />
					{:else}
						<Add />
					{/if}
				</span>
			</button>
		</div>
	{:else if !editing}
		<button aria-label="edit" class="btn-icon variant-filled-secondary" onclick={() => update()}>
			<span>
				<Edit />
			</span>
		</button>
		<button aria-label="delete" class="btn-icon variant-filled" onclick={() => change('delete')}>
			<span>
				<Trash />
			</span>
		</button>
	{:else}
		<button
			aria-label="confirm"
			bind:this={btnConfirm}
			class="btn-icon variant-ghost-primary"
			onclick={changeAction === 'update' ? update : remove}
		>
			<span>
				<Check />
			</span>
		</button>
		<button
			aria-label="discard"
			bind:this={btnCancel}
			class="btn-icon variant-ghost-error"
			onclick={() => discard()}
		>
			<span>
				{#if changeAction === 'update'}
					<CancelEdit />
				{:else if changeAction === 'delete'}
					<CancelDelete />
				{:else}
					X
				{/if}
			</span>
		</button>
	{/if}
</div>
