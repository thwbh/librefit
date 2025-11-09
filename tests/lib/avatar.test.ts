import { describe, it, expect } from 'vitest';
import { getAvatar, getAvatarFromUser } from '$lib/avatar';

describe('avatar utilities', () => {
	describe('getAvatar', () => {
		it('should generate avatar data URI from seed', () => {
			const result = getAvatar('test-seed');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should generate different avatars for different seeds', () => {
			const avatar1 = getAvatar('seed1');
			const avatar2 = getAvatar('seed2');

			expect(avatar1).not.toBe(avatar2);
		});

		it('should generate same avatar for same seed', () => {
			const avatar1 = getAvatar('consistent-seed');
			const avatar2 = getAvatar('consistent-seed');

			expect(avatar1).toBe(avatar2);
		});

		it('should handle empty string seed', () => {
			const result = getAvatar('');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should handle special characters in seed', () => {
			const result = getAvatar('test@#$%^&*()');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should handle unicode characters in seed', () => {
			const result = getAvatar('测试🎨');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should handle very long seed strings', () => {
			const longSeed = 'a'.repeat(1000);
			const result = getAvatar(longSeed);

			expect(result).toContain('data:image/svg+xml');
		});
	});

	describe('getAvatarFromUser', () => {
		it('should use avatar parameter when provided', () => {
			const result = getAvatarFromUser('John Doe', 'custom-avatar');

			// Should use 'custom-avatar' as seed
			expect(result).toContain('data:image/svg+xml');
			expect(result).toBe(getAvatar('custom-avatar'));
		});

		it('should fall back to name when avatar is undefined', () => {
			const result = getAvatarFromUser('Jane Smith', undefined);

			// Should use 'Jane Smith' as seed
			expect(result).toBe(getAvatar('Jane Smith'));
		});

		it('should fall back to name when avatar is empty string', () => {
			const result = getAvatarFromUser('Bob Johnson', '');

			// Should use 'Bob Johnson' as seed
			expect(result).toBe(getAvatar('Bob Johnson'));
		});

		it('should handle names with spaces', () => {
			const result = getAvatarFromUser('John William Doe');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should handle single character names', () => {
			const result = getAvatarFromUser('A');

			expect(result).toContain('data:image/svg+xml');
		});

		it('should be consistent with same inputs', () => {
			const result1 = getAvatarFromUser('Test User', 'test-avatar');
			const result2 = getAvatarFromUser('Test User', 'test-avatar');

			expect(result1).toBe(result2);
		});
	});
});
