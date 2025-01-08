<script>
    import ValidatedInput from '$lib/components/ValidatedInput.svelte';
    import {getFieldError} from '$lib/validation.ts';
    import {showToastError, showToastSuccess} from '$lib/toast.ts';
    import {FileDropzone, getToastStore, RadioGroup, RadioItem} from '@skeletonlabs/skeleton';
    import FileUpload from '$lib/assets/icons/file-upload.svg?component';
    import {getContext} from 'svelte';
    import {goto} from '$app/navigation';
		import { startImport } from '$lib/api/importer.ts';

    const toastStore = getToastStore();
    const indicator = getContext('indicator');
    const user = getContext('user');

    if (!$user) goto('/');

    /** @type Array */
    const radioOptions = [
        { label: 'All', value: 'A' },
        { label: 'Calories', value : 'C' },
        { label: 'Weight', value: 'W' }
    ];

    let importGroup = 'A';

    /** @type FileList */
    let files;

    let status;

    const handleImport = async (event) => {
        status = undefined;

        const formData = new FormData(event.currentTarget);

        $indicator = $indicator.reset();
        $indicator = $indicator.start();

        await startImport(formData).then(async response => {
            if (response.success) {
                showToastSuccess(toastStore, 'Import successful.');
            } else throw response
        }).catch(error => {
            showToastError(toastStore, error);
            status = error.data;
        }).finally(() => $indicator = $indicator.finish());
    }
</script>

<svelte:head>

    <title>LibreFit - CSV Import</title>
</svelte:head>

{#if $user}
<section>
    <div class="container mx-auto p-8 space-y-8">
        <h1 class="h1">Import</h1>
        <p>Upload data from existing sources.</p>

        <form class="variant-ringed p-4 space-y-4 rounded-container-token" method="POST" enctype="multipart/form-data"
              on:submit|preventDefault={handleImport}>

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

            <p>
                Take data for
            </p>
            <RadioGroup>
                {#each radioOptions as option}
                    <RadioItem value={option.value} name="importer" bind:group={importGroup}>
                        {option.label}
                    </RadioItem>
                {/each}
            </RadioGroup>

            <ValidatedInput
                    name="drop"
                    type="checkbox"
                    styling="checkbox self-center"
            >
                Overwrite duplicates
            </ValidatedInput>

            <input value={files ? files[0].name : ''} name="fileName" type="text" hidden aria-hidden="true"/>

            <FileDropzone name="file" bind:files={files} accept="text/csv">
                <svelte:fragment slot="lead">
                    <div class="btn-icon scale-150">
                        <FileUpload/>

                        {#if getFieldError(status, 'file') }
                            <strong class="text-error-400"> {getFieldError(status, 'file')} </strong>
                        {/if}
                    </div>
                </svelte:fragment>
                <svelte:fragment slot="message">
                    {#if files}
                        <p>
                            Selected: {files[0].name}
                        </p>
                    {:else}
                        <strong>Upload a file</strong> or drag and drop
                    {/if}
                </svelte:fragment>
                <svelte:fragment slot="meta">
                    {#if files}
                        Size: {files[0].size} Bytes
                    {:else}
                        CSV allowed. Max. size: 32 KB
                    {/if}
                </svelte:fragment>
            </FileDropzone>

            <div class="flex justify-between">
                <button class="btn variant-filled-primary">Import</button>
            </div>
        </form>
    </div>
</section>
{/if}