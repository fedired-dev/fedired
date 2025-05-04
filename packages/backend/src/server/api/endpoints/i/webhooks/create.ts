import define from "@/server/api/define.js";
import { genIdAt, InternalEvent, publishToInternalStream } from "backend-rs";
import { Webhooks } from "@/models/index.js";
import { webhookEventTypes } from "@/models/entities/webhook.js";

export const meta = {
	tags: ["webhooks"],

	requireCredential: true,

	kind: "write:account",
} as const;

export const paramDef = {
	type: "object",
	properties: {
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
	},
	required: ["name", "url", "secret", "on"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const now = new Date();
	const webhook = await Webhooks.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: user.id,
		name: ps.name,
		url: ps.url,
		secret: ps.secret,
		on: ps.on,
	}).then((x) => Webhooks.findOneByOrFail(x.identifiers[0]));

	publishToInternalStream(InternalEvent.WebhookCreated, webhook);

	return webhook;
});
