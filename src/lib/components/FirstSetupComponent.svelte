<script lang="ts">
	import { env } from '$env/dynamic/public';
	import {
		Accordion,
		AccordionItem,
		getToastStore,
		ProgressRadial,
		Step,
		Stepper
	} from '@skeletonlabs/skeleton';
	import {
		CalculationGoal,
		CalculationSex,
		type LibreUser,
		type NewCalorieTarget,
		type NewWeightTarget,
		type WizardInput
	} from '$lib/model';
	import { type WizardTargetSelection } from '$lib/types';
	import { calculateTdee } from '$lib/api/wizard';
	import WizardResultComponent from './wizard/WizardResultComponent.svelte';
	import { goto } from '$app/navigation';
	import WizardInputComponent from './wizard/WizardInputComponent.svelte';
	import UserProfileComponent from './UserProfileComponent.svelte';
	import { updateProfile } from '$lib/api/user';
	import { setBodyData } from '$lib/api/body';
	import type { RadioInputChoice } from '$lib/types';
	import RadioInputComponent from './RadioInputComponent.svelte';
	import ValidatedInput from './ValidatedInput.svelte';
	import { WizardOptions } from '$lib/enum';
	import Check from '$lib/assets/icons/check.svg?component';
	import WizardTargetResultComponent from './wizard/WizardTargetResultComponent.svelte';
	import { createCalorieTarget, createWeightTarget } from '$lib/api/target';
	import { addWeight } from '$lib/api/tracker';
	import type { WeightModificationEvent } from '$lib/event';
	import { getDateAsStr } from '$lib/date';

	let chosenOption: WizardTargetSelection = {
		customDetails: '',
		userChoice: WizardOptions.Custom_weight
	};

	let customWeightOpened = true;
	let customDateOpened = false;

	let selectedRate = undefined;

	let setup: boolean = true;
	let completion: boolean = false;
	let importer: boolean = false;

	let userProfileData: LibreUser = { id: 1, name: '', avatar: '' };

	let goalChoices: Array<RadioInputChoice> = [
		{ value: CalculationGoal.Loss, label: 'lose weight' },
		{ value: CalculationGoal.Gain, label: 'gain weight' }
	];

	let wizardInput: WizardInput = {
		age: 30,
		height: 160,
		sex: CalculationSex.Female,
		weight: 60,
		activityLevel: 1.25,
		calculationGoal: CalculationGoal.Loss,
		weeklyDifference: 3
	};

	let newWeightTarget: NewWeightTarget | undefined = undefined;
	let newCalorieTarget: NewCalorieTarget | undefined = undefined;

	const onTargetChange = (event: CustomEvent) => {
		newWeightTarget = event.detail.newWeightTarget;
		newCalorieTarget = event.detail.newCalorieTarget;
	};

	const handleProfileData = async (): Promise<any> => {
		const weightEvent: WeightModificationEvent = {
			detail: {
				dateStr: getDateAsStr(new Date()),
				value: wizardInput.weight
			}
		};

		return await Promise.all([
			setBodyData(wizardInput.age, wizardInput.sex, wizardInput.height, wizardInput.weight),
			updateProfile(userProfileData),
			createCalorieTarget(newCalorieTarget),
			createWeightTarget(newWeightTarget),
			addWeight(weightEvent)
		]).then((_) => goto('/dashboard'));
	};

	const choose = (details: any, param: WizardOptions) => {
		if (details.open) {
			chosenOption.userChoice = param;
		}

		if (chosenOption.userChoice === WizardOptions.Custom_weight) {
			customWeightOpened = chosenOption.userChoice === WizardOptions.Custom_weight;
		} else {
			customDateOpened = chosenOption.userChoice === WizardOptions.Custom_date;
		}
	};
</script>

