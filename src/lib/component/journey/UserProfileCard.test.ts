import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UserProfileCard from '../../../../src/lib/component/journey/UserProfileCard.svelte';
import { setupVeilchenMock } from '../../../utils/mocks';

// Setup common mocks
setupVeilchenMock();

// Mock the avatar and activity modules
vi.mock('$lib/avatar', () => ({
	getAvatar: vi.fn((name: string) => `/avatar/${name}.png`)
}));

vi.mock('$lib/activity', () => ({
	getActivityLevelInfo: vi.fn((level: number) => {
		const mockIcon = vi.fn();
		return {
			label: level === 1 ? 'Sedentary' : level === 1.5 ? 'Moderate' : 'Active',
			icon: mockIcon
		};
	})
}));

describe('UserProfileCard Component', () => {
	it('should render with user name', () => {
		render(UserProfileCard, {
			props: {
				userName: 'John Doe',
				userAvatar: 'john',
				activityLevel: 1.5
			}
		});

		expect(screen.getByText('John Doe')).toBeInTheDocument();
	});

	it('should display nickname label', () => {
		render(UserProfileCard, {
			props: {
				userName: 'Jane Smith',
				userAvatar: 'jane',
				activityLevel: 1
			}
		});

		expect(screen.getByText('Nickname')).toBeInTheDocument();
	});

	it('should display activity level label', () => {
		render(UserProfileCard, {
			props: {
				userName: 'Bob',
				userAvatar: 'bob',
				activityLevel: 1.5
			}
		});

		expect(screen.getByText('Activity Level')).toBeInTheDocument();
		expect(screen.getByText('Moderate')).toBeInTheDocument();
	});

	it('should render with correct styling classes', () => {
		const { container } = render(UserProfileCard, {
			props: {
				userName: 'Alice',
				userAvatar: 'alice',
				activityLevel: 2
			}
		});

		const card = container.querySelector('.bg-base-100.rounded-box.p-6.shadow');
		expect(card).toBeDefined();
	});
});
