<script lang="ts">
    import type { CalorieTracker, NewCalorieTracker } from "$lib/model";
    import { PenSolid } from "flowbite-svelte-icons";  

    interface Props { entry: CalorieTracker | NewCalorieTracker, isEditing?: boolean };

    let { 
      entry = $bindable(),
      isEditing = false
    }: Props = $props();

    let categoryLongvalue = $state('');

    const select = (categoryShortvalue: string) => {
      entry.category = categoryShortvalue;
    }

    $effect(() => {
      if (entry) {
        if (entry.category === 'b') categoryLongvalue = 'Breakfast';
        else if (entry.category === 'l') categoryLongvalue = 'Lunch';
        else if (entry.category === 'd') categoryLongvalue = 'Dinner';
      }
    });

</script>


<div class="flex flex-row items-center justify-between">
  {#if isEditing}
    <button class="btn" popovertarget="popover-1" style="anchor-name:--anchor-1">
      {categoryLongvalue}
    </button>
    <ul class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm" popover id="popover-1" style="position-anchor:--anchor-1">
      <li><button class="btn btn-ghost" onclick={() => select('b')}>Breakfast</button></li>
      <li><button class="btn btn-ghost" onclick={() => select('l')}>Lunch</button></li>
      <li><button class="btn btn-ghost" onclick={() => select('d')}>Dinner</button></li>
    </ul>
  {:else}
    <p class="font-bold">
      {categoryLongvalue}
    </p>

    <button class="btn btn-xs btn-ghost"><!-- Press to edit -->
      <PenSolid height="1rem" width="1rem" />
    </button>
  {/if}
</div>

<!--
<div class="join">
  <input type="text" class="input join-item" placeholder="Amount..." bind:value={entry.amount}  />
  <p class="btn btn-disabled join-item">kcal</p>
</div>
-->

<label class="input">
  <input type="text" placeholder="Amount..." bind:value={entry.amount} />
  <span class="label">kcal</span>
</label>

<div>
  <textarea class="textarea" placeholder="Description..." bind:value={entry.description}></textarea>  
</div>