<div class="container mx-auto p-12 space-y-8 self-center">
	{#if !setup && !importer && !completion}
		<div class="lg:grid lg:grid-cols-[auto_1fr_auto] xl:grid-cols-2 flex flex-col gap-4">
			<div class="flex flex-col gap-4">
				<h1
					class="font-logo md:flex md:flex-row lg:justify-start sm:gap-4 grid grid-cols-2 grid-rows-2 gap-1"
				>
					<span class="text-primary-500 md:text-9xl text-7xl text-right">Libre</span>
					<img
						src="/favicon-128x128.png"
						role="presentation"
						alt=""
						class="max-sm:pl-4 row-span-2 self-center"
					/>
					<span class="text-secondary-500 md:text-9xl text-7xl text-right">Fit</span>
				</h1>

				<div class="flex flex-col gap-4">
					<p class="text-2xl">Staying on track has never been easier.</p>
					<p>Define goals. See progress. Build habits.</p>
					<div class="flex flex-row justify-between">
						<p class="text-xs">Your FOSS calorie tracker!</p>
						<p class="text-xs">
							<a href="https://github.com/thwbh/librefit">Version {env.PUBLIC_VERSION}</a>
						</p>
					</div>
				</div>
			</div>
			<div class="flex flex-col lg:w-2/3 gap-4">
				<div>
					<p>Hi there! Seems like you opened this app for the first time. Let's get you started.</p>
				</div>
				<div class="flex flex-row gap-2 justify-between">
					<p class="self-center">I am new. How does this work?</p>
					<button on:click={() => (setup = true)} type="button" class="btn variant-filled-primary"
						>Setup</button
					>
				</div>
				<div class="flex flex-row gap-2 justify-between">
					<p class="self-center">I want to import my old stuff.</p>
					<button
						on:click={() => (importer = true)}
						type="button"
						class="btn variant-filled-secondary">Import</button
					>
				</div>
			</div>
		</div>
	{:else if setup && !completion}
		<h1 class="h1">First Setup</h1>
		<Stepper
			on:complete={() => {
				setup = false;
				completion = true;
			}}
		>
			<Step>
				<p>Let's see where you stand right now.</p>
				<WizardInputComponent bind:wizardInput />
			</Step>

			<Step>
				<p>What's your plan?</p>
				<div>
					<Accordion autocollapse>
						<AccordionItem
							bind:open={customWeightOpened}
							on:toggle={(event) => choose(event.detail, WizardOptions.Custom_weight)}
							class="block card card-hover"
						>
							<svelte:fragment slot="iconClosed"><Check /></svelte:fragment>
							<svelte:fragment slot="summary"
								><h3 class="h3">I want to reach my dream weight.</h3></svelte:fragment
							>
							<svelte:fragment slot="content"
								><p>How can I get to my target weight as fast as possible?</p>
								<ValidatedInput
									bind:value={chosenOption.customDetails}
									type="number"
									label="Target weight"
									unit={'kg'}
								/>
							</svelte:fragment>
						</AccordionItem>

						<AccordionItem
							bind:open={customDateOpened}
							on:toggle={(event) => choose(event.detail, WizardOptions.Custom_date)}
							class="block card card-hover"
						>
							<svelte:fragment slot="iconClosed"><Check /></svelte:fragment>
							<svelte:fragment slot="summary"
								><h3 class="h3">I have a timeline in mind.</h3></svelte:fragment
							>
							<svelte:fragment slot="content"
								><p>How much can I achieve until a specific date?</p>
								<RadioInputComponent
									bind:value={wizardInput.calculationGoal}
									label={'I want to'}
									choices={goalChoices}
								/>
								<ValidatedInput bind:value={chosenOption.customDetails} type="date" label="until" />
							</svelte:fragment>
						</AccordionItem>
					</Accordion>
				</div>
			</Step>

			<Step>
				{#await calculateTdee(wizardInput)}
					<p>Calculating...</p>
				{:then wizardResult}
					<p>Based on your input, I calculated the following.</p>

					<WizardResultComponent calculationInput={wizardInput} calculationResult={wizardResult} />
					<WizardTargetResultComponent
						{wizardInput}
						{wizardResult}
						{chosenOption}
						{selectedRate}
						on:targetChange={onTargetChange}
					/>
				{:catch error}
					<p>An error occured. Please try again later.</p>
					<p>{error}</p>
				{/await}
			</Step>

			<Step>
				<p>Set your nickname and avatar.</p>
				<UserProfileComponent bind:user={userProfileData} />
			</Step>
		</Stepper>
	{:else if completion}
		{#await handleProfileData()}
			<p>Setting everything up...</p>
			<ProgressRadial value={undefined} />
		{:then}
			<p>Success! You will be redirected...</p>
			{#await goto('/')}{/await}
		{:catch error}
			<p>An error occured. {error}</p>
		{/await}
	{:else if importer}
		<p>String upload.</p>
	{/if}
</div>

<style>
	a:hover {
		color: var(--color-surface-900);
	}
</style>
