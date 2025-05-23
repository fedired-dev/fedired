import { config } from "@/config.js";
import type { User } from "@/models/entities/user.js";

export default (object: any, user: { id: User["id"] }) => {
	const activity = {
		id: `${config.url}/users/${user.id}#updates/${Date.now()}`,
		actor: `${config.url}/users/${user.id}`,
		type: "Update",
		to: ["https://www.w3.org/ns/activitystreams#Public"],
		object,
		published: new Date().toISOString(),
	} as any;

	return activity;
};
