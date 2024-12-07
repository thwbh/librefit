const lightProgressClass = 'bg-surface-900';
const darkProgressClass = 'bg-surface-100';
const successProgressClass = 'bg-success-500';
const errorProgressClass = 'bg-error-500';

export class Indicator {
	private meter: string;
	private track: string;
	private progress: number;
	private actorDisabled: boolean;
	private actor: { disabled: boolean } | undefined;
	private invisible: string;
	private theme: string | undefined;

	constructor() {
		this.theme = undefined; // This should be set outside or passed in
		this.meter = this.theme === 'dark' ? darkProgressClass : lightProgressClass;
		this.track = this.theme === 'dark' ? darkProgressClass : lightProgressClass + '/30';
		this.progress = 0;
		this.actorDisabled = false;
		this.actor = undefined;
		this.invisible = '';
	}

	start(actor?: { disabled: boolean }): Indicator {
		this.progress = undefined as any;
		this.actorDisabled = true;
		this.invisible = '';

		if (actor) {
			actor.disabled = true;
			this.actor = actor;
		}

		return this;
	}

	finishSuccess(): Indicator {
		this.meter = successProgressClass;
		return this.finish();
	}

	finishError(): Indicator {
		this.meter = errorProgressClass;
		return this.finish();
	}

	finish(): Indicator {
		this.track = this.meter + '/30';
		this.progress = 100;
		this.actorDisabled = false;

		if (this.actor) {
			this.actor.disabled = false;
			this.actor = undefined;
		}

		return this.hide();
	}

	hide(): Indicator {
		this.invisible = 'invisible';
		return this;
	}

	reset(): Indicator {
		this.progress = 0;
		this.meter = this.theme === 'dark' ? darkProgressClass : lightProgressClass;

		if (this.actor) {
			this.actor.disabled = false;
			this.actor = undefined;
		}

		return this;
	}

	toggle(toggle: string): Indicator {
		this.theme = toggle;

		if ('dark' === toggle) {
			this.meter = darkProgressClass;
			this.track = darkProgressClass + '/30';
		} else {
			this.meter = lightProgressClass;
			this.track = lightProgressClass + '/30';
		}

		return this;
	}
}
