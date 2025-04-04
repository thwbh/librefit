<script lang="ts">
    import type { CalorieTarget } from "$lib/model";

    interface Props { entries: Array<number>, calorieTarget: CalorieTarget };

    let { entries, calorieTarget }: Props = $props();

    let displayData: Array<number> = $state([]);  

    $effect(() => {
      if (entries.length < 7) {
        //let diff = 7 - entries.length;
        //
        //for (let index = 0; index < diff; index++) {
        //  displayData.push(0); 
        //}
        //
        displayData = entries;
      }
    })
</script>

<div class="card-body gap-4">
  <div class="mt-4 flex h-20 items-end gap-8 *:w-full *:rounded-sm">  
    {#each displayData as data }
      {@const ratio = data / calorieTarget.targetCalories}
      {@const percentage = Math.floor(ratio * 100)}
      {#if ratio === 0}
        <div class="bg-neutral" style="height: {percentage}%"></div>  
      {:else if ratio <= 1}
        <div class="bg-success" style="height: {percentage}%"></div>  
      {:else}
        {#if data < calorieTarget.maximumCalories}
          <div class="bg-warning" style="height: {percentage}%"></div>  
        {:else}
          <div class="bg-error" style="height: {percentage}%"></div>  
        {/if}
      {/if}
    {/each}
  </div> 
  <p class="py-3 text-xs">
    Over the last 6 days, you managed to stay on target for 3 days.
    Your average intake was 1789kcal per day.
  </p> 
  <div class="grid grid-cols-2 gap-2">
    <button class="btn">Distribution</button> 
    <button class="btn btn-neutral">Details</button>
  </div>
</div>
