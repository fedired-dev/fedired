<template>
	<div
		ref="rootEl"
		class="swhvrteh _popup _shadow"
		:style="{ zIndex }"
		@contextmenu.prevent="() => {}"
	>
		<ol v-if="type === 'user'" ref="suggests" class="users">
			<li
				v-for="user in users"
				tabindex="-1"
				class="user"
				@click="complete(type, user)"
				@keydown="onKeydown"
			>
				<img class="avatar" :src="user.avatarUrl" />
				<span class="name">
					<MkUserName :key="user.id" :user="user" />
				</span>
				<span class="username">@{{ acct.toString(user) }}</span>
			</li>
			<li
				tabindex="-1"
				class="choose"
				@click="chooseUser()"
				@keydown="onKeydown"
			>
				{{ i18n.ts.selectUser }}
			</li>
		</ol>
		<ol v-else-if="hashtags.length > 0" ref="suggests" class="hashtags">
			<li
				v-for="hashtag in hashtags"
				tabindex="-1"
				@click="complete(type, hashtag)"
				@keydown="onKeydown"
			>
				<span class="name">{{ hashtag }}</span>
			</li>
		</ol>
		<ol v-else-if="emojis.length > 0" ref="suggests" class="emojis">
			<li
				v-for="emoji in emojis"
				tabindex="-1"
				@click="complete(type, emoji.emoji)"
				@keydown="onKeydown"
			>
				<span v-if="emoji.isCustomEmoji" class="emoji"
					><img
						:src="
							defaultStore.state.disableShowingAnimatedImages
								? getStaticImageUrl(emoji.url)
								: emoji.url
						"
						:alt="emoji.emoji"
				/></span>
				<span
					v-else-if="!defaultStore.state.useOsNativeEmojis"
					class="emoji"
					><img :src="emoji.url" :alt="emoji.emoji"
				/></span>
				<span v-else class="emoji">{{ emoji.emoji }}</span>
				<span
					class="name"
					v-html="q ? emoji.name.replace(q, `<b>${q}</b>`) : emoji.name"
				></span>
				<span v-if="emoji.aliasOf" class="alias"
					>({{ emoji.aliasOf }})</span
				>
			</li>
		</ol>
		<ol v-else-if="mfmTags.length > 0" ref="suggests" class="mfmTags">
			<li
				v-for="tag in mfmTags"
				tabindex="-1"
				@click="complete(type, tag)"
				@keydown="onKeydown"
			>
				<span class="tag">{{ tag }}</span>
			</li>
		</ol>
	</div>
</template>

<script lang="ts">
import {
	markRaw,
	nextTick,
	onBeforeUnmount,
	onMounted,
	onUpdated,
	ref,
	watch,
} from "vue";
import { acct } from "fedired-js";
import contains from "@/scripts/contains";
import { char2filePath } from "@/scripts/twemoji-base";
import { getStaticImageUrl } from "@/scripts/get-static-image-url";
import * as os from "@/os";
import { MFM_TAGS } from "@/scripts/mfm-tags";
import { defaultStore } from "@/store";
import { addSkinTone, emojilist } from "@/scripts/emojilist";
import { getInstanceInfo } from "@/instance";
import { i18n } from "@/i18n";

interface EmojiDef {
	emoji: string;
	name: string;
	aliasOf?: string;
	url: string;
	isCustomEmoji?: boolean;
}

const lib = emojilist.filter((x) => x.category !== "flags");

for (const emoji of lib) {
	if (emoji.skin_tone_support) {
		emoji.emoji = addSkinTone(emoji.emoji);
	}
}

const emjdb: EmojiDef[] = lib.map((x) => ({
	emoji: x.emoji,
	name: x.slug,
	url: char2filePath(x.emoji),
}));

for (const x of lib) {
	if (x.keywords) {
		for (const k of x.keywords) {
			emjdb.push({
				emoji: x.emoji,
				name: k,
				aliasOf: x.slug,
				url: char2filePath(x.emoji),
			});
		}
	}
}

emjdb.sort((a, b) => a.name.length - b.name.length);

// #region Construct Emoji DB
const customEmojis = getInstanceInfo().emojis;
const emojiDefinitions: EmojiDef[] = [];

for (const x of customEmojis) {
	emojiDefinitions.push({
		name: x.name,
		emoji: `:${x.name}:`,
		url: x.url,
		isCustomEmoji: true,
	});

	if (x.aliases) {
		for (const alias of x.aliases) {
			emojiDefinitions.push({
				name: alias,
				aliasOf: x.name,
				emoji: `:${x.name}:`,
				url: x.url,
				isCustomEmoji: true,
			});
		}
	}
}

emojiDefinitions.sort((a, b) => a.name.length - b.name.length);

