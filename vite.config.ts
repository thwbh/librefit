import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import svg from '@poppanator/sveltekit-svg';
import purgeCss from 'vite-plugin-tailwind-purgecss';
import { svelteTesting } from "@testing-library/svelte/vite";
import tsconfigPaths from 'vite-tsconfig-paths';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    sveltekit(),
    purgeCss(),
    tsconfigPaths(),
    svg({
      includePaths: ['./src/lib/assets/icons/', './src/lib/assets/images/'],
      svgoOptions: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            // by default svgo removes the viewBox which prevents svg icons from scaling
            // not a good idea! https://github.com/svg/svgo/pull/1461
            params: { overrides: { removeViewBox: false } }
          }
        ]
      }
    })
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/__mocks__/skeletonProxy.ts'],
    coverage: {
      provider: 'v8',
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: true,
    },
    workspace: [
      {
        extends: true,
        plugins: [svelteTesting()],
        test: {
          name: "client",
          clearMocks: true,
        }
      },
    ]
  }
});
