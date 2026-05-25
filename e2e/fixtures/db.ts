import { rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Resets the application's SQLite database by deleting the file on disk.
 * The Tauri app re-creates the database via Diesel migrations on next launch,
 * yielding a deterministic empty starting state.
 *
 * The filename and app-data path mirror what setup_db() in src-tauri/src/lib.rs
 * resolves at runtime (BaseDirectory::AppData / "tracker.db").
 */
export async function resetDatabase(): Promise<void> {
	const dataDir = appDataDir();
	await rm(path.join(dataDir, 'tracker.db'), { force: true }).catch(() => {
		/* file may not exist on first run; safe to ignore */
	});
}

function appDataDir(): string {
	const home = os.homedir();
	const identifier = 'io.tohuwabohu.LibreFit';

	switch (process.platform) {
		case 'linux':
			return path.join(process.env.XDG_DATA_HOME ?? path.join(home, '.local', 'share'), identifier);
		case 'darwin':
			return path.join(home, 'Library', 'Application Support', identifier);
		case 'win32':
			return path.join(process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), identifier);
		default:
			throw new Error(`Unsupported platform: ${process.platform}`);
	}
}