const emojiDb = markRaw(emojiDefinitions.concat(emjdb));
// #endregion

export default {
	emojiDb,
	emojiDefinitions,
	emojilist,
	customEmojis,
};
</script>

<script lang="ts" setup>
const props = defineProps<{
	type: string;
	q: string | null;
	textarea: HTMLTextAreaElement | HTMLInputElement;
	close: () => void;
	x: number;
	y: number;
}>();

const emit = defineEmits<{
	(event: "done", value: { type: string; value: any }): void;
	(event: "closed"): void;
}>();

const suggests = ref<Element>();
const rootEl = ref<HTMLDivElement>();

const fetching = ref(true);
const users = ref<any[]>([]);
const hashtags = ref<any[]>([]);
const emojis = ref<EmojiDef[]>([]);
const items = ref<Element[] | HTMLCollection>([]);
const mfmTags = ref<string[]>([]);
const select = ref(-1);
const zIndex = os.claimZIndex("high");

function complete(type: string, value: any) {
	emit("done", { type, value });
	emit("closed");
	if (type === "emoji") {
		let recents = defaultStore.state.recentlyUsedEmojis;
		recents = recents.filter((emoji: any) => emoji !== value);
		recents.unshift(value);
		defaultStore.set("recentlyUsedEmojis", recents.splice(0, 32));
	}
}

function setPosition() {
	if (!rootEl.value) return;
	if (props.x + rootEl.value.offsetWidth > window.innerWidth) {
		rootEl.value.style.left =
			window.innerWidth - rootEl.value.offsetWidth + "px";
	} else {
		rootEl.value.style.left = `${props.x}px`;
	}
	if (props.y + rootEl.value.offsetHeight > window.innerHeight) {
		rootEl.value.style.top = props.y - rootEl.value.offsetHeight + "px";
		rootEl.value.style.marginBlockStart = "0";
	} else {
		rootEl.value.style.top = props.y + "px";
		rootEl.value.style.marginBlockStart = "calc(1em + 8px)";
	}
}

function exec() {
	select.value = -1;
	if (suggests.value) {
		for (const el of Array.from(items.value)) {
			el.removeAttribute("data-selected");
		}
	}
	if (props.type === "user") {
		if (!props.q) {
			users.value = [];
			fetching.value = false;
			return;
		}

		const cacheKey = `autocomplete:user:${props.q}`;
		const cache = sessionStorage.getItem(cacheKey);

		if (cache) {
			users.value = JSON.parse(cache);
			fetching.value = false;
		} else {
			os.api("users/search-by-username-and-host", {
				username: props.q,
				limit: 10,
				detail: false,
			}).then((searchedUsers) => {
				users.value = searchedUsers as any[];
				fetching.value = false;
				// キャッシュ
				sessionStorage.setItem(cacheKey, JSON.stringify(searchedUsers));
			});
		}
	} else if (props.type === "hashtag") {
		if (!props.q || props.q === "") {
			hashtags.value = JSON.parse(
				localStorage.getItem("hashtags") || "[]",
			);
			fetching.value = false;
		} else {
			const cacheKey = `autocomplete:hashtag:${props.q}`;
			const cache = sessionStorage.getItem(cacheKey);
			if (cache) {
				const hashtags = JSON.parse(cache);
				hashtags.value = hashtags;
				fetching.value = false;
			} else {
				os.api("hashtags/search", {
					query: props.q,
					limit: 30,
				}).then((searchedHashtags) => {
					hashtags.value = searchedHashtags as any[];
					fetching.value = false;
					// キャッシュ
					sessionStorage.setItem(
						cacheKey,
						JSON.stringify(searchedHashtags),
					);
				});
			}
		}
	} else if (props.type === "emoji") {
		if (!props.q || props.q === "") {
			// 最近使った絵文字をサジェスト
			emojis.value = defaultStore.state.recentlyUsedEmojis
				.map((emoji) =>
					emojiDb.find((dbEmoji) => dbEmoji.emoji === emoji),
				)
				.filter((x) => x) as EmojiDef[];
			return;
		}

		const matched: EmojiDef[] = [];
		const max = 30;

		emojiDb.some((x) => {
			if (
				x.name.startsWith(props.q ?? "") &&
				!x.aliasOf &&
				!matched.some((y) => y.emoji === x.emoji)
			)
				matched.push(x);
			return matched.length === max;
		});

		if (matched.length < max) {
			emojiDb.some((x) => {
				if (
					x.name.startsWith(props.q ?? "") &&
					!matched.some((y) => y.emoji === x.emoji)
				)
					matched.push(x);
				return matched.length === max;
			});
		}

		if (matched.length < max) {
			emojiDb.some((x) => {
				if (
					x.name.includes(props.q ?? "") &&
					!matched.some((y) => y.emoji === x.emoji)
				)
					matched.push(x);
				return matched.length === max;
			});
		}

		emojis.value = matched;
	} else if (props.type === "mfmTag") {
		if (!props.q || props.q === "") {
			mfmTags.value = MFM_TAGS;
			return;
		}

		mfmTags.value = MFM_TAGS.filter((tag) => tag.startsWith(props.q ?? ""));
	}
}

