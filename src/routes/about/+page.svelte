<script lang="ts">
	import logo from '$lib/assets/logo/librefit-logo.png';
</script>

<div class="flex flex-col gap-4 h-screen justify-center bg-primary text-primary-content gap-2">
	<div class="flex flex-row px-8">
		<span class="flex flex-col w-[50%] align-center">
			<span class="text-7xl font-bold text-right">Libre</span>
			<span class="text-7xl font-bold text-info text-right">Fit</span>
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
						<a href="https://github.com/thwbh/librefit" target="_blank"
							>Version SNAPSHOT <!--{env.PUBLIC_VERSION}--></a
						>
					</p>
				</div>
			</div>
		</div>
		<div>
			<button class="btn w-full" onclick={() => history.back()}> Back </button>
		</div>
	</div>
</div>
