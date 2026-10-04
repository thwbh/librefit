import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IntakeCaptureButton from './IntakeCaptureButton.svelte';

// The webview only transports bytes; mock the IPC commands and the byte reader so
// the tests exercise the component's flow without a backend or a real File.
const analyzeMealPhoto = vi.fn();
const grantAiIntakeConsent = vi.fn();

vi.mock('$lib/api', () => ({
	analyzeMealPhoto: (...args: unknown[]) => analyzeMealPhoto(...args),
	grantAiIntakeConsent: (...args: unknown[]) => grantAiIntakeConsent(...args)
}));

vi.mock('$lib/food-recognition', async (orig) => ({
	...(await orig<typeof import('$lib/food-recognition')>()),
	fileToBytes: vi.fn(async () => [1, 2, 3])
}));

const BUTTON_LABEL = /estimate calories from a photo/i;
const candidate = {
	intake: { added: '2026-01-01', amount: 420, category: 'l', description: 'Pizza' },
	lowConfidence: false
};

function setup(props: Record<string, unknown> = {}) {
	const onresult = vi.fn();
	const onconsent = vi.fn();
	render(IntakeCaptureButton, {
		props: {
			available: true,
			consentGranted: true,
			endpoint: 'https://api.mistral.ai/v1',
			onresult,
			onconsent,
			...props
		}
	});
	return { onresult, onconsent };
}

function fileInput(): HTMLInputElement {
	return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('IntakeCaptureButton', () => {
	beforeEach(() => {
		analyzeMealPhoto.mockReset();
		grantAiIntakeConsent.mockReset();
	});

	it('[IT-035] hidden when the feature is unavailable (off / unconfigured / offline)', () => {
		// FR-011/FR-012/FR-013 all collapse to `available=false`.
		setup({ available: false });
		expect(screen.queryByLabelText(BUTTON_LABEL)).toBeNull();
	});

	it('[FR-011] hidden when the feature is disabled', () => {
		setup({ available: false });
		expect(screen.queryByLabelText(BUTTON_LABEL)).toBeNull();
	});

	it('[FR-012] hidden when the feature is unconfigured', () => {
		setup({ available: false });
		expect(screen.queryByLabelText(BUTTON_LABEL)).toBeNull();
	});

	it('[FR-013] hidden when the device is offline', () => {
		setup({ available: false });
		expect(screen.queryByLabelText(BUTTON_LABEL)).toBeNull();
	});

	it('[IT-033] shown when the feature is enabled and configured', () => {
		setup({ available: true });
		expect(screen.getByLabelText(BUTTON_LABEL)).toBeInTheDocument();
	});

	it('[FR-014] first capture prompts for consent before any upload', async () => {
		setup({ consentGranted: false });
		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		expect(screen.getByText(/use ai to estimate calories/i)).toBeInTheDocument();
		expect(analyzeMealPhoto).not.toHaveBeenCalled();
	});

	it('[FR-015] declining consent aborts the upload', async () => {
		setup({ consentGranted: false });
		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		await fireEvent.click(screen.getByText(/^cancel$/i));
		expect(grantAiIntakeConsent).not.toHaveBeenCalled();
		expect(analyzeMealPhoto).not.toHaveBeenCalled();
	});

	it('[FR-016] consent already granted does not prompt again', async () => {
		setup({ consentGranted: true });
		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		expect(screen.queryByText(/use ai to estimate calories/i)).toBeNull();
		expect(grantAiIntakeConsent).not.toHaveBeenCalled();
	});

	it('[FR-025] a successful analysis delivers a candidate to pre-fill the mask', async () => {
		analyzeMealPhoto.mockResolvedValue(candidate);
		const { onresult } = setup({ consentGranted: true });

		const file = new File([new Uint8Array([1, 2, 3])], 'meal.jpg', { type: 'image/jpeg' });
		await fireEvent.change(fileInput(), { target: { files: [file] } });

		expect(analyzeMealPhoto).toHaveBeenCalledOnce();
		expect(onresult).toHaveBeenCalledWith(candidate.intake, false);
	});

	it('[FR-028] a bad-key failure shows a distinct bad-key error', async () => {
		analyzeMealPhoto.mockRejectedValue({ code: 'bad_key', message: 'unauthorized' });
		setup({ consentGranted: true });

		const file = new File([new Uint8Array([1, 2, 3])], 'meal.jpg', { type: 'image/jpeg' });
		await fireEvent.change(fileInput(), { target: { files: [file] } });

		expect(await screen.findByText(/api key was rejected/i)).toBeInTheDocument();
	});
});
