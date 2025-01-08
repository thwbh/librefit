<script lang="ts">
    import {Avatar} from '@skeletonlabs/skeleton';
    import {createEventDispatcher} from 'svelte';

    import avatar1 from '$lib/assets/avatars/buffdude-1.png';
    import avatar2 from '$lib/assets/avatars/buffdude-2.png';
    import avatar3 from '$lib/assets/avatars/cat-1.png';
    import avatar4 from '$lib/assets/avatars/dog-1.png';
    import avatar5 from '$lib/assets/avatars/lady-1.png';
    import avatar6 from '$lib/assets/avatars/lady-2.png';
    import avatar7 from '$lib/assets/avatars/skull-1.png';
    import avatar8 from '$lib/assets/avatars/panda-1.png';
    import avatar9 from '$lib/assets/avatars/tiger-1.png';

    export let fileList = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8, avatar9];
    export let chosen = 'dog-1.png';

    const dispatch = createEventDispatcher();

    const avatarClicked = (fileName: string) => {
        chosen = fileName;

        dispatch('chooseAvatar', {
            avatar: fileName
        });
    }
</script>

<div class="lg:flex lg:flex-row lg:gap-2 grid grid-cols-3 justify-items-center">
    {#each fileList as file}
        <button on:click={() => avatarClicked(file)} aria-label="choose">
            <Avatar src={file}
                    border="border-4 border-surface-300-600-token hover:!border-primary-500 {file === chosen ? '!border-primary-500' : ''}"
                    cursor="cursor-pointer"/>
        </button>
    {/each}
</div>