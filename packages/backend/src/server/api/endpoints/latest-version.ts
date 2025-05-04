import define from "@/server/api/define.js";
import { latestVersion } from "backend-rs";

export const meta = {
	tags: ["meta"],

	requireCredential: false,
	requireCredentialPrivateMode: true,
	allowGet: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	try {
		// Intenta obtener la última versión
		const version = await latestVersion();
		return {
			latest_version: version,
		};
	} catch (error) {
		// Manejo de errores detallado
		console.error("Error al obtener la última versión:", error);
		return {
			error: "Failed to retrieve the latest version. Please try again later.",
		};
	}
});
