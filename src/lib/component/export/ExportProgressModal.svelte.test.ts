import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ExportProgressModal from './ExportProgressModal.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		message: 'Working...',
		stage: 'initializing',
		progress: 0,
		isExporting: true,
		filePath: null,
		bytesInfo: '',
		oncancel: vi.fn(),
		onclose: vi.fn(),
		...overrides
	};
}

function openDialog(container: HTMLElement) {
	// jsdom's <dialog> needs an explicit showModal() to expose its content;
	// veilchen's ModalDialog uses bind:dialog so we drive it via the DOM here.
	const dialog = container.querySelector('dialog');
	dialog?.showModal();
}

describe('ExportProgressModal', () => {
	it('[EX-007] Close button is disabled while exporting', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: true, stage: 'analyzingDatabase' })
		});
		openDialog(container);

		const close = screen.getByRole('button', { name: /^Close$/ }) as HTMLButtonElement;
		expect(close.disabled).toBe(true);
	});

	it('[EX-007] Close button becomes enabled when exporting finishes at the Complete stage', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: false, stage: 'complete' })
		});
		openDialog(container);

		const close = screen.getByRole('button', { name: /^Close$/ }) as HTMLButtonElement;
		expect(close.disabled).toBe(false);
	});

	it('[EX-006] Cancel button is enabled while exporting; clicking invokes oncancel', async () => {
		const oncancel = vi.fn();
		const user = userEvent.setup();
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: true, oncancel })
		});
		openDialog(container);

		const cancel = screen.getByRole('button', { name: /^Cancel$/ }) as HTMLButtonElement;
		expect(cancel.disabled).toBe(false);
		await user.click(cancel);
		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('[EX-006] Cancel button is disabled once isExporting flips to false', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: false, stage: 'cancelled' })
		});
		openDialog(container);

		const cancel = screen.getByRole('button', { name: /^Cancel$/ }) as HTMLButtonElement;
		expect(cancel.disabled).toBe(true);
	});

	it('[EX-004] file path is shown after completion', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({
				isExporting: false,
				stage: 'complete',
				filePath: '/tmp/librefit-export.db'
			})
		});
		openDialog(container);

		expect(screen.getByText(/File saved to \/tmp\/librefit-export.db/)).toBeTruthy();
	});

	it('[STG-001] Initialize badge becomes success when progress passes 5%', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ progress: 10 })
		});
		openDialog(container);

		const initialize = screen.getByText('Initialize');
		expect(initialize.classList.contains('badge-success')).toBe(true);
	});

	it('[STG-002] Backup badge becomes success when progress passes 60%', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ progress: 65 })
		});
		openDialog(container);

		expect(screen.getByText('Backup').classList.contains('badge-success')).toBe(true);
		expect(screen.getByText('Read').classList.contains('badge-success')).toBe(false);
	});

	it('[STG-003] Done badge becomes success at 100% progress', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ progress: 100, stage: 'complete', isExporting: false })
		});
		openDialog(container);

		expect(screen.getByText('Done').classList.contains('badge-success')).toBe(true);
	});

	it('stage icon renders while exporting', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: true, stage: 'analyzingDatabase' })
		});
		openDialog(container);
		expect(screen.queryByTestId('stage-icon')).not.toBeNull();
	});

	it('stage icon is hidden once exporting finishes (LoadingIndicator owns the terminal icon)', () => {
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: false, stage: 'complete' })
		});
		openDialog(container);
		expect(screen.queryByTestId('stage-icon')).toBeNull();
	});

	it('clicking Close invokes onclose', async () => {
		const onclose = vi.fn();
		const user = userEvent.setup();
		const { container } = render(ExportProgressModal, {
			props: baseProps({ isExporting: false, stage: 'complete', onclose })
		});
		openDialog(container);

		await user.click(screen.getByRole('button', { name: /^Close$/ }));
		expect(onclose).toHaveBeenCalledTimes(1);
	});
});
