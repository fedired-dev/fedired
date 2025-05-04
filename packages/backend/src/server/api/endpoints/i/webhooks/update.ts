import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { Webhooks } from "@/models/index.js";
import { InternalEvent, publishToInternalStream } from "backend-rs";
import { webhookEventTypes } from "@/models/entities/webhook.js";

export const meta = {
	tags: ["webhooks"],

	requireCredential: true,

	kind: "write:account",

	errors: {
		noSuchWebhook: {
			message: "No such webhook.",
			code: "NO_SUCH_WEBHOOK",
			id: "fb0fea69-da18-45b1-828d-bd4fd1612518",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		webhookId: { type: "string", format: "misskey:id" },
		name: { type: "string", minLength: 1, maxLength: 100 },
		url: { type: "string", minLength: 1, maxLength: 1024 },
		secret: { type: "string", minLength: 1, maxLength: 1024 },
		on: {
			type: "array",
			items: {
				type: "string",
				enum: webhookEventTypes,
			},
		},
		active: { type: "boolean" },
	},
	required: ["webhookId", "name", "url", "secret", "on", "active"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const webhook = await Webhooks.findOneBy({
		id: ps.webhookId,
		userId: user.id,
	});

	if (webhook == null) {
		throw new ApiError(meta.errors.noSuchWebhook);
	}

	await Webhooks.update(webhook.id, {
		name: ps.name,
		url: ps.url,
		secret: ps.secret,
		on: ps.on,
		active: ps.active,
	});

	publishToInternalStream(InternalEvent.WebhookUpdated, webhook);
});
