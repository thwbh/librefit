import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import IntakeCaptureButton from './IntakeCaptureButton.svelte';

// The webview only transports bytes; mock the IPC commands, the byte reader and
// the camera invoke so the tests exercise the component's flow without a backend,
// a real File, or a native camera.
const analyzeMealPhoto = vi.fn();
const grantAiIntakeConsent = vi.fn();

vi.mock('$lib/api', () => ({
	analyzeMealPhoto: (...args: unknown[]) => analyzeMealPhoto(...args),
	grantAiIntakeConsent: (...args: unknown[]) => grantAiIntakeConsent(...args)
}));

const capturePhotoFromCamera = vi.fn();
vi.mock('$lib/food-recognition', async (orig) => ({
	...(await orig<typeof import('$lib/food-recognition')>()),
	fileToBytes: vi.fn(async () => [1, 2, 3]),
	capturePhotoFromCamera: (...args: unknown[]) => capturePhotoFromCamera(...args)
}));

const BUTTON_LABEL = /estimate calories from a photo/i;
const candidate = {
	intake: { added: '2026-01-01', amount: 420, category: 'l', description: 'Pizza' },
	lowConfidence: false,
	confidence: 0.9
};

function setup(props: Record<string, unknown> = {}) {
	const onstart = vi.fn();
	const onresult = vi.fn();
	const onerror = vi.fn();
	const onconsent = vi.fn();
	render(IntakeCaptureButton, {
		props: {
			available: true,
			consentGranted: true,
			endpoint: 'https://api.mistral.ai/v1',
			onstart,
			onresult,
			onerror,
			onconsent,
			...props
		}
	});
	return { onstart, onresult, onerror, onconsent };
}

