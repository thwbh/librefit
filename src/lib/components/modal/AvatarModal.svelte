<script lang="ts">
	import AvatarPicker from '$lib/components/AvatarPicker.svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();

	let selected: string = $state();

	if ($modalStore[0] && $modalStore[0].meta) {
		selected = $modalStore[0].meta.avatar;
	}

	const onSubmit = (_: any, unset?: boolean) => {
		if ($modalStore[0].response) {
			$modalStore[0].response({
				avatar: unset === true ? null : selected
			});
		}
	};

	const onCancel = () => {
		if ($modalStore[0].response) {
			$modalStore[0].response({
				cancelled: true
			});
		}
	};
</script>

<div
	class="modal block bg-surface-100-800-token sm-lg:w-modal h-auto p-4 space-y-4 rounded-container-token shadow-xl"
>
	<header class="text-2xl font-bold">Choose avatar</header>

	<AvatarPicker chosen={selected} onAvatarSelected={(fileName: string) => (selected = fileName)} />

	<footer class="modal-footer flex justify-between space-x-2">
		<div>
			<button onclick={(e) => onSubmit(e, true)} class="btn variant-ringed"> Unset </button>
		</div>

		<div>
			<button onclick={() => onCancel()} class="btn variant-ringed"> Cancel </button>

			<button onclick={(e: any) => onSubmit(e)} class="btn variant-filled"> Submit </button>
		</div>
	</footer>
</div>
