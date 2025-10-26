import {
	Barbell,
	OfficeChair,
	PersonSimpleRun,
	PersonSimpleTaiChi,
	Trophy
} from 'phosphor-svelte';
import type { Icon } from 'phosphor-svelte';

export interface ActivityLevelInfo {
	level: number;
	label: string;
	icon: Icon;
	badge: { text: string; color: string };
	description: string;
}

export const activityLevels: ActivityLevelInfo[] = [
	{
		level: 1,
		label: 'Mostly Sedentary',
		icon: OfficeChair,
		badge: { text: 'Level 1', color: 'info' },
		description:
			'You likely have an office job and try your best reaching your daily step goal. Apart from that, you do not work out regularly and spend most of your day stationary.'
	},
	{
		level: 1.25,
		label: 'Light Activity',
		icon: PersonSimpleTaiChi,
		badge: { text: 'Level 2', color: 'info' },
		description:
			'You either have a job that requires you to move around frequently or you hit the gym 2x - 3x times a week. In either way, you are regularly lifting weight and training your cardiovascular system.'
	},
	{
		level: 1.5,
		label: 'Moderate Activity',
		icon: PersonSimpleRun,
		badge: { text: 'Level 3', color: 'info' },
		description:
			'You consistently train your body 3x - 4x times a week. Your training plan became more sophisticated over the years and include cardiovascular HIIT sessions. You realized how important nutrition is and want to improve your sportive results.'
	},
	{
		level: 1.75,
		label: 'Highly Active',
		icon: Barbell,
		badge: { text: 'Level 4', color: 'warning' },
		description:
			'Fitness is your top priority in life. You dedicate large parts of your week to train your body, maybe even regularly visit sportive events. You work out almost every day and certainly know what you are doing.'
	},
	{
		level: 2,
		label: 'Athlete',
		icon: Trophy,
		badge: { text: 'Level 5', color: 'error' },
		description:
			"Your fitness level reaches into the (semi-) professional realm. Calculators like this won't fulfill your needs and you are curious how far off the results will be."
	}
];

export const getActivityLevelInfo = (level: number): ActivityLevelInfo => {
	return activityLevels.find((a) => a.level === level) || activityLevels[0];
};