function fileInput(): HTMLInputElement {
	return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('IntakeCaptureButton', () => {
	beforeEach(() => {
		analyzeMealPhoto.mockReset();
		grantAiIntakeConsent.mockReset();
		capturePhotoFromCamera.mockReset();
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
		expect(capturePhotoFromCamera).not.toHaveBeenCalled();
		expect(analyzeMealPhoto).not.toHaveBeenCalled();
	});

	it('[FR-015] declining consent aborts the upload', async () => {
		setup({ consentGranted: false });
		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		await fireEvent.click(screen.getByText(/^cancel$/i));
		expect(grantAiIntakeConsent).not.toHaveBeenCalled();
		expect(capturePhotoFromCamera).not.toHaveBeenCalled();
		expect(analyzeMealPhoto).not.toHaveBeenCalled();
	});

	it('[FR-016] consent already granted does not prompt again', async () => {
		capturePhotoFromCamera.mockResolvedValue({ image: [9, 9, 9], mime: 'image/jpeg' });
		analyzeMealPhoto.mockResolvedValue(candidate);
		setup({ consentGranted: true });
		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		expect(screen.queryByText(/use ai to estimate calories/i)).toBeNull();
		expect(grantAiIntakeConsent).not.toHaveBeenCalled();
	});

	it('[FR-031] tapping opens the camera directly, with no in-app chooser', async () => {
		capturePhotoFromCamera.mockResolvedValue({ image: [9, 9, 9], mime: 'image/jpeg' });
		analyzeMealPhoto.mockResolvedValue(candidate);
		setup({ consentGranted: true });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));

		expect(capturePhotoFromCamera).toHaveBeenCalledOnce();
		// No camera/gallery chooser is rendered.
		expect(screen.queryByText(/choose from gallery/i)).toBeNull();
	});

	it('[FR-032] a captured photo is analyzed and delivered as a candidate', async () => {
		capturePhotoFromCamera.mockResolvedValue({ image: [9, 9, 9], mime: 'image/jpeg' });
		analyzeMealPhoto.mockResolvedValue(candidate);
		const { onstart, onresult } = setup({ consentGranted: true });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));

		expect(analyzeMealPhoto).toHaveBeenCalledWith(
			expect.objectContaining({ image: [9, 9, 9], mime: 'image/jpeg' })
		);
		expect(onstart).toHaveBeenCalledOnce();
		expect(onresult).toHaveBeenCalledWith(candidate);
	});

	it('[FR-033] camera unavailable falls back to the file picker', async () => {
		// The camera invoke rejects (desktop / unavailable); the file picker takes over.
		capturePhotoFromCamera.mockRejectedValue(new Error('no camera'));
		analyzeMealPhoto.mockResolvedValue(candidate);
		const { onstart, onresult } = setup({ consentGranted: true });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		expect(capturePhotoFromCamera).toHaveBeenCalledOnce();

		const file = new File([new Uint8Array([1, 2, 3])], 'meal.jpg', { type: 'image/jpeg' });
		await fireEvent.change(fileInput(), { target: { files: [file] } });

		expect(analyzeMealPhoto).toHaveBeenCalledOnce();
		expect(onstart).toHaveBeenCalledOnce();
		expect(onresult).toHaveBeenCalledWith(candidate);
	});

	it('[FR-028] a bad-key failure surfaces a distinct bad-key message to the parent', async () => {
		capturePhotoFromCamera.mockResolvedValue({ image: [9, 9, 9], mime: 'image/jpeg' });
		analyzeMealPhoto.mockRejectedValue({ code: 'bad_key', message: 'unauthorized' });
		const { onerror } = setup({ consentGranted: true });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));

		expect(onerror).toHaveBeenCalledWith(expect.stringMatching(/api key was rejected/i));
	});

	it('[FR-014] accepting consent records it and proceeds straight to capture', async () => {
		// First tap → consent dialog → Accept: the grant is recorded, the parent
		// is told, and capture continues without a second tap.
		capturePhotoFromCamera.mockResolvedValue({ image: [9, 9, 9], mime: 'image/jpeg' });
		analyzeMealPhoto.mockResolvedValue(candidate);
		const { onconsent, onstart, onresult } = setup({ consentGranted: false });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		await fireEvent.click(screen.getByText(/accept & continue/i));

		expect(grantAiIntakeConsent).toHaveBeenCalledOnce();
		expect(onconsent).toHaveBeenCalledOnce();
		expect(capturePhotoFromCamera).toHaveBeenCalledOnce();
		expect(analyzeMealPhoto).toHaveBeenCalledWith(
			expect.objectContaining({ image: [9, 9, 9], mime: 'image/jpeg' })
		);
		expect(onstart).toHaveBeenCalledOnce();
		await waitFor(() => expect(onresult).toHaveBeenCalledWith(candidate));
	});

	it('[FR-015] a failed consent grant surfaces the failure instead of silently proceeding', async () => {
		// The grant itself can fail (backend down, config gone); the user must
		// not be dropped into a capture flow that will fail confusingly later.
		grantAiIntakeConsent.mockRejectedValue({ code: 'not_configured', message: 'gone' });
		const { onerror, onconsent } = setup({ consentGranted: false });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		await fireEvent.click(screen.getByText(/accept & continue/i));

		expect(onerror).toHaveBeenCalledWith(
			expect.stringMatching(/not set up yet|add this meal manually/i)
		);
		expect(onconsent).not.toHaveBeenCalled();
		expect(capturePhotoFromCamera).not.toHaveBeenCalled();
	});

	it('[FR-033] an empty picker selection does not start an analysis', async () => {
		// Fallback path: the file dialog opens but is dismissed without a file;
		// nothing may run (no spurious loading modal, no analysis call).
		capturePhotoFromCamera.mockRejectedValue(new Error('no camera'));
		analyzeMealPhoto.mockResolvedValue(candidate);
		const { onstart } = setup({ consentGranted: true });

		await fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
		await fireEvent.change(fileInput(), new Event('change'));

		expect(analyzeMealPhoto).not.toHaveBeenCalled();
		expect(onstart).not.toHaveBeenCalled();
	});
});
