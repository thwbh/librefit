<script lang="ts">
	import { CheckboxEventTarget } from '$lib/event';
	import type { ValidationMessage } from '$lib/model';
	import type { ChangeEventHandler } from 'svelte/elements';

	const defaultValidate = () => {
		let valid = false;

		let detail: ValidationMessage = this.validateDetail({
			value: value,
			label: label
		});

		if (required && isEmpty()) {
			errorMessage = emptyMessage;
		} else if (!detail.skip) {
			valid = detail.valid;
			errorMessage = detail.errorMessage;
		} else {
			errorMessage = undefined;
			valid = true;
		}
		return valid;
	};

	const defaultValidateDetail = (_: any): ValidationMessage => {
		return {
			valid: false,
			skip: true
		};
	};

	interface Props {
		value: any;
		name: string;
		label: string;
		type: string;
		styling?: string;
		placeholder?: string;
		unit?: string;
		validateDetail?: (e: any) => {};
		emptyMessage?: string;
		required?: boolean;
		readonly?: boolean;
		errorMessage?: string | undefined;
		validate?: () => {};
		onChange?: ChangeEventHandler<HTMLInputElement>;
	}

	let {
		value = $bindable(''),
		name = 'control',
		label = '',
		type = 'text',
		styling = 'input',
		placeholder = '',
		unit = '',
		emptyMessage = `${label ? label : 'Field'} is empty.`,
		required = false,
		errorMessage = undefined,
		readonly = false,
		validateDetail = defaultValidateDetail,
		validate = defaultValidate,
		onChange
	}: Props = $props();

	const getType = (node: any) => {
		node.type = type;
	};

	const isEmpty = () => {
		return value === undefined || value === null || value.length <= 0;
	};

	const handleCheckboxEvent = (e: Event) => {
		this.checked = (<CheckboxEventTarget>e.target).checked;
	};
</script>

<label class="label">
	{#if type !== 'checkbox'}
		<span class="flex justify-between">
			{#if label}
				<span class="self-center">
					{label}
				</span>
			{/if}

			{#if errorMessage}
				<span class="text-sm validation-error-text self-center">
					{errorMessage}
				</span>
			{:else}
				<span class="text-sm self-center"></span>
			{/if}
		</span>
		<div class={!unit ? '' : 'input-group input-group-divider grid-cols-[auto_1fr_auto]'}>
			{#if unit}
				<div class={'input-group-shim' + (!errorMessage ? '' : ' input-error')}>{unit}</div>
			{/if}
			<input
				{name}
				class={styling + (!unit ? '' : 'rounded-none') + (!errorMessage ? '' : ' input-error')}
				use:getType
				{placeholder}
				{required}
				bind:value
				onchange={onChange}
				onfocusout={validate}
				{readonly}
			/>
		</div>
	{:else}
		<span class="flex justify-between">
			<span>
				<span>
					{label}
				</span>
				<input
					{name}
					class={styling + (!errorMessage ? '' : ' input-error')}
					use:getType
					bind:value
					onchange={handleCheckboxEvent}
					onfocusout={validate}
					{readonly}
				/>
			</span>

			{#if errorMessage}
				<span class="text-sm validation-error-text self-center">
					{errorMessage}
				</span>
			{:else}
				<span class="text-sm self-center"></span>
			{/if}
		</span>
	{/if}
</label>
