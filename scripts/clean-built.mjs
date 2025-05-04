import fs from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";

(async () => {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));

	fs.rmSync(join(__dirname, "/../packages/backend/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/backend-rs/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/client/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/sw/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../packages/fedired-js/built"), {
		recursive: true,
		force: true,
	});
	fs.rmSync(join(__dirname, "/../built"), { recursive: true, force: true });
})();
