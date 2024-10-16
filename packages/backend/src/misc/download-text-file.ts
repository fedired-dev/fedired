import * as fs from "node:fs/promises";
import Logger from "@/services/logger.js";
import { createTemp } from "./create-temp.js";
import { downloadUrl } from "./download-url.js";

const logger = new Logger("download-text-file");

export async function downloadTextFile(url: string): Promise<string> {
	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		// write content at URL to temp file
		await downloadUrl(url, path);

		const text = await fs.readFile(path, "utf-8");

		return text;
	} finally {
		cleanup();
	}
}
