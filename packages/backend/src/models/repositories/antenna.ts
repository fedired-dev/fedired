import { db } from "@/db/postgre.js";
import { Antenna } from "@/models/entities/antenna.js";
import type { Packed } from "@/misc/schema.js";
import { UserGroupJoinings } from "@/models/index.js";

export const AntennaRepository = db.getRepository(Antenna).extend({
	async pack(src: Antenna["id"] | Antenna): Promise<Packed<"Antenna">> {
		const antenna =
			typeof src === "object" ? src : await this.findOneByOrFail({ id: src });

		const userGroupJoining = antenna.userGroupJoiningId
			? await UserGroupJoinings.findOneBy({ id: antenna.userGroupJoiningId })
			: null;

		return {
			id: antenna.id,
			createdAt: antenna.createdAt.toISOString(),
			name: antenna.name,
			keywords: antenna.keywords.map((row: string) => row.split(" ")),
			excludeKeywords: antenna.excludeKeywords.map((row: string) =>
				row.split(" "),
			),
			src: antenna.src,
			userListId: antenna.userListId,
			userGroupId: userGroupJoining ? userGroupJoining.userGroupId : null,
			users: antenna.users,
			instances: antenna.instances,
			caseSensitive: antenna.caseSensitive,
			notify: antenna.notify,
			withReplies: antenna.withReplies,
			withFile: antenna.withFile,
			hasUnreadNote: false,
		};
	},
});
