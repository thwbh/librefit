<script lang="ts">
	import { page } from '$app/state';
	import ErrorBot from '$lib/assets/icons/error-bot.svg?component';
	import { goto } from '$app/navigation';
</script>

<section>
	<div class="container mx-auto p-8 space-y-8">
		<h1>{page.status}: {page.error.message}</h1>
		<p>Whoops. Seems like that took a wrong turn.</p>
		<button class="btn variant-filled-primary" onclick={() => goto('/')}>Back</button>
		<div class="flex justify-center">
			<ErrorBot height="60vh" />
		</div>
	</div>
</section>
