import { acct } from "fedired-js";
import { defineAsyncComponent } from "vue";
import { i18n } from "@/i18n";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { host } from "@/config";
import * as os from "@/os";
import { userActions } from "@/store";
import { isModerator, isSignedIn, me } from "@/me";
import { mainRouter } from "@/router";
import type { Router } from "@/nirax";
import icon from "@/scripts/icon";

export function getUserMenu(user, router: Router = mainRouter) {
	async function pushList() {
		const t = i18n.ts.selectList; // なぜか後で参照すると null になるので最初にメモリに確保しておく
		const lists = await os.api("users/lists/list");
		if (lists.length === 0) {
			os.alert({
				type: "error",
				text: i18n.ts.youHaveNoLists,
			});
			return;
		}
		const { canceled, result: listId } = await os.select({
			title: t,
			items: lists.map((list) => ({
				value: list.id,
				text: list.name,
			})),
		});
		if (canceled) return;
		os.apiWithDialog("users/lists/push", {
			listId,
			userId: user.id,
		});
	}

	async function inviteGroup() {
		const groups = await os.api("users/groups/owned");
		if (groups.length === 0) {
			os.alert({
				type: "error",
				text: i18n.ts.youHaveNoGroups,
			});
			return;
		}
		const { canceled, result: groupId } = await os.select({
			title: i18n.ts.group,
			items: groups.map((group) => ({
				value: group.id,
				text: group.name,
			})),
		});
		if (canceled) return;
		os.apiWithDialog("users/groups/invite", {
			groupId,
			userId: user.id,
		});
	}

	async function toggleMute() {
		if (user.isMuted) {
			os.apiWithDialog("mute/delete", {
				userId: user.id,
			}).then(() => {
				user.isMuted = false;
			});
		} else {
			const { canceled, result: period } = await os.select({
				title: i18n.ts.mutePeriod,
				items: [
					{
						value: "indefinitely",
						text: i18n.ts.indefinitely,
					},
					{
						value: "tenMinutes",
						text: i18n.ts.tenMinutes,
					},
					{
						value: "oneHour",
						text: i18n.ts.oneHour,
					},
					{
						value: "oneDay",
						text: i18n.ts.oneDay,
					},
					{
						value: "oneWeek",
						text: i18n.ts.oneWeek,
					},
				],
				default: "indefinitely",
			});
			if (canceled) return;

			const expiresAt =
				period === "indefinitely"
					? null
					: period === "tenMinutes"
						? Date.now() + 1000 * 60 * 10
						: period === "oneHour"
							? Date.now() + 1000 * 60 * 60
							: period === "oneDay"
								? Date.now() + 1000 * 60 * 60 * 24
								: period === "oneWeek"
									? Date.now() + 1000 * 60 * 60 * 24 * 7
									: null;

			os.apiWithDialog("mute/create", {
				userId: user.id,
				expiresAt,
			}).then(() => {
				user.isMuted = true;
			});
		}
	}

	async function toggleRenoteMute(): Promise<void> {
		os.apiWithDialog(
			user.isRenoteMuted ? "renote-mute/delete" : "renote-mute/create",
			{
				userId: user.id,
			},
		).then(() => {
			user.isRenoteMuted = !user.isRenoteMuted;
		});
	}

	async function toggleReplyMute(): Promise<void> {
		os.apiWithDialog(
			user.isReplyMuted ? "reply-mute/delete" : "reply-mute/create",
			{
				userId: user.id,
			},
		).then(() => {
			user.isReplyMuted = !user.isReplyMuted;
		});
	}

	async function toggleBlock(): Promise<void> {
		if (
			!(await getConfirmed(
				user.isBlocking ? i18n.ts.unblockConfirm : i18n.ts.blockConfirm,
			))
		)
			return;

		await os.apiWithDialog(
			user.isBlocking ? "blocking/delete" : "blocking/create",
			{
				userId: user.id,
			},
		);
		user.isBlocking = !user.isBlocking;
		await os.api(user.isBlocking ? "mute/create" : "mute/delete", {
			userId: user.id,
		});
		user.isMuted = user.isBlocking;
		if (user.isBlocking) {
			await os.api("following/delete", {
				userId: user.id,
			});
			user.isFollowing = false;
		}
	}

	async function toggleSilence() {
		if (
			!(await getConfirmed(
				i18n.t(user.isSilenced ? "unsilenceConfirm" : "silenceConfirm"),
			))
		)
			return;

		os.apiWithDialog(
			user.isSilenced ? "admin/unsilence-user" : "admin/silence-user",
			{
				userId: user.id,
			},
		).then(() => {
			user.isSilenced = !user.isSilenced;
		});
	}

	async function toggleSuspend() {
		if (
			!(await getConfirmed(
				i18n.t(user.isSuspended ? "unsuspendConfirm" : "suspendConfirm"),
			))
		)
			return;

		os.apiWithDialog(
			user.isSuspended ? "admin/unsuspend-user" : "admin/suspend-user",
			{
				userId: user.id,
			},
		).then(() => {
			user.isSuspended = !user.isSuspended;
		});
	}

	function reportAbuse() {
		os.popup(
			defineAsyncComponent(
				() => import("@/components/MkAbuseReportWindow.vue"),
			),
			{
				user,
			},
			{},
			"closed",
		);
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.confirm({
			type: "warning",
			title: i18n.ts.confirm,
			text,
		});

		return !confirm.canceled;
	}

	async function invalidateFollow() {
		if (!(await getConfirmed(i18n.ts.breakFollowConfirm))) return;

		os.apiWithDialog("following/invalidate", {
			userId: user.id,
		}).then(() => {
			user.isFollowed = !user.isFollowed;
		});
	}

	let menu = [
		{
			type: "label",
			text: user.host
				? `@${user.username}@${user.host || host}`
				: `@${user.username}`,
		},
		{
			icon: `${icon("ph-at")}`,
			text: i18n.ts.copyUsername,
			action: () => {
				copyToClipboard(`@${user.username}@${user.host || host}`);
				os.success();
			},
		},
		{
			icon: `${icon("ph-info")}`,
			text: i18n.ts.info,
			action: () => {
				router.push(`/user-info/${user.id}`);
			},
		},
		{
			icon: `${icon("ph-share")}`,
			text: i18n.ts.share,
			type: "parent",
			children: [
				{
					icon: "ph-qr-code ph-bold ph-lg",
					text: i18n.ts.getQrCode,
					action: () => {
						os.displayQrCode(
							`https://${host}/follow-me?acct=${acct.toString(user)}`,
						);
					},
				},
				{
					icon: `${icon("ph-hand-waving")}`,
					text: i18n.ts.copyRemoteFollowUrl,
					action: () => {
						copyToClipboard(
							`https://${host}/follow-me?acct=${acct.toString(user)}`,
						);
						os.success();
					},
				},
			],
		},
		{
			icon: `${icon("ph-newspaper")}`,
			text: i18n.ts._feeds.copyFeed,
			type: "parent",
			children: [
				{
					icon: `${icon("ph-rss")}`,
					text: i18n.ts._feeds.rss,
					action: () => {
						copyToClipboard(`https://${host}/@${user.username}.rss`);
						os.success();
					},
				},
				{
					icon: `${icon("ph-atom")}`,
					text: i18n.ts._feeds.atom,
					action: () => {
						copyToClipboard(`https://${host}/@${user.username}.atom`);
						os.success();
					},
				},
				{
					icon: `${icon("ph-brackets-curly")}`,
					text: i18n.ts._feeds.jsonFeed,
					action: () => {
						copyToClipboard(`https://${host}/@${user.username}.json`);
						os.success();
					},
				},
			],
		},
		{
			icon: `${icon("ph-envelope-simple-open")}`,
			text: i18n.ts.sendMessage,
			action: () => {
				os.post({ specified: user });
			},
		},
		!isSignedIn(me)
			? {
					icon: `${icon("ph-hand-waving")}`,
					text: i18n.ts.remoteFollow,
					action: () => {
						router.push(`/follow-me?acct=${acct.toString(user)}`);
					},
				}
			: undefined,
		isSignedIn(me) && me.id !== user.id
			? {
					type: "link",
					icon: `${icon("ph-chats-teardrop")}`,
					text: i18n.ts.startMessaging,
					to: `/my/messaging/${acct.toString(user)}`,
				}
			: undefined,
		user.host != null && user.url
			? {
					type: "a",
					icon: `${icon("ph-arrow-square-out")}`,
					text: i18n.ts.showOnRemote,
					href: user.url,
					target: "_blank",
				}
			: undefined,
		null,
		{
			icon: `${icon("ph-list-bullets ph-dir")}`,
			text: i18n.ts.addToList,
			action: pushList,
		},
		isSignedIn(me) && me.id !== user.id
			? {
					icon: `${icon("ph-users-three")}`,
					text: i18n.ts.inviteToGroup,
					action: inviteGroup,
				}
			: undefined,
		null,
		{
			icon: user.isRenoteMuted
				? `${icon("ph-eye")}`
				: `${icon("ph-eye-slash")}`,
			text: user.isRenoteMuted ? i18n.ts.renoteUnmute : i18n.ts.renoteMute,
			action: toggleRenoteMute,
		},
		{
			icon: user.isReplyMuted ? `${icon("ph-eye")}` : `${icon("ph-eye-slash")}`,
			text: user.isReplyMuted ? i18n.ts.replyUnmute : i18n.ts.replyMute,
			action: toggleReplyMute,
		},
	] as any;

	if (isSignedIn(me) && me.id !== user.id) {
		menu = menu.concat([
			{
				icon: user.isMuted ? "ph-eye ph-lg" : "ph-eye-slash ph-lg",
				text: user.isMuted ? i18n.ts.unmute : i18n.ts.mute,
				hidden: user.isBlocking === true,
				action: toggleMute,
			},
			{
				icon: `${icon("ph-prohibit")}`,
				text: user.isBlocking ? i18n.ts.unblock : i18n.ts.block,
				action: toggleBlock,
			},
		]);

		if (user.isFollowed) {
			menu = menu.concat([
				{
					icon: `${icon("ph-link-break")}`,
					text: i18n.ts.breakFollow,
					action: invalidateFollow,
				},
			]);
		}

		menu = menu.concat([
			null,
			{
				icon: `${icon("ph-warning-circle")}`,
				text: i18n.ts.reportAbuse,
				action: reportAbuse,
			},
		]);

		if (isModerator) {
			menu = menu.concat([
				null,
				{
					icon: `${icon("ph-microphone-slash")}`,
					text: user.isSilenced ? i18n.ts.unsilence : i18n.ts.silence,
					action: toggleSilence,
				},
				{
					icon: `${icon("ph-snowflake")}`,
					text: user.isSuspended ? i18n.ts.unsuspend : i18n.ts.suspend,
					action: toggleSuspend,
				},
			]);
		}
	}

	if (isSignedIn(me) && me.id === user.id) {
		menu = menu.concat([
			null,
			{
				icon: `${icon("ph-pencil")}`,
				text: i18n.ts.editProfile,
				action: () => {
					router.push("/settings/profile");
				},
			},
		]);
	}

	if (userActions.length > 0) {
		menu = menu.concat([
			null,
			...userActions.map((action) => ({
				icon: `${icon("ph-plug")}`,
				text: action.title,
				action: () => {
					action.handler(user);
				},
			})),
		]);
	}

	return menu;
}
