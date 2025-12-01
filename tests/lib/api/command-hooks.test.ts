import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCommandHooks, createSilentHooks, CommonHooks } from '$lib/api/command-hooks';
import { ZodError, type ZodIssue } from 'zod';

// Mock dependencies
vi.mock('@thwbh/veilchen', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	error: vi.fn()
}));

describe('command-hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createCommandHooks', () => {
		it('should create hooks with default options', () => {
			const hooks = createCommandHooks();

			expect(hooks).toHaveProperty('onValidationError');
			expect(hooks).toHaveProperty('onInvokeError');
			expect(hooks.onSuccess).toBeUndefined();
		});

		it('should create onSuccess hook when successMessage provided', () => {
			const hooks = createCommandHooks({ successMessage: 'Success!' });

			expect(hooks.onSuccess).toBeDefined();
		});

		it('should call toast.error on validation error', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks();
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['field'],
					message: 'Expected string'
				} as ZodIssue
			]);

			hooks.onValidationError?.(zodError);

			expect(toast.error).toHaveBeenCalledWith('field: Expected string', 5000);
		});

		it('should include error context in validation error', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks({ errorContext: 'Failed to save' });
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['name'],
					message: 'Required'
				} as ZodIssue
			]);

			hooks.onValidationError?.(zodError);

			expect(toast.error).toHaveBeenCalledWith('Failed to save: name: Required', 5000);
		});

		it('should call toast.error on invoke error', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks();
			const error = new Error('Database connection failed');

			hooks.onInvokeError?.(error);

			expect(toast.error).toHaveBeenCalledWith('Database connection failed', 5000);
		});

		it('should include error context in invoke error', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks({ errorContext: 'Failed to load data' });
			const error = new Error('Network timeout');

			hooks.onInvokeError?.(error);

			expect(toast.error).toHaveBeenCalledWith('Failed to load data: Network timeout', 5000);
		});

		it('should call toast.success on success', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks({ successMessage: 'Data saved successfully' });

			hooks.onSuccess?.(undefined);

			expect(toast.success).toHaveBeenCalledWith('Data saved successfully', 3000);
		});

		it('should use custom success duration', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks({
				successMessage: 'Done',
				successDuration: 1000
			});

			hooks.onSuccess?.(undefined);

			expect(toast.success).toHaveBeenCalledWith('Done', 1000);
		});

		it('should use custom error duration', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createCommandHooks({ errorDuration: 10000 });
			const error = new Error('Test error');

			hooks.onInvokeError?.(error);

			expect(toast.error).toHaveBeenCalledWith('Test error', 10000);
		});

		it('should not show validation errors when showValidationErrors is false', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createCommandHooks({ showValidationErrors: false });
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['field'],
					message: 'Expected string'
				} as ZodIssue
			]);

			hooks.onValidationError?.(zodError);

			expect(toast.error).not.toHaveBeenCalled();
			expect(logError).toHaveBeenCalled(); // Still logs
		});

		it('should not show invoke errors when showInvokeErrors is false', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createCommandHooks({ showInvokeErrors: false });
			const error = new Error('Test error');

			hooks.onInvokeError?.(error);

			expect(toast.error).not.toHaveBeenCalled();
			expect(logError).toHaveBeenCalled(); // Still logs
		});

		it('should log validation errors', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createCommandHooks();
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['field'],
					message: 'Expected string'
				} as ZodIssue
			]);

			hooks.onValidationError?.(zodError);

			expect(logError).toHaveBeenCalledWith('[Validation Error] field: Expected string');
		});

		it('should log invoke errors', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createCommandHooks();
			const error = new Error('Test error');

			hooks.onInvokeError?.(error);

			expect(logError).toHaveBeenCalledWith('[Invoke Error] Test error');
		});
	});

	describe('createSilentHooks', () => {
		it('should create hooks without toast notifications', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = createSilentHooks();
			const error = new Error('Test error');

			hooks.onValidationError?.(
				new ZodError([
					{
						code: 'invalid_type',
						expected: 'string',
						path: ['field'],
						message: 'Expected string'
					} as ZodIssue
				])
			);
			hooks.onInvokeError?.(error);

			expect(toast.success).not.toHaveBeenCalled();
			expect(toast.error).not.toHaveBeenCalled();
		});

		it('should log validation errors', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createSilentHooks('Background operation');
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					path: ['field'],
					message: 'Expected string'
				} as ZodIssue
			]);

			hooks.onValidationError?.(zodError);

			expect(logError).toHaveBeenCalledWith(
				'[Validation Error] Background operation: field: Expected string'
			);
		});

		it('should log invoke errors', async () => {
			const { error: logError } = await import('@tauri-apps/plugin-log');
			const hooks = createSilentHooks('Background operation');
			const error = new Error('Failed to sync');

			hooks.onInvokeError?.(error);

			expect(logError).toHaveBeenCalledWith('[Invoke Error] Background operation: Failed to sync');
		});

		it('should not have onSuccess hook', () => {
			const hooks = createSilentHooks();

			expect(hooks.onSuccess).toBeUndefined();
		});
	});

	describe('CommonHooks', () => {
		it('should create hooks for create operation', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.create('User');

			hooks.onSuccess?.(undefined);

			expect(toast.success).toHaveBeenCalledWith('User created successfully', 3000);
		});

		it('should create hooks for update operation', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.update('Profile');

			hooks.onSuccess?.(undefined);

			expect(toast.success).toHaveBeenCalledWith('Profile updated successfully', 3000);
		});

		it('should create hooks for delete operation', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.delete('Entry');

			hooks.onSuccess?.(undefined);

			expect(toast.success).toHaveBeenCalledWith('Entry deleted successfully', 3000);
		});

		it('should lowercase entity name in error context', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.create('User');
			const error = new Error('Database error');

			hooks.onInvokeError?.(error);

			expect(toast.error).toHaveBeenCalledWith('Failed to create user: Database error', 5000);
		});

		it('should create read hooks without success message', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.read('Failed to load users');

			expect(hooks.onSuccess).toBeUndefined();

			hooks.onInvokeError?.(new Error('Connection failed'));

			expect(toast.error).toHaveBeenCalledWith('Failed to load users: Connection failed', 5000);
		});

		it('should create read hooks without error context', async () => {
			const { toast } = await import('@thwbh/veilchen');
			const hooks = CommonHooks.read();

			expect(hooks.onSuccess).toBeUndefined();

			hooks.onInvokeError?.(new Error('Error'));

			expect(toast.error).toHaveBeenCalledWith('Error', 5000);
		});
	});
});
