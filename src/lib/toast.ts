import type { ToastStore } from '@skeletonlabs/skeleton';

export const showToastError = (toastStore: ToastStore, err: string) => {
	console.error(err);

	toastStore.trigger({
		message: 'An error occurred. Please try again later.',
		background: 'variant-filled-warning',
		autohide: false
	});
};

export const showToastSuccess = (toastStore: ToastStore, toastMessage: string) => {
	toastStore.trigger({
		message: toastMessage,
		background: 'variant-filled-primary',
		autohide: true
	});
};

export const showToastInfo = (toastStore: ToastStore, toastMessage: string) => {
	toastStore.trigger({
		message: toastMessage,
		background: 'variant-filled-tertiary',
		autohide: true
	});
};

export const showToastWarning = (toastStore: ToastStore, warning: string) => {
	toastStore.trigger({
		message: warning,
		background: 'variant-filled-warning',
		autohide: true
	});
};
