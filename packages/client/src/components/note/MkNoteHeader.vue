<template>
	<header class="kkwtjztg">
		<div class="user-info">
			<div>
				<MkA
					v-user-preview="note.user.id"
					class="name"
					:to="userPage(note.user)"
					@click.stop
				>
					<MkUserName :user="note.user" class="mkusername">
						<span v-if="note.user.isBot" class="is-bot">bot</span>
					</MkUserName>
				</MkA>
				<div class="username"><MkAcct :user="note.user" /></div>
			</div>
			<div>
				<div class="info">
					<MkA class="created-at" :to="notePage(note)">
						<MkTime v-if="note.scheduledAt != null" :time="note.scheduledAt"/>
						<MkTime v-else :time="note.createdAt" />
						<i
							v-if="note.updatedAt"
							v-tooltip.noDelay="
								i18n.t('edited', {
									date: new Date(
										note.updatedAt,
									).toLocaleDateString(),
									time: new Date(
										note.updatedAt,
									).toLocaleTimeString(),
								})
							"
							:class="icon('ph-pencil', false)"
							style="margin-inline-start: 0.4rem"
						></i>
					</MkA>
					<MkVisibility :note="note" />
				</div>
				<MkInstanceTicker
					v-if="showTicker"
					class="ticker"
					:instance="note.user.instance"
					@click.stop="openServerInfo"
				/>
			</div>
		</div>
	</header>
</template>

<script lang="ts" setup>
import type { entities } from "fedired-js";
import { defaultStore } from "@/store";
import MkVisibility from "@/components/MkVisibility.vue";
import MkInstanceTicker from "@/components/MkInstanceTicker.vue";
import { notePage } from "@/filters/note";
import { userPage } from "@/filters/user";
import { i18n } from "@/i18n";
import { pageWindow } from "@/os";
import icon from "@/scripts/icon";
import { me, isSignedIn } from "@/me";

const props = defineProps<{
	note: entities.Note;
	pinned?: boolean;
	canOpenServerInfo?: boolean;
}>();

const showTicker =
	defaultStore.state.instanceTicker === "always" ||
	(defaultStore.state.instanceTicker === "remote" && props.note.user.instance);

function openServerInfo() {
	if (!props.canOpenServerInfo || !defaultStore.state.openServerInfo) return;
	if (props.note.user.host != null && !isSignedIn(me)) return;

	const instanceInfoUrl =
		props.note.user.host == null
			? "/about"
			: `/instance-info/${props.note.user.host}`;
	pageWindow(instanceInfoUrl);
}
</script>

<style lang="scss" scoped>
.kkwtjztg {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	white-space: nowrap;
	justify-self: flex-end;
	border-radius: 100px;
	font-size: 0.8em;
	text-shadow: 0 2px 2px var(--shadow);
	width: 100%;
	> .avatar {
		inline-size: 3.7em;
		block-size: 3.7em;
		margin-inline-end: 1em;
	}
	> .user-info {
		inline-size: 0;
		flex-grow: 1;
		line-height: 1.5;
		display: flex;
		font-size: 1.2em;
		> div {
			&:first-child {
				flex-grow: 1;
				inline-size: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				gap: 0.1em 0;
			}
			&:last-child {
				max-inline-size: 50%;
				gap: 0.3em 0.5em;
			}
			.article > .main & {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				&:last-child {
					align-items: flex-end;
				}
				> * {
					max-inline-size: 100%;
				}
			}
		}
		.name {
			// flex: 1 1 0px;
			display: inline;
			margin-block-start: 0;
			margin-inline-end: 0.5em;
			margin-block-end: 0;
			margin-inline-start: 0;
			padding: 0;
			overflow: hidden;
			font-weight: bold;
			text-decoration: none;
			text-overflow: ellipsis;

			.mkusername > .is-bot {
				flex-shrink: 0;
				align-self: center;
				margin-block-start: 0;
				margin-inline-end: 0.5em;
				margin-block-end: 0;
				margin-inline-start: 0;
				padding-block: 1px;
				padding-inline: 6px;
				font-size: 80%;
				border: solid 0.5px var(--divider);
				border-radius: 3px;
			}

			&:hover {
				text-decoration: underline;
			}
		}

		.username {
			display: inline;
			margin-block-start: 0;
			margin-inline-end: 0.5em;
			margin-block-end: 0;
			margin-inline-start: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			align-self: flex-start;
			font-size: 0.9em;
		}

		.info {
			display: inline-flex;
			flex-shrink: 0;
			margin-inline-start: 0.5em;
			font-size: 0.9em;
			.created-at {
				max-inline-size: 100%;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.ticker {
			display: inline-flex;
			margin-inline-start: 0.5em;
			vertical-align: middle;
			> .name {
				display: none;
			}
		}
	}
}
</style>
