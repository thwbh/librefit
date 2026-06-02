<script lang="ts">
	import { Plus } from 'phosphor-svelte';

	interface Props {
		onclick: () => void;
	}

	let { onclick }: Props = $props();

	const cubicOut = 'cubic-bezier(0.33, 1, 0.68, 1)';

	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		node.style.opacity = '0';
		node.style.transition = `opacity 150ms ${cubicOut}`;
		setTimeout(() => (node.style.opacity = '1'), 100);
		return {
			destroy() {
				node.style.transition = `opacity 100ms ${cubicOut}`;
				node.style.opacity = '0';
				setTimeout(() => node.remove(), 100);
			}
		};
	};
</script>

<button
	use:portal
	class="fixed bottom-20 right-4 z-[39] btn btn-xl btn-circle btn-primary shadow-lg"
	aria-label="Add intake"
	{onclick}
>
	<Plus size="1.5em" />
</button>
