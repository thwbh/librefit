<script lang="ts">
	import Trash from '$lib/assets/icons/trash.svg?component';
	import AddKcal from '$lib/assets/icons/hamburger-plus.svg?component';
	import AddWeight from '$lib/assets/icons/plus.svg?component';
	import Add from '$lib/assets/icons/plus.svg?component';
	import Edit from '$lib/assets/icons/pencil.svg?component';
	import Check from '$lib/assets/icons/check.svg?component';
	import CancelDelete from '$lib/assets/icons/trash-off.svg?component';
	import CancelEdit from '$lib/assets/icons/pencil-off.svg?component';
	import { createEventDispatcher } from 'svelte';

	export let existing = false;
	export let disabled = false;
	export let unit;

	let btnAdd: HTMLButtonElement;
	let btnConfirm: HTMLButtonElement;
	let btnCancel: HTMLButtonElement;

	let editing = false;

	export let previous;
	export let changeAction;

	export let category;
	export let value;

	const dispatch = createEventDispatcher();

	const add = () => {
		btnAdd.disabled = true;

		dispatch('add', {
			callback: () => {
				btnAdd.disabled = false;
			}
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

	const update = (e) => {
		e.preventDefault();

		btnConfirm.disabled = true;
		btnCancel.disabled = true;

		if (value !== previous.value || category !== previous.category) {
			dispatch('update', {
				callback: postAction
			});
		} else {
			postAction();
		}
	};

	const remove = (e) => {
		e.preventDefault();

		btnConfirm.disabled = true;
		btnCancel.disabled = true;

		dispatch('remove', {
			target: btnConfirm,
			callback: postAction
		});
	};

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
</script>

<div class="flex flex-row gap-1 justify-end">
	{#if !existing}
		<div>
			<button
				aria-label="add"
				bind:this={btnAdd}
				class="btn-icon variant-filled-primary"
				on:click|preventDefault={add}
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
		<button
			aria-label="edit"
			class="btn-icon variant-filled-secondary"
			on:click|preventDefault={change('update')}
		>
			<span>
				<Edit />
			</span>
		</button>
		<button
			aria-label="delete"
			class="btn-icon variant-filled"
			on:click|preventDefault={change('delete')}
		>
			<span>
				<Trash />
			</span>
		</button>
	{:else}
		<button
			aria-label="confirm"
			bind:this={btnConfirm}
			class="btn-icon variant-ghost-primary"
			on:click={changeAction === 'update' ? update : remove}
		>
			<span>
				<Check />
			</span>
		</button>
		<button
			aria-label="discard"
			bind:this={btnCancel}
			class="btn-icon variant-ghost-error"
			on:click|preventDefault={discard}
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
