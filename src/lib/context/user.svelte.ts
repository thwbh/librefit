/**
 * User Profile Context
 *
 * Provides user profile data to all components without prop drilling.
 * Set once at layout level, accessible anywhere in the component tree.
 */

import { getContext, setContext } from 'svelte';
import type { LibreUser } from '$lib/api/gen';

const USER_CONTEXT_KEY = Symbol('user-profile');

export function setUserContext(user: LibreUser) {
	setContext(USER_CONTEXT_KEY, user);
}

export function getUserContext(): LibreUser {
	const user = getContext<LibreUser>(USER_CONTEXT_KEY);

	if (!user) {
		throw new Error('User context not found. Make sure setUserContext() is called in a parent component.');
	}

	return user;
}

/**
 * Optional: Get user context without throwing if not found
 * Useful for components that work with or without user data
 */
export function tryGetUserContext(): LibreUser | null {
	return getContext<LibreUser | null>(USER_CONTEXT_KEY) ?? null;
}
