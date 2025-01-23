import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { librefitTheme } from './src/librefit-theme';

const config: import('tailwindcss').Config = {
  darkMode: 'media',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  plugins: [
    skeleton({
      themes: { custom: [librefitTheme] }
    }),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};

module.exports = config;
