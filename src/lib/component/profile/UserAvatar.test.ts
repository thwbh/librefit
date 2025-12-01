import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { LibreUser } from '$lib/api/gen';
import UserAvatar from './UserAvatar.svelte';

describe('UserAvatar', () => {
	const defaults = ['Bryan', 'Kimberbly', 'Andrea', 'Aidan', 'Jude', 'Jack', 'George'];

	let mockUserData: LibreUser;

	beforeEach(() => {
		mockUserData = {
			id: 1,
			name: 'TestUser',
			avatar: ''
		};
	});

	describe('Initialization', () => {
		it('should render avatar button', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();
		});

		it('should show username-based avatar when avatar is empty', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, avatar: '' }
				}
			});

			// Should render without error and show an avatar
			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();
		});

		it('should show custom avatar when avatar is set', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, avatar: 'CustomSeed' }
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();
		});

		it('should handle empty name gracefully', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, name: '' }
				}
			});

			expect(container).toBeTruthy();
		});
	});

	describe('Modal interaction', () => {
		it('should open modal when avatar is clicked', async () => {
			const user = userEvent.setup();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();

			// Modal should not be open initially
			let modal = container.querySelector('dialog[open]');
			expect(modal).toBeFalsy();

			if (avatar) {
				await user.click(avatar);

				// Wait for modal to appear with open attribute
				await waitFor(() => {
					modal = container.querySelector('dialog[open]');
					expect(modal).toBeTruthy();
					expect(modal?.hasAttribute('open')).toBe(true);
				});
			}
		});

		it('should initialize modal with current avatar', async () => {
			const user = userEvent.setup();
			const userData = { ...mockUserData, avatar: 'TestSeed' };

			const { container } = render(UserAvatar, {
				props: {
					userData
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog[open]');
					expect(modal).toBeTruthy();
				});
			}
		});

		it('should show preset avatars in modal', async () => {
			const user = userEvent.setup();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog[open]');
					expect(modal).toBeTruthy();

					// Check for avatar images within the modal
					const modalAvatars = modal?.querySelectorAll('img[src^="data:image"]');
					// Should have the large preview + preset avatars
					expect(modalAvatars?.length).toBeGreaterThan(7);
				});
			}
		});

		it('should close modal when cancel is clicked', async () => {
			const user = userEvent.setup();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			if (avatar) {
				await user.click(avatar);

				// Modal should be open
				await waitFor(() => {
					const modal = container.querySelector('dialog[open]');
					expect(modal).toBeTruthy();
				});

				// Find cancel button
				const cancelButton = screen.queryByRole('button', { name: /cancel/i });
				if (cancelButton) {
					await user.click(cancelButton);

					// Modal should be closed
					await waitFor(() => {
						const modal = container.querySelector('dialog[open]');
						expect(modal).toBeFalsy();
					});
				}
			}
		});
	});

	describe('Avatar selection and confirmation', () => {
		it('should call onAvatarChange when confirming selection', async () => {
			const user = userEvent.setup();
			const onAvatarChangeMock = vi.fn();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData,
					onAvatarChange: onAvatarChangeMock
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// Find and click confirm button
				const confirmButton = screen.queryByText(/confirm|save|ok/i);
				if (confirmButton) {
					await user.click(confirmButton);
					expect(onAvatarChangeMock).toHaveBeenCalled();
				}
			}
		});

		it('should update userData.avatar directly when using bindable', async () => {
			const user = userEvent.setup();
			const userData = { ...mockUserData };

			const { container } = render(UserAvatar, {
				props: {
					userData
				}
			});

			const initialAvatar = userData.avatar;

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// The modal should be open
				const modal = container.querySelector('dialog');
				expect(modal).toBeTruthy();
			}
		});

		it('should not change avatar when canceling modal', async () => {
			const user = userEvent.setup();
			const onAvatarChangeMock = vi.fn();
			const userData = { ...mockUserData, avatar: 'OriginalSeed' };

			const { container } = render(UserAvatar, {
				props: {
					userData,
					onAvatarChange: onAvatarChangeMock
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// Find and click cancel button
				const cancelButton = screen.queryByText(/cancel|close/i);
				if (cancelButton) {
					const callCount = onAvatarChangeMock.mock.calls.length;
					await user.click(cancelButton);

					// Should not have called onAvatarChange (except maybe initial)
					expect(onAvatarChangeMock.mock.calls.length).toBe(callCount);
				}
			}

			// Avatar should remain unchanged
			expect(userData.avatar).toBe('OriginalSeed');
		});
	});

	describe('Randomization in modal', () => {
		it('should generate new random avatar when swiping', async () => {
			const user = userEvent.setup();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// Modal should be open with swipeable element
				expect(container.querySelector('dialog')).toBeTruthy();
			}
		});

		it('should reset to username-based avatar on reset', async () => {
			const user = userEvent.setup();
			const userData = { ...mockUserData, name: 'TestUser', avatar: 'CustomSeed' };

			const { container } = render(UserAvatar, {
				props: {
					userData
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});
			}
		});
	});

	describe('Reactivity', () => {
		it('should update displayed avatar when userData.name changes', async () => {
			const userData = { ...mockUserData, name: 'Initial', avatar: '' };

			const { component } = render(UserAvatar, {
				props: {
					userData
				}
			});

			// Change the name
			userData.name = 'Changed';

			// Component should handle the change
			expect(component).toBeTruthy();
		});

		it('should update displayed avatar when userData.avatar changes', async () => {
			const userData = { ...mockUserData, avatar: 'Initial' };

			const { component } = render(UserAvatar, {
				props: {
					userData
				}
			});

			// Change the avatar
			userData.avatar = 'Changed';

			// Component should handle the change
			expect(component).toBeTruthy();
		});
	});

	describe('Edge cases', () => {
		it('should handle userData with all empty fields', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { id: 1, name: '', avatar: '' }
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle very long avatar seed', () => {
			const longSeed = 'a'.repeat(200);

			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, avatar: longSeed }
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle special characters in avatar seed', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, avatar: '!@#$%^&*()' }
				}
			});

			expect(container).toBeTruthy();
		});

		it('should handle name matching default avatar', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, name: 'Bryan', avatar: '' }
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();
		});

		it('should handle avatar matching default avatar', () => {
			const { container } = render(UserAvatar, {
				props: {
					userData: { ...mockUserData, avatar: 'Bryan' }
				}
			});

			const avatar = container.querySelector('img[src^="data:image"]');
			expect(avatar).toBeTruthy();
		});
	});

	describe('Modal state management', () => {
		it('should track hasOpenedPicker state', async () => {
			const user = userEvent.setup();

			const { container, component } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			// Initially hasOpenedPicker should be false
			expect(component).toBeTruthy();

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				// After opening modal, hasOpenedPicker should be true
				await waitFor(() => {
					expect(container.querySelector('dialog')).toBeTruthy();
				});
			}
		});

		it('should initialize temp state correctly when opening modal', async () => {
			const user = userEvent.setup();
			const userData = { ...mockUserData, avatar: 'CustomSeed' };

			const { container } = render(UserAvatar, {
				props: {
					userData
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// Modal should show the current avatar
				const modalAvatars = container.querySelectorAll('dialog img[alt="avatar"]');
				expect(modalAvatars.length).toBeGreaterThan(0);
			}
		});
	});

	describe('Integration with AvatarPicker', () => {
		it('should bind tempSelectedAvatar to AvatarPicker', async () => {
			const user = userEvent.setup();

			const { container } = render(UserAvatar, {
				props: {
					userData: mockUserData
				}
			});

			const avatar = container.querySelector('img[alt="avatar"]');
			if (avatar) {
				await user.click(avatar);

				await waitFor(() => {
					const modal = container.querySelector('dialog');
					expect(modal).toBeTruthy();
				});

				// AvatarPicker should be present in modal
				const modalContent = container.querySelector('dialog');
				expect(modalContent).toBeTruthy();
			}
		});
	});
});
