<script lang="ts">
	import { goto } from '$app/navigation';
	import logo from '$lib/assets/logo/librefit-logo.png';

	const onsetup = () => {
		goto('/wizard');
	};
</script>

<div class="flex flex-col h-screen justify-center gap-2">
	<div class="flex flex-row px-8">
		<span class="flex flex-col w-[50%] align-center">
			<span class="text-primary text-right font-logo">Libre</span>
			<span class="text-secondary text-right font-logo">Fit</span>
		</span>
		<img src={logo} role="presentation" alt="" class="self-center w-[50%]" />
	</div>

	<div class="flex flex-col gap-4 px-8 justify-between">
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-4">
				<p class="text-2xl">Staying on track has never been easier.</p>
				<p>Define goals. See progress. Build habits.</p>
				<div class="flex flex-row justify-between">
					<p class="text-xs">Your FOSS calorie tracker!</p>
					<p class="text-xs">
						<a href="https://github.com/thwbh/librefit"
							>Version SNAPSHOT <!--{env.PUBLIC_VERSION}--></a
						>
					</p>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<div>
				<p>Hi there! Seems like you opened this app for the first time. Let's get you started.</p>
			</div>
			<div class="flex flex-col gap-4">
				<button class="btn btn-primary w-full" onclick={onsetup}>Start</button>
				<button class="btn w-full"> How does this work? </button>
			</div>
		</div>
	</div>
</div>

<style>
	.font-logo {
		font-size: 3rem;
		font-weight: bold;
	}
</style>
