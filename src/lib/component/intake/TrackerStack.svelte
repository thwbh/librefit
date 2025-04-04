<script lang="ts">
    import type { CalorieTracker, NewCalorieTracker } from "$lib/model";
    import { swipe, type SwipeCustomEvent } from 'svelte-gestures';
    import IntakeCard from "./IntakeCard.svelte";
    import CalorieTrackerMask from "./CalorieTrackerMask.svelte";
    import { PlusOutline } from "flowbite-svelte-icons";

    interface Props { entries: Array<CalorieTracker> }

    let { entries = $bindable() }: Props = $props();

    let blankEntry: NewCalorieTracker = $state({
      category: 'l',
      added: '2025-04-01',
      amount: 0,
      description: ''
    });

    let focusedEntry: CalorieTracker | undefined = $state(undefined);

    let index = $state(0);
    let dialog: HTMLDialogElement | undefined = $state();
    let createDialog: HTMLDialogElement | undefined = $state();

    let isEditing = $state(false);
    let isNew = $state(false);

    const startEditing = () => {
      isEditing = true;

      dialog?.showModal();
    }

    const create = (e: Event) => {
      isNew = true;

      console.log('create!');
      createDialog?.showModal();
    }

    const save = (e: Event) => {
      console.log('save!');

      console.log(blankEntry);

      if (isNew) {
        entries.push({
          id: entries.length + 1,
          category: blankEntry.category,
          added: blankEntry.added,
          amount: blankEntry.amount,
          description: blankEntry.description
        });

        console.log(entries);
      }

      if (isEditing) dialog?.close();
      if (isNew) createDialog?.close();
    }

    const cancel = (e: Event) => {
      console.log('cancel!');

      if (isEditing) dialog?.close();
      if (isNew) createDialog?.close()
    }

    const handler = (event: SwipeCustomEvent) => {
      let direction = 0;

      if (event.detail.direction === "left") direction = 1;
      else if (event.detail.direction === "right") direction = -1;

      index = (index + direction + entries.length) % entries.length;
      focusedEntry = entries[index];
    };
</script>

<div class="flex flex-col items-center gap-2">
  <div class="flex flex-row gap-4 items-center">
  <!--  <PlusOutline class="btn btn-circle btn-xs" />  -->

    {#each entries as _, i}
  <!--   <div class="badge badge-neutral p-0 w-{i === index ? '2' : '1'} h-{i === index ? '2' : '1'}"></div> -->
      <span class="indicator-bubble {i === index ? 'active' : ''}"></span>
    {/each}
  </div>

  <div class="stack stack-end"
    use:swipe={() => ({ timeframe: 300, minSwipeDistance: 60 })} 
    onswipe={handler}
  >

    <div>
      <IntakeCard entry={entries[index]} onlongpress={startEditing} />
    </div>
   
    {#each entries as entry, i }
      {#if i !== index}
        <div>
          <IntakeCard {entry} onlongpress={startEditing} />
        </div>
      {/if}
    {/each}
  </div>


  <button class="btn btn-neutral w-full" onclick={create}>
    Add Intake
<!--    <PlusOutline height="1rem" width="1rem" /> -->
  </button>
</div>


<dialog bind:this={dialog} id="intake-modal" class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <fieldset class="fieldset w-xs rounded-box">
      {#if focusedEntry !== undefined}
        <CalorieTrackerMask bind:entry={focusedEntry} {isEditing} /> 
      {/if}
    </fieldset>
    <div class="flex flex-col gap-2">
      <button class="btn" onclick={save}>Save</button>
      <button class="btn" onclick={cancel}>Cancel</button>
    </div>
  </div>
</dialog>

<dialog bind:this={createDialog} id="intake-modal" class="modal modal-bottom sm:modal-middle">
  <div class="modal-box">
    <fieldset class="fieldset w-xs rounded-box">
      <CalorieTrackerMask bind:entry={blankEntry} isEditing={true} />
    </fieldset>
    <div class="flex flex-col gap-2">
      <button class="btn" onclick={save}>Save</button>
      <button class="btn" onclick={cancel}>Cancel</button>
    </div>
  </div>
</dialog>


<style>
  .indicator-bubble::after {
    content: '';
    height: calc(var(--spacing) * 1.5);
    width: calc(var(--spacing) * 1.5);
    padding: calc(var(--spacing) * 0);
    border-radius: 50%;
    background-color: var(--color-neutral);
    display: inline-block;
  }

  .indicator-bubble.active::after {
    height: calc(var(--spacing) * 2.25);
    width: calc(var(--spacing) * 2.25);
  }
</style>