function onMousedown(event: Event) {
	if (!contains(rootEl.value, event.target) && rootEl.value !== event.target)
		props.close();
}

function onKeydown(event: KeyboardEvent) {
	const cancel = () => {
		event.preventDefault();
		event.stopPropagation();
	};

	switch (event.key) {
		case "Enter":
			if (select.value !== -1) {
				cancel();
				(items.value[select.value] as any).click();
			} else {
				props.close();
			}
			break;

		case "Escape":
			cancel();
			props.close();
			break;

		case "ArrowUp":
			if (select.value !== -1) {
				cancel();
				selectPrev();
			} else {
				props.close();
			}
			break;

		case "Tab":
		case "ArrowDown":
			cancel();
			selectNext();
			break;

		default:
			event.stopPropagation();
			props.textarea.focus();
	}
}

function selectNext() {
	if (++select.value >= items.value.length) select.value = 0;
	if (items.value.length === 0) select.value = -1;
	applySelect();
}

function selectPrev() {
	if (--select.value < 0) select.value = items.value.length - 1;
	applySelect();
}

function applySelect() {
	for (const el of Array.from(items.value)) {
		el.removeAttribute("data-selected");
	}

	if (select.value !== -1) {
		items.value[select.value].setAttribute("data-selected", "true");
		(items.value[select.value] as any).focus();
	}
}

function chooseUser() {
	props.close();
	os.selectUser().then((user) => {
		complete("user", user);
		props.textarea.focus();
	});
}

onUpdated(() => {
	setPosition();
	items.value = suggests.value?.children ?? [];
});

onMounted(() => {
	setPosition();

	(props.textarea as HTMLTextAreaElement).addEventListener("keydown", onKeydown);
	document.body.addEventListener("mousedown", onMousedown);

	nextTick(() => {
		exec();

		watch(
			() => props.q,
			() => {
				nextTick(() => {
					exec();
				});
			},
		);
	});
});

onBeforeUnmount(() => {
	(props.textarea as HTMLTextAreaElement).removeEventListener("keydown", onKeydown);
	document.body.removeEventListener("mousedown", onMousedown);
});
</script>

<style lang="scss" scoped>
.swhvrteh {
	position: fixed;
	max-inline-size: 100%;
	margin-block-start: calc(1em + 8px);
	overflow: hidden;
	transition:
		top 0.1s ease,
		left 0.1s ease;

	> ol {
		display: block;
		margin: 0;
		padding-block: 4px;
		padding-inline: 0;
		max-block-size: 190px;
		max-inline-size: 500px;
		overflow: auto;
		list-style: none;

		> li {
			display: flex;
			align-items: center;
			padding-block: 4px;
			padding-inline: 12px;
			white-space: nowrap;
			overflow: hidden;
			font-size: 0.9em;
			cursor: default;

			&,
			* {
				user-select: none;
			}

			* {
				overflow: hidden;
				text-overflow: ellipsis;
			}

			&:hover {
				background: var(--X3);
			}

			&[data-selected="true"] {
				background: var(--accent);

				&,
				* {
					color: #fff !important;
				}
			}

			&:active {
				background: var(--accentDarken);

				&,
				* {
					color: #fff !important;
				}
			}
		}
	}

	> .users > li {
		.avatar {
			min-inline-size: 28px;
			min-block-size: 28px;
			max-inline-size: 28px;
			max-block-size: 28px;
			margin-block-start: 0;
			margin-inline-end: 8px;
			margin-block-end: 0;
			margin-inline-start: 0;
			border-radius: 100%;
		}

		.name {
			margin-block-start: 0;
			margin-inline-end: 8px;
			margin-block-end: 0;
			margin-inline-start: 0;
		}
	}

	> .emojis > li {
		.emoji {
			display: inline-block;
			margin-block-start: 0;
			margin-inline-end: 4px;
			margin-block-end: 0;
			margin-inline-start: 0;
			inline-size: 24px;

			> img {
				inline-size: 24px;
				vertical-align: bottom;
			}
		}

		.alias {
			margin-block-start: 0;
			margin-inline-end: 0;
			margin-block-end: 0;
			margin-inline-start: 8px;
		}
	}

	> .mfmTags > li {
		.name {
		}
	}
}
</style>
