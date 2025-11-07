# Migration Guide: validated-commands.ts → command-hooks.ts

This guide shows how to migrate from the old `validated-commands.ts` pattern to the new hook-based approach with `tauri-typegen`.

## Overview

The new `tauri-typegen` version generates commands with optional hooks that allow you to plug in error handling and notifications. This eliminates the need for the `validated-commands.ts` wrapper file.

### Before (Old Pattern)
```typescript
import * as api from '$lib/api/validated-commands';

const result = await api.createCalorieTrackerEntry({
  newEntry: { added: '2024-01-01', amount: 500, category: 'l' }
});

if (result.success) {
  console.log('Created:', result.data);
} else {
  // Manually handle error
  console.error(result.error.message);
}
```

### After (New Pattern)
```typescript
import { createCalorieTrackerEntry } from '$lib/api';
import { CommonHooks } from '$lib/api';

// Hooks automatically show toast notifications
const entry = await createCalorieTrackerEntry(
  { newEntry: { added: '2024-01-01', amount: 500, category: 'l' } },
  CommonHooks.create('Entry')
);

// entry is the actual CalorieTracker object (or throws on error)
console.log('Created:', entry);
```

## Key Differences

| Aspect | Old Pattern | New Pattern |
|--------|-------------|-------------|
| **Return Type** | `ValidatedResult<T>` | Direct `T` (or throws) |
| **Error Handling** | Manual `if (result.success)` checks | Automatic via hooks |
| **Notifications** | Manual toast calls | Automatic via hooks |
| **Validation** | Explicit Zod parsing | Built into generated commands |
| **Code Location** | Wrapper in `validated-commands.ts` | Hooks in `command-hooks.ts` |

## Migration Examples

### 1. Create Operations

**Before:**
```typescript
import { createCalorieTrackerEntry } from '$lib/api/validated-commands';

const result = await createCalorieTrackerEntry({
  newEntry: { added: dateStr, amount: calories, category: 'l' }
});

if (result.success) {
  toast.success('Entry created');
  entries = [...entries, result.data];
} else {
  toast.error(result.error.message);
}
```

**After:**
```typescript
import { createCalorieTrackerEntry, CommonHooks } from '$lib/api';

try {
  const entry = await createCalorieTrackerEntry(
    { newEntry: { added: dateStr, amount: calories, category: 'l' } },
    CommonHooks.create('Entry')
  );
  // Success toast shown automatically
  entries = [...entries, entry];
} catch (error) {
  // Error toast shown automatically
  // Optional: additional error handling here
}
```

### 2. Update Operations

**Before:**
```typescript
import { updateCalorieTrackerEntry } from '$lib/api/validated-commands';

const result = await updateCalorieTrackerEntry({
  updatedEntry: modifiedEntry
});

if (result.success) {
  toast.success('Entry updated');
  // Update local state
} else {
  toast.error(result.error.message);
}
```

**After:**
```typescript
import { updateCalorieTrackerEntry, CommonHooks } from '$lib/api';

const updated = await updateCalorieTrackerEntry(
  { updatedEntry: modifiedEntry },
  CommonHooks.update('Entry')
);
// Success toast shown automatically
```

### 3. Delete Operations

**Before:**
```typescript
import { deleteCalorieTrackerEntry } from '$lib/api/validated-commands';

const result = await deleteCalorieTrackerEntry({ trackerId: id });

if (result.success) {
  toast.success('Entry deleted');
  entries = entries.filter(e => e.id !== id);
} else {
  toast.error(result.error.message);
}
```

**After:**
```typescript
import { deleteCalorieTrackerEntry, CommonHooks } from '$lib/api';

await deleteCalorieTrackerEntry(
  { trackerId: id },
  CommonHooks.delete('Entry')
);
// Success toast shown automatically
entries = entries.filter(e => e.id !== id);
```

### 4. Read Operations (No Validation Needed)

**Before:**
```typescript
import { dailyDashboard } from '$lib/api/validated-commands';

const dashboard = await dailyDashboard({ date: dateStr });
```

**After:**
```typescript
import { dailyDashboard, createSilentHooks } from '$lib/api';

// Option 1: No hooks (throws on error)
const dashboard = await dailyDashboard({ date: dateStr });

// Option 2: Silent hooks (logs errors, no toasts)
const dashboard = await dailyDashboard(
  { date: dateStr },
  createSilentHooks('Failed to load dashboard')
);

// Option 3: With error toasts
const dashboard = await dailyDashboard(
  { date: dateStr },
  CommonHooks.read('Failed to load dashboard')
);
```

### 5. Custom Success Messages

