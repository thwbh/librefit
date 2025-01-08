import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const librefitTheme: CustomThemeConfig = {
	name: 'librefit-theme',
	properties: {
		'--theme-font-family-base':
			"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,\n\t\t'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',\n\t\t'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
		'--theme-font-family-heading': 'system-ui',
		'--theme-font-color-base': '36 44 70',
		'--theme-font-color-dark': '219 222 233',
		'--theme-rounded-base': '9999px',
		'--theme-rounded-container': '8px',
		'--theme-border-base': '1px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '0 0 0',
		'--on-secondary': '255 255 255',
		'--on-tertiary': '0 0 0',
		'--on-success': '0 0 0',
		'--on-warning': '0 0 0',
		'--on-error': '255 255 255',
		'--on-surface': '255 255 255',
		// =~= Theme Colors  =~=
		// primary | #b6c802
		'--color-primary-50': '244 247 217', // #f4f7d9
		'--color-primary-100': '240 244 204', // #f0f4cc
		'--color-primary-200': '237 241 192', // #edf1c0
		'--color-primary-300': '226 233 154', // #e2e99a
		'--color-primary-400': '204 217 78', // #ccd94e
		'--color-primary-500': '182 200 2', // #b6c802
		'--color-primary-600': '164 180 2', // #a4b402
		'--color-primary-700': '137 150 2', // #899602
		'--color-primary-800': '109 120 1', // #6d7801
		'--color-primary-900': '89 98 1', // #596201
		// secondary | #8c43d1
		'--color-secondary-50': '238 227 248', // #eee3f8
		'--color-secondary-100': '232 217 246', // #e8d9f6
		'--color-secondary-200': '226 208 244', // #e2d0f4
		'--color-secondary-300': '209 180 237', // #d1b4ed
		'--color-secondary-400': '175 123 223', // #af7bdf
		'--color-secondary-500': '140 67 209', // #8c43d1
		'--color-secondary-600': '126 60 188', // #7e3cbc
		'--color-secondary-700': '105 50 157', // #69329d
		'--color-secondary-800': '84 40 125', // #54287d
		'--color-secondary-900': '69 33 102', // #452166
		// tertiary | #0ea5e8
		'--color-tertiary-50': '219 242 252', // #dbf2fc
		'--color-tertiary-100': '207 237 250', // #cfedfa
		'--color-tertiary-200': '195 233 249', // #c3e9f9
		'--color-tertiary-300': '159 219 246', // #9fdbf6
		'--color-tertiary-400': '86 192 239', // #56c0ef
		'--color-tertiary-500': '14 165 232', // #0ea5e8
		'--color-tertiary-600': '13 149 209', // #0d95d1
		'--color-tertiary-700': '11 124 174', // #0b7cae
		'--color-tertiary-800': '8 99 139', // #08638b
		'--color-tertiary-900': '7 81 114', // #075172
		// success | #b5c700
		'--color-success-50': '244 247 217', // #f4f7d9
		'--color-success-100': '240 244 204', // #f0f4cc
		'--color-success-200': '237 241 191', // #edf1bf
		'--color-success-300': '225 233 153', // #e1e999
		'--color-success-400': '203 216 77', // #cbd84d
		'--color-success-500': '181 199 0', // #b5c700
		'--color-success-600': '163 179 0', // #a3b300
		'--color-success-700': '136 149 0', // #889500
		'--color-success-800': '109 119 0', // #6d7700
		'--color-success-900': '89 98 0', // #596200
		// warning | #eab308
		'--color-warning-50': '252 244 218', // #fcf4da
		'--color-warning-100': '251 240 206', // #fbf0ce
		'--color-warning-200': '250 236 193', // #faecc1
		'--color-warning-300': '247 225 156', // #f7e19c
		'--color-warning-400': '240 202 82', // #f0ca52
		'--color-warning-500': '234 179 8', // #eab308
		'--color-warning-600': '211 161 7', // #d3a107
		'--color-warning-700': '176 134 6', // #b08606
		'--color-warning-800': '140 107 5', // #8c6b05
		'--color-warning-900': '115 88 4', // #735804
		// error | #a61e2d
		'--color-error-50': '242 221 224', // #f2dde0
		'--color-error-100': '237 210 213', // #edd2d5
		'--color-error-200': '233 199 203', // #e9c7cb
		'--color-error-300': '219 165 171', // #dba5ab
		'--color-error-400': '193 98 108', // #c1626c
		'--color-error-500': '166 30 45', // #a61e2d
		'--color-error-600': '149 27 41', // #951b29
		'--color-error-700': '125 23 34', // #7d1722
		'--color-error-800': '100 18 27', // #64121b
		'--color-error-900': '81 15 22', // #510f16
		// surface | #495a8f
		'--color-surface-50': '228 230 238', // #e4e6ee
		'--color-surface-100': '219 222 233', // #dbdee9
		'--color-surface-200': '210 214 227', // #d2d6e3
		'--color-surface-300': '182 189 210', // #b6bdd2
		'--color-surface-400': '128 140 177', // #808cb1
		'--color-surface-500': '73 90 143', // #495a8f
		'--color-surface-600': '66 81 129', // #425181
		'--color-surface-700': '55 68 107', // #37446b
		'--color-surface-800': '44 54 86', // #2c3656
		'--color-surface-900': '36 44 70' // #242c46
	}
};
