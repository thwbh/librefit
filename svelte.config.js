import { sveltePreprocess } from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [
    vitePreprocess({ script: true }),
    sveltePreprocess({
      postcss: true
    })
  ],

  ssr: {
    noExternal: ['chart.js']
  },

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      precompress: false,
      strict: true,
      fallback: 'index.html'
    }),
    paths: {
      relative: false
    }
  }
};

export default config;
