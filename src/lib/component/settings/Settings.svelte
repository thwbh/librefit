<script lang="ts">
	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	const close = (_: Event) => (open = false);
</script>

{#if open}
	<!-- Backdrop to close menu when clicking outside -->
	<button class="fixed inset-0 z-40" onclick={onClose} aria-label="Close menu"></button>

	<!-- Settings menu -->
	<ul class="menu menu-md bg-base-200 rounded-box w-32 p-2 shadow-xl fixed bottom-20 right-4 z-50">
		<li>
			<a href="/profile" onclick={close}>Profile</a>
		</li>
		<li>
			<a href="/export" onclick={close}>Export</a>
		</li>
		<li>
			<a href="/wizard" onclick={close}>Wizard</a>
		</li>
		<li>
			<a href="/about" onclick={close}>About</a>
		</li>
	</ul>
{/if}
