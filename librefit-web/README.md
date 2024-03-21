# librefit-web

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# start server in your local network (useful for mobile devices)
npm run dev -- --host
```

## Building

To create a production version:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Dependencies

This project uses SvelteKit with [Skeleton](https://www.skeleton.dev/) as UI framework.

The following files are generated by `librefit-api` and should not be modified manually:

- `src/lib/api/model.js`
- `src/lib/api/index.js`

For the right build order, please see the [main description](https://github.com/tohuwabohu-io/librefit/blob/main/README.MD).

## Tests

TODO: It is planned to implement [playwright](https://playwright.dev/) component tests in the future.