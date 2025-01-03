import type { User } from "@/models/entities/user.js";
import type { UserList } from "@/models/entities/user-list.js";
import { UserListJoinings, Users } from "@/models/index.js";
import type { UserListJoining } from "@/models/entities/user-list-joining.js";
import { genIdAt } from "backend-rs";
import { fetchProxyAccount } from "@/misc/fetch-proxy-account.js";
import createFollowing from "@/services/following/create.js";

export async function pushUserToUserList(target: User, list: UserList) {
	const now = new Date();

	await UserListJoinings.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: target.id,
		userListId: list.id,
	} as UserListJoining);

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (Users.isRemoteUser(target)) {
		const proxy = await fetchProxyAccount();
		if (proxy) {
			createFollowing(proxy, target);
		}
	}
}
