// `@tauri-apps/plugin-store`-backed settings store is not yet wired up — the
// plugin isn't installed. `showHint` is a no-op stub until the feature lands.

export const showHint = async (_feat: string) => {
	return false;
};
