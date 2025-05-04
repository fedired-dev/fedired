import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { Webhooks } from "@/models/index.js";
import { InternalEvent, publishToInternalStream } from "backend-rs";

export const meta = {
	tags: ["webhooks"],

	requireCredential: true,

	kind: "write:account",

	errors: {
		noSuchWebhook: {
			message: "No such webhook.",
			code: "NO_SUCH_WEBHOOK",
			id: "bae73e5a-5522-4965-ae19-3a8688e71d82",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		webhookId: { type: "string", format: "misskey:id" },
	},
	required: ["webhookId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const webhook = await Webhooks.findOneBy({
		id: ps.webhookId,
		userId: user.id,
	});

	if (webhook == null) {
		throw new ApiError(meta.errors.noSuchWebhook);
	}

	await Webhooks.delete(webhook.id);

	publishToInternalStream(InternalEvent.WebhookDeleted, webhook);
});