**Before:**
```typescript
const result = await wizardCreateTargets({ input: wizardData });

if (result.success) {
  toast.success('Setup complete! Welcome to LibreFit!');
  goto('/');
} else {
  toast.error(result.error.message);
}
```

**After:**
```typescript
import { wizardCreateTargets, createCommandHooks } from '$lib/api';

await wizardCreateTargets(
  { input: wizardData },
  createCommandHooks({
    successMessage: 'Setup complete! Welcome to LibreFit!',
    errorContext: 'Failed to complete setup'
  })
);
goto('/');
```

### 6. Custom Hook Behavior

**Before:**
```typescript
const result = await updateUser({ user: userData });

if (result.success) {
  toast.success('Profile updated');
  // Refresh data
  await loadUserProfile();
  goto('/profile');
} else {
  toast.error(result.error.message);
}
```

**After:**
```typescript
import { updateUser, createCommandHooks } from '$lib/api';

const baseHooks = createCommandHooks({
  successMessage: 'Profile updated',
  errorContext: 'Failed to update profile'
});

const user = await updateUser(
  { user: userData },
  {
    ...baseHooks,
    onSuccess: async (user) => {
      baseHooks.onSuccess?.(user);
      // Custom behavior
      await loadUserProfile();
      goto('/profile');
    }
  }
);
```

## Available Hook Configurations

### CommonHooks (Pre-configured)

```typescript
import { CommonHooks } from '$lib/api';

// For create operations
CommonHooks.create('Entity Name')
// Shows: "Entity Name created successfully"

// For update operations
CommonHooks.update('Entity Name')
// Shows: "Entity Name updated successfully"

// For delete operations
CommonHooks.delete('Entity Name')
// Shows: "Entity Name deleted successfully"

// For read operations (only shows errors)
CommonHooks.read('Error context message')
```

### createCommandHooks (Custom Configuration)

```typescript
import { createCommandHooks } from '$lib/api';

createCommandHooks({
  successMessage: 'Custom success message',
  errorContext: 'Custom error prefix',
  successDuration: 3000,  // ms
  errorDuration: 5000,    // ms
  showValidationErrors: true,
  showInvokeErrors: true
})
```

### createSilentHooks (No Toasts)

```typescript
import { createSilentHooks } from '$lib/api';

// Only logs errors, no toast notifications
createSilentHooks('Optional error context')
```

## Files to Update

After migration, these files can be deleted:

1. ✅ `src/lib/api/validated-commands.ts` - Replaced by hooks
2. ✅ `src/lib/api/error-handler.ts` - Error handling moved to hooks

These files should be updated:

1. Any component using `validated-commands` imports
2. `src/lib/api/index.ts` - Already updated to export new hooks

## Error Handling Changes

### Old Pattern (Manual)
```typescript
const result = await api.someCommand(params);

if (!result.success) {
  switch (result.error.type) {
    case ApiErrorType.VALIDATION:
      // Handle validation error
      break;
    case ApiErrorType.NOT_FOUND:
      // Handle not found
      break;
    default:
      // Handle other errors
  }
}
```

### New Pattern (Automatic + Optional Custom)
```typescript
try {
  const data = await someCommand(params, CommonHooks.create('Item'));
  // Hooks already showed appropriate toast
} catch (error) {
  // Optional: custom error handling for specific cases
  if (error instanceof ZodError) {
    // Validation error (already shown via onValidationError hook)
  } else {
    // Invoke error (already shown via onInvokeError hook)
  }
}
```

## Benefits of Migration

1. **Less Boilerplate**: No more manual `if (result.success)` checks
2. **Automatic Notifications**: Toast messages shown automatically
3. **Type Safety**: Direct return types instead of wrapped `ValidatedResult`
4. **Consistency**: Same error handling across all API calls
5. **Composability**: Easy to extend hooks with custom behavior
6. **Maintainability**: No need to maintain wrapper functions

## Checklist

- [ ] Build project with new `tauri-typegen` to generate commands with hooks
- [ ] Create `command-hooks.ts` file (already done)
- [ ] Update `index.ts` exports (already done)
- [ ] Find all imports from `validated-commands`
- [ ] Replace with new hook-based pattern
- [ ] Test all CRUD operations
- [ ] Verify toast notifications work
- [ ] Delete `validated-commands.ts`
- [ ] Delete `error-handler.ts` (if no longer needed)
- [ ] Update any tests that rely on `ValidatedResult` pattern

## Need Help?

Common hooks cover most use cases:
- `CommonHooks.create('Name')` - Create operations
- `CommonHooks.update('Name')` - Update operations
- `CommonHooks.delete('Name')` - Delete operations
- `CommonHooks.read('Context')` - Read operations

For custom behavior, use `createCommandHooks()` with options or extend hooks with `{ ...baseHooks, onSuccess: ... }`.
