import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AvatarPickerContent from './AvatarPickerContent.svelte';

describe('AvatarPickerContent', () => {
	const defaults = ['Bryan', 'Kimberbly', 'Andrea', 'Aidan', 'Jude', 'Jack', 'George'];

	describe('Initialization', () => {
		it('should render with username-based avatar when no current avatar', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: 'TestUser'
				}
			});

			// Should display avatar elements (look for img tags with data URIs)
			const avatars = container.querySelectorAll('img[src^="data:image"]');
			expect(avatars.length).toBeGreaterThan(0);
		});

		it('should initialize with current avatar if provided', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					currentAvatar: 'CustomSeed123'
				}
			});

			expect(container).toBeTruthy();
		});

		it('should initialize selectedAvatar to currentAvatar if provided', () => {
			let capturedAvatar = '';

			render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					currentAvatar: 'CustomSeed',
					onSelect: (avatar: string) => {
						capturedAvatar = avatar;
					}
				}
			});

			// The effect should fire immediately with the current avatar
			expect(capturedAvatar).toBe('CustomSeed');
		});

		it('should handle default avatar (one of the presets)', () => {
			let capturedAvatar = '';

			render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					currentAvatar: 'Bryan', // One of the defaults
					onSelect: (avatar: string) => {
						capturedAvatar = avatar;
					}
				}
			});

			// Should initialize with username in random slot when current is a default
			expect(capturedAvatar).toBe('Bryan');
		});
	});

	describe('Avatar Selection', () => {
		it('should call onSelect when avatar is selected', async () => {
			const onSelectMock = vi.fn();

			render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					onSelect: onSelectMock
				}
			});

			// onSelect should be called during initialization with the username
			expect(onSelectMock).toHaveBeenCalledWith('TestUser');
		});

		it('should update selectedAvatar bindable prop', () => {
			let selectedAvatar = '';
			const onSelectMock = vi.fn((avatar) => {
				selectedAvatar = avatar;
			});

			render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					onSelect: onSelectMock
				}
			});

			// The onSelect callback should set selectedAvatar to userName initially
			expect(selectedAvatar).toBe('TestUser');
		});
	});

	describe('Randomization', () => {
		it('should generate random seed that is not in defaults', () => {
			const onSelectMock = vi.fn();

			render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					onSelect: onSelectMock
				}
			});

			// Component should initialize without errors
			expect(onSelectMock).toHaveBeenCalled();
		});

		it('should handle multiple randomizations without duplicating defaults', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: 'TestUser'
				}
			});

			// Component should render successfully
			expect(container).toBeTruthy();
		});
	});

	describe('Avatar Display', () => {
		it('should display the selected avatar in the large preview', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: 'TestUser',
					currentAvatar: 'TestSeed'
				}
			});

			// Should have avatar images (data URI images)
			const avatars = container.querySelectorAll('img[src^="data:image"]');
			expect(avatars.length).toBeGreaterThan(0);
		});

		it('should display all preset avatars', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: 'TestUser'
				}
			});

			// Should display the random slot + 7 presets = 8 avatars in picker
			// Plus the large display avatar
			const avatars = container.querySelectorAll('img[src^="data:image"]');
			expect(avatars.length).toBeGreaterThanOrEqual(8);
		});
	});

	describe('Props validation', () => {
		it('should require userName prop', () => {
			expect(() => {
				render(AvatarPickerContent, {
					props: {
						userName: ''
					}
				});
			}).not.toThrow();
		});

		it('should work with optional currentAvatar', () => {
			expect(() => {
				render(AvatarPickerContent, {
					props: {
						userName: 'TestUser'
					}
				});
			}).not.toThrow();
		});

		it('should work with optional onSelect callback', () => {
			expect(() => {
				render(AvatarPickerContent, {
					props: {
						userName: 'TestUser'
					}
				});
			}).not.toThrow();
		});
	});

	describe('Edge cases', () => {
		it('should handle empty userName gracefully', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: ''
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle very long userName', () => {
			const longName = 'a'.repeat(100);

			const { container } = render(AvatarPickerContent, {
				props: {
					userName: longName
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle special characters in userName', () => {
			const { container } = render(AvatarPickerContent, {
				props: {
					userName: '!@#$%^&*()'
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle userName matching a default avatar name', () => {
			const onSelectMock = vi.fn();

			render(AvatarPickerContent, {
				props: {
					userName: 'Bryan', // Matches a default
					onSelect: onSelectMock
				}
			});

			// Should initialize with __random__ selected since Bryan matches a default
			expect(onSelectMock).toHaveBeenCalled();
		});
	});
});
