/**
 * User Profile Context
 *
 * Provides reactive user profile data to all components without prop drilling.
 * Set once at layout level, accessible and updatable anywhere in the component tree.
 */

import { getContext, setContext } from 'svelte';
import type { LibreUser } from '$lib/api/gen';

const USER_CONTEXT_KEY = Symbol('user-profile');

interface UserState {
	user: LibreUser;
	updateUser: (newUser: LibreUser) => void;
}

export function setUserContext(initialUser: LibreUser) {
	let user = $state(initialUser);

	const userState: UserState = {
		get user() {
			return user;
		},
		updateUser: (newUser: LibreUser) => {
			user = newUser;
		}
	};

	setContext(USER_CONTEXT_KEY, userState);
}

export function getUserContext(): UserState {
	const userState = getContext<UserState>(USER_CONTEXT_KEY);

	if (!userState) {
		throw new Error('User context not found. Make sure setUserContext() is called in a parent component.');
	}

	return userState;
}

/**
 * Optional: Get user context without throwing if not found
 * Useful for components that work with or without user data
 */
export function tryGetUserContext(): UserState | null {
	return getContext<UserState | null>(USER_CONTEXT_KEY) ?? null;
}
