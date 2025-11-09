# Command Hooks - Example Usage

This file demonstrates how to use the new hook-based API pattern with real-world examples from LibreFit.

## Basic CRUD Operations

### Creating a Calorie Entry

```svelte
<script lang="ts">
import { createCalorieTrackerEntry, CommonHooks } from '$lib/api';
import type { NewCalorieTracker } from '$lib/api';

let entries = $state<CalorieTracker[]>([]);

async function addEntry(newEntry: NewCalorieTracker) {
  // CommonHooks.create() automatically shows:
  // - Success toast: "Entry created successfully"
  // - Error toast: "Failed to create entry: [error message]"
  const entry = await createCalorieTrackerEntry(
    { newEntry },
    CommonHooks.create('Entry')
  );

  // Only runs if successful (otherwise throws and caught by error boundary)
  entries = [...entries, entry];
}
</script>
```

### Updating an Entry

```svelte
<script lang="ts">
import { updateCalorieTrackerEntry, CommonHooks } from '$lib/api';

async function saveEdit(updatedEntry: CalorieTracker) {
  const entry = await updateCalorieTrackerEntry(
    { updatedEntry },
    CommonHooks.update('Entry')
  );

  // Update in local array
  entries = entries.map(e => e.id === entry.id ? entry : e);

  // Close modal
  editDialog?.close();
}
</script>
```

### Deleting an Entry

```svelte
<script lang="ts">
import { deleteCalorieTrackerEntry, CommonHooks } from '$lib/api';

async function removeEntry(trackerId: number) {
  await deleteCalorieTrackerEntry(
    { trackerId },
    CommonHooks.delete('Entry')
  );

  // Remove from local state
  entries = entries.filter(e => e.id !== trackerId);
}
</script>
```

## Custom Success Messages

### Wizard Completion

```svelte
<script lang="ts">
import { wizardCreateTargets, createCommandHooks } from '$lib/api';
import { goto } from '$app/navigation';

async function completeWizard(wizardInput: WizardInput) {
  await wizardCreateTargets(
    { input: wizardInput },
    createCommandHooks({
      successMessage: 'Setup complete! Welcome to LibreFit! 🎉',
      errorContext: 'Failed to complete setup',
      successDuration: 5000  // Show longer for important message
    })
  );

  goto('/');
}
</script>
```

### Profile Update with Navigation

```svelte
<script lang="ts">
import { updateUser, createCommandHooks } from '$lib/api';
import { goto } from '$app/navigation';

async function saveProfile(user: LibreUser) {
  const baseHooks = createCommandHooks({
    successMessage: 'Profile saved successfully!',
    errorContext: 'Failed to save profile'
  });

  await updateUser(
    { user },
    {
      ...baseHooks,
      onSuccess: (updatedUser) => {
        // Call original success handler (shows toast)
        baseHooks.onSuccess?.(updatedUser);

        // Custom navigation
        goto('/profile');
      }
    }
  );
}
</script>
```

## Silent Operations (No Toasts)

### Background Data Refresh

```svelte
<script lang="ts">
import { dailyDashboard, createSilentHooks } from '$lib/api';
import { onMount } from 'svelte';

let dashboard = $state<DailyDashboard>();

onMount(async () => {
  // Refresh every 5 minutes without showing toasts
  setInterval(async () => {
    dashboard = await dailyDashboard(
      { date: getDateAsStr(new Date()) },
      createSilentHooks('Background refresh failed')
    );
  }, 5 * 60 * 1000);
});
</script>
```

### Polling for Updates

```svelte
<script lang="ts">
import { getTrackerHistory, createSilentHooks } from '$lib/api';

async function pollHistory() {
  try {
    const history = await getTrackerHistory(
      {
        dateFromStr: startDate,
        dateToStr: endDate
      },
      createSilentHooks('Failed to fetch history')
    );

    // Only logs errors, doesn't show toasts to user
    return history;
  } catch (error) {
    // Error already logged by silent hooks
    return null;
  }
}
</script>
```

## Error Handling with Custom Logic

### Retry on Failure

```svelte
<script lang="ts">
import { createWeightTrackerEntry, createCommandHooks } from '$lib/api';
import { ZodError } from 'zod';

async function addWeightWithRetry(newEntry: NewWeightTracker, retries = 3) {
  const hooks = createCommandHooks({
    successMessage: 'Weight recorded',
    errorContext: 'Failed to record weight'
  });

  for (let i = 0; i < retries; i++) {
    try {
      return await createWeightTrackerEntry(
        { newEntry },
        {
          ...hooks,
          onInvokeError: (error) => {
            if (i < retries - 1) {
              // Don't show toast for retries
              console.log(`Retry ${i + 1}/${retries}`);
            } else {
              // Show toast on final failure
              hooks.onInvokeError?.(error);
            }
          }
        }
      );
    } catch (error) {
      if (error instanceof ZodError || i === retries - 1) {
        throw error; // Don't retry validation errors or final attempt
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
</script>
```

### Validation Error Handling

