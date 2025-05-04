import fs from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

(async () => {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));

	fs.rmSync(join(__dirname, "/../packages/backend/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/backend/native-utils/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/client/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/sw/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/fedired-js/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/megalodon/node_modules"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../node_modules"), {
		recursive: true,
		force: true,
	});

	execa("pnpm", ["store", "prune"], {
		cwd: join(__dirname, "/../"),
		stdio: "inherit",
	});
})();
