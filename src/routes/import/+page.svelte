<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import ValidatedInput from '$lib/components/ValidatedInput.svelte';
	import { getFieldError } from '$lib/validation';
	import { showToastError, showToastSuccess } from '$lib/toast';
	import { FileDropzone, getToastStore, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import FileUpload from '$lib/assets/icons/file-upload.svg?component';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { startImport } from '$lib/api/importer';
	import type { Indicator } from '$lib/indicator';
	import type { LibreUser } from '$lib/model';
	import type { Writable } from 'svelte/store';
	import type { RadioInputChoice } from '$lib/types';

	const toastStore = getToastStore();
	const indicator: Writable<Indicator> = getContext('indicator');
	const user: Writable<LibreUser> = getContext('user');

	const radioOptions: Array<RadioInputChoice> = [
		{ label: 'All', value: 'A' },
		{ label: 'Calories', value: 'C' },
		{ label: 'Weight', value: 'W' }
	];

	let importGroup = $state('A');

	let files: FileList = $state();
	let status: any = $state();

	let overwriteDuplicates: boolean = $state(false);

	const handleImport = async (event) => {
		status = undefined;

		const formData = new FormData(event.currentTarget);

		$indicator = $indicator.reset();
		$indicator = $indicator.start();

		await startImport(formData)
			.then(async (response) => {
				showToastSuccess(toastStore, 'Import successful.');
			})
			.catch((error) => {
				showToastError(toastStore, error);
				status = error.data;
			})
			.finally(() => ($indicator = $indicator.finish()));
	};
</script>

<svelte:head>
	<title>LibreFit - CSV Import</title>
</svelte:head>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1 class="h1">Import</h1>
		<p>Upload data from existing sources.</p>

		<form
			class="variant-ringed p-4 space-y-4 rounded-container-token"
			method="POST"
			enctype="multipart/form-data"
			onsubmit={preventDefault(handleImport)}
		>
			<ValidatedInput
				name="datePattern"
				type="text"
				placeholder="dd-MM-yyyy"
				value="dd-MM-yyyy"
				label="Date format"
				required
				errorMessage={getFieldError(status, 'datePattern')}
			/>

			<ValidatedInput
				name="headerLength"
				type="text"
				placeholder="2"
				value="2"
				label="Number of header rows"
				required
				errorMessage={getFieldError(status, 'headerLength')}
			/>

			<p>Take data for</p>
			<RadioGroup>
				{#each radioOptions as option}
					<RadioItem value={option.value} name="importer" bind:group={importGroup}>
						{option.label}
					</RadioItem>
				{/each}
			</RadioGroup>

			<ValidatedInput
				bind:value={overwriteDuplicates}
				name="drop"
				label="Overwrite duplicates"
				type="checkbox"
				styling="checkbox self-center"
			/>

			<input
				value={files ? files[0].name : ''}
				name="fileName"
				type="text"
				hidden
				aria-hidden="true"
			/>

			<FileDropzone name="file" bind:files accept="text/csv">
				{#snippet lead()}
					<div class="btn-icon scale-150">
						<FileUpload />

						{#if getFieldError(status, 'file')}
							<strong class="text-error-400"> {getFieldError(status, 'file')} </strong>
						{/if}
					</div>
				{/snippet}
				{#snippet message()}
					{#if files}
						<p>
							Selected: {files[0].name}
						</p>
					{:else}
						<strong>Upload a file</strong> or drag and drop
					{/if}
				{/snippet}
				{#snippet meta()}
					{#if files}
						Size: {files[0].size} Bytes
					{:else}
						CSV allowed. Max. size: 32 KB
					{/if}
				{/snippet}
			</FileDropzone>

			<div class="flex justify-between">
				<button class="btn variant-filled-primary">Import</button>
			</div>
		</form>
	</div>
</section>