```svelte
<script lang="ts">
import { createCalorieTrackerEntry, createCommandHooks } from '$lib/api';
import { ZodError } from 'zod';

let validationErrors = $state<Record<string, string>>({});

async function addEntryWithValidation(newEntry: NewCalorieTracker) {
  validationErrors = {}; // Clear previous errors

  try {
    const entry = await createCalorieTrackerEntry(
      { newEntry },
      createCommandHooks({
        successMessage: 'Entry added',
        errorContext: 'Failed to add entry',
        showValidationErrors: false  // We'll handle these ourselves
      })
    );

    return entry;
  } catch (error) {
    if (error instanceof ZodError) {
      // Extract field-specific errors
      error.issues.forEach(issue => {
        const field = issue.path.join('.');
        validationErrors[field] = issue.message;
      });
    }
    throw error;
  }
}
</script>

<!-- Show field-level errors -->
<input type="number" bind:value={amount} />
{#if validationErrors.amount}
  <span class="text-error text-sm">{validationErrors.amount}</span>
{/if}
```

## Read Operations with Error Display

### Dashboard Load

```svelte
<script lang="ts">
import { dailyDashboard, CommonHooks } from '$lib/api';

let dashboard = $state<DailyDashboard>();
let loading = $state(true);

async function loadDashboard(date: string) {
  loading = true;
  try {
    // Shows error toast if fails, no success toast
    dashboard = await dailyDashboard(
      { date },
      CommonHooks.read('Failed to load dashboard')
    );
  } finally {
    loading = false;
  }
}
</script>

{#if loading}
  <div class="loading loading-spinner"></div>
{:else if dashboard}
  <!-- Display dashboard -->
{/if}
```

### History with Custom Error Message

```svelte
<script lang="ts">
import { getTrackerHistory, createCommandHooks } from '$lib/api';

async function loadHistory(startDate: Date, endDate: Date) {
  return await getTrackerHistory(
    {
      dateFromStr: getDateAsStr(startDate),
      dateToStr: getDateAsStr(endDate)
    },
    createCommandHooks({
      errorContext: `Failed to load history from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      showInvokeErrors: true,
      showValidationErrors: true
    })
  );
}
</script>
```

## Batch Operations

### Bulk Delete with Progress

```svelte
<script lang="ts">
import { deleteCalorieTrackerEntry, createCommandHooks } from '$lib/api';

async function deleteMultiple(trackerIds: number[]) {
  let deleted = 0;

  for (const id of trackerIds) {
    try {
      await deleteCalorieTrackerEntry(
        { trackerId: id },
        createCommandHooks({
          // Don't show individual success toasts
          showValidationErrors: true,
          showInvokeErrors: true
        })
      );
      deleted++;
    } catch (error) {
      // Error already shown via hooks
      console.error(`Failed to delete ${id}`);
    }
  }

  // Show summary toast
  if (deleted === trackerIds.length) {
    toast.success(`Deleted ${deleted} entries`);
  } else {
    toast.warning(`Deleted ${deleted} of ${trackerIds.length} entries`);
  }

  // Refresh list
  await loadEntries();
}
</script>
```

## Integration with Forms

### Form Submission with Loading State

```svelte
<script lang="ts">
import { createCalorieTrackerEntry, CommonHooks } from '$lib/api';

let formData = $state<NewCalorieTracker>({
  added: getDateAsStr(new Date()),
  amount: 0,
  category: 'l'
});
let submitting = $state(false);

async function handleSubmit() {
  if (submitting) return;

  submitting = true;
  try {
    const entry = await createCalorieTrackerEntry(
      { newEntry: formData },
      CommonHooks.create('Entry')
    );

    // Reset form on success
    formData = {
      added: getDateAsStr(new Date()),
      amount: 0,
      category: 'l'
    };

    // Close modal
    dialog?.close();
  } finally {
    submitting = false;
  }
}
</script>

<form onsubmit={handleSubmit}>
  <!-- form fields -->
  <button type="submit" disabled={submitting} class="btn btn-primary">
    {#if submitting}
      <span class="loading loading-spinner"></span>
      Saving...
    {:else}
      Save
    {/if}
  </button>
</form>
```

## Advanced: Optimistic Updates

```svelte
<script lang="ts">
import { updateCalorieTrackerEntry, createCommandHooks } from '$lib/api';

let entries = $state<CalorieTracker[]>([]);

async function optimisticUpdate(updatedEntry: CalorieTracker) {
  // Store original for rollback
  const originalEntries = [...entries];

  // Update UI immediately
  entries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);

  try {
    // Update backend with custom error handling
    const hooks = createCommandHooks({
      successMessage: 'Entry updated',
      errorContext: 'Failed to update entry',
      showInvokeErrors: false  // We'll handle this ourselves
    });

    await updateCalorieTrackerEntry(
      { updatedEntry },
      {
        ...hooks,
        onInvokeError: (error) => {
          // Rollback on error
          entries = originalEntries;
          // Now show the error
          hooks.onInvokeError?.(error);
        }
      }
    );
  } catch (error) {
    // Already rolled back and shown error in onInvokeError
  }
}
</script>
```

## Tips

1. **Use CommonHooks for standard operations** - They cover 90% of use cases
2. **Use createSilentHooks for background tasks** - Prevents toast spam
3. **Extend hooks for custom behavior** - Use `{ ...baseHooks, onSuccess: ... }`
4. **Don't show success toasts for reads** - Use `CommonHooks.read()` which only shows errors
5. **Customize messages for important operations** - Like wizard completion, profile updates
6. **Handle validation errors at the field level** - Set `showValidationErrors: false` and extract from ZodError
7. **Use longer durations for critical messages** - Default is 3s for success, 5s for errors
