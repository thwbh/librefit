/**
 * Polyfill for HTMLDialogElement methods that jsdom doesn't support
 *
 * Usage: Import and call setupDialogPolyfill() in your test setup file
 */
export function setupDialogPolyfill() {
	if (typeof HTMLDialogElement === 'undefined') {
		// @ts-ignore - Define HTMLDialogElement if it doesn't exist
		global.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {};
	}

	HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
		this.style.display = 'block';
	};

	HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
		this.style.display = 'block';
	};

	HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
		this.removeAttribute('open');
		this.style.display = 'none';
	};
}
