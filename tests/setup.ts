import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupDialogPolyfill } from './utils/dialog-polyfill';

expect.extend(matchers);

afterEach(() => cleanup());

// Setup polyfills for jsdom
beforeAll(() => {
	setupDialogPolyfill();
});