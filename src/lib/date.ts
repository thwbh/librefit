import { getHours, format, parse } from 'date-fns';

export const default_date_format = 'yyyy-MM-dd'; // used for internal storage and fetch requests
export const display_date_format = 'dd.MM.yyyy'; // used for display only
export const display_date_format_day = 'dd.MM';

export function getDateAsStr(d: number | Date, displayFormat?: string | undefined) {
	if (!displayFormat) {
		displayFormat = default_date_format;
	}
	return format(d, displayFormat.valueOf());
}

export function parseStringAsDate(str: string, dateFormat?: string | undefined) {
	if (!dateFormat) {
		dateFormat = default_date_format;
	}
	return parse(str.valueOf(), dateFormat.valueOf(), new Date());
}

export function convertDateStrToDisplayDateStr(str: string, displayFormat?: string | undefined) {
	const date = parseStringAsDate(str, displayFormat);
	return getDisplayDateAsStr(date);
}

export const getDisplayDateAsStr = (
	d: number | Date,
	locale?: string
) => {
	/*if (!locale && navigator !== undefined) { no clue why this does not work
        locale = navigator.language;
    }*/
	if (locale) {
		return new Intl.DateTimeFormat(locale.valueOf()).format(d);
	} else {
		return format(d, display_date_format);
	}
};
/**
 * @readonly
 * @enum {string}
 */
export const Daytime = {
	Morning: 'morning',
	Day: 'day',
	Afternoon: 'afternoon',
	Evening: 'evening',
	Night: 'night'
};
/**
 * @param date {Date}
 */
export const getDaytimeGreeting = (date) => {
	const hours = getHours(date);

	if (hours >= 0 && hours <= 4) {
		return Daytime.Night;
	} else if (hours >= 5 && hours <= 11) {
		return Daytime.Morning;
	} else if (hours >= 12 && hours <= 14) {
		return Daytime.Day;
	} else if (hours >= 15 && hours <= 18) {
		return Daytime.Afternoon;
	} else if (hours >= 19 && hours <= 24) {
		return Daytime.Night;
	} else {
		return Daytime.Day;
	}
};

/** @param date {Date} */
export const getDaytimeFoodCategory = (date) => {
	const hours = getHours(date);

	if (hours >= 0 && hours <= 4) {
		return 's';
	} else if (hours >= 5 && hours <= 11) {
		return 'b';
	} else if (hours >= 12 && hours <= 15) {
		return 'l';
	} else if (hours >= 16 && hours <= 20) {
		return 'd';
	} else {
		return 't';
	}
};
