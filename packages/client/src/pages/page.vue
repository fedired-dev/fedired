<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="800">
			<transition
				:name="defaultStore.state.animation ? 'fade' : ''"
				mode="out-in"
			>
				<div
					v-if="page"
					:key="page.id"
					v-size="{ max: [450] }"
					class="xcukqgmh"
				>
					<div class="footer">
						<div>
							<i :class="icon('ph-alarm', false)" />
							{{ i18n.ts.createdAt }}:
							<MkTime :time="page.createdAt" mode="detail" />
						</div>
						<div v-if="page.createdAt != page.updatedAt">
							<i :class="icon('ph-alarm', false)"></i>
							{{ i18n.ts.updatedAt }}:
							<MkTime :time="page.updatedAt" mode="detail" />
						</div>
					</div>
					<div class="_block main">
						<div class="banner">
							<div class="banner-image">
								<div class="header">
									<h1>{{ page.title }}</h1>
								</div>
								<div class="menu-actions">
									<button
										v-tooltip="i18n.ts.copyUrl"
										class="menu _button"
										@click="copyUrl"
									>
										<i :class="icon('ph-link-simple')" />
									</button>
									<MkA
										v-tooltip="i18n.ts._pages.viewSource"
										:to="`/@${username}/pages/${pageName}/view-source`"
										class="menu _button"
										><i :class="icon('ph-code')"
									/></MkA>
									<template
										v-if="
											isSignedIn(me) && me.id === page.userId
										"
									>
										<MkA
											v-tooltip="i18n.ts._pages.editPage"
											class="menu _button"
											:to="`/pages/edit/${page.id}`"
											><i :class="icon('ph-pencil')"
										/></MkA>
										<button
											v-if="me.pinnedPageId === page.id"
											v-tooltip="i18n.ts.unpin"
											class="menu _button"
											@click="pin(false)"
										>
											<i
												:class="
													icon('ph-push-pin-slash')
												"
											/>
										</button>
										<button
											v-else
											v-tooltip="i18n.ts.pin"
											class="menu _button"
											@click="pin(true)"
										>
											<i :class="icon('ph-push-pin')" />
										</button>
									</template>
								</div>
							</div>
						</div>
						<div class="content">
							<XPage :page="page" />
						</div>
						<div class="actions">
							<div class="like">
								<MkButton
									v-if="page.isLiked"
									v-tooltip="i18n.ts._pages.unlike"
									class="button"
									primary
									@click="unlike()"
									><i class="ph-heart ph-fill"></i
									><span
										v-if="page.likedCount > 0"
										class="count"
										>{{ page.likedCount }}</span
									></MkButton
								>
								<MkButton
									v-else
									v-tooltip="i18n.ts._pages.like"
									class="button"
									@click="like()"
									><i :class="icon('ph-heart', false)"></i
									><span
										v-if="page.likedCount > 0"
										class="count"
										>{{ page.likedCount }}</span
									></MkButton
								>
							</div>
							<div class="other">
								<button
									v-tooltip="i18n.ts.shareWithNote"
									v-click-anime
									class="_button"
									@click="shareWithNote"
								>
									<i
										:class="icon('ph-rocket-launch ph-fw')"
									></i>
								</button>
								<button
									v-if="shareAvailable()"
									v-tooltip="i18n.ts.share"
									v-click-anime
									class="_button"
									@click="share"
								>
									<i
										:class="icon('ph-share-network ph-fw')"
									></i>
								</button>
							</div>
							<div class="user">
       <MkAvatar :user="page.user" class="avatar" />
       <div class="name">
           <MkUserName :user="page.user" style="display: block" /> 
           <MkAcct :user="page.user" />
       </div>
       <MkFollowButton
           v-if="!me || me.id != page.user.id"
           :user="page.user"
           :inline="true"
           :transparent="false"
           :full="true"
           class="koudoku"
       />
   </div>
						</div>
						<!-- <div class="links">
						<MkA :to="`/@${username}/pages/${pageName}/view-source`" class="link">{{ i18n.ts._pages.viewSource }}</MkA>
						<template v-if="isSignedIn(me) && me.id === page.userId">
							<MkA :to="`/pages/edit/${page.id}`" class="link">{{ i18n.ts._pages.editThisPage }}</MkA>
							<button v-if="me.pinnedPageId === page.id" class="link _textButton" @click="pin(false)">{{ i18n.ts.unpin }}</button>
							<button v-else class="link _textButton" @click="pin(true)">{{ i18n.ts.pin }}</button>
						</template>
					</div> -->
					</div>
					<MkAd :prefer="['inline', 'inline-big']" />
					<MkContainer
						:max-height="300"
						:foldable="true"
						:expanded="false"
						class="other"
					>
						<template #header
							><i :class="icon('ph-clock')"></i>
							{{ i18n.ts.recentPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="otherPostsPagination"
						>
							<MkPagePreview
								v-for="page in items"
								:key="page.id"
								:page="page"
								class="_gap"
							/>
						</MkPagination>
					</MkContainer>
				</div>
				<MkError v-else-if="error" @retry="fetchPage()" />
				<MkLoading v-else />
			</transition>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import XPage from "@/components/page/page.vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { url } from "@/config";
import MkFollowButton from "@/components/MkFollowButton.vue";
import MkContainer from "@/components/MkContainer.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkPagePreview from "@/components/MkPagePreview.vue";
import { i18n } from "@/i18n";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { definePageMetadata } from "@/scripts/page-metadata";
import { shareAvailable } from "@/scripts/share-available";
import { defaultStore } from "@/store";
import icon from "@/scripts/icon";
import { isSignedIn, me } from "@/me";

const props = defineProps<{
	pageName: string;
	username: string;
}>();

const page = ref(null);
const bgImg = ref(null);
const error = ref(null);
const otherPostsPagination = {
	endpoint: "users/pages" as const,
	limit: 6,
	params: computed(() => ({
		userId: page.value.user.id,
	})),
};
const path = computed(() => props.username + "/" + props.pageName);

function fetchPage() {
	page.value = null;
	os.api("pages/show", {
		name: props.pageName,
		username: props.username,
	})
		.then((_page) => {
			page.value = _page;
			bgImg.value = getBgImg();
		})
		.catch((err) => {
			error.value = err;
		});
}

function copyUrl() {
	copyToClipboard(window.location.href);
	os.success();
}

function getBgImg(): string {
	if (page.value.eyeCatchingImage != null) {
		return `url(${page.value.eyeCatchingImage.url})`;
	} else {
		return "linear-gradient(to bottom right, #31748f, #9ccfd8)";
	}
}

function share() {
	navigator.share({
		title: page.value.title ?? page.value.name,
		text: page.value.summary,
		url: `${url}/@${page.value.user.username}/pages/${page.value.name}`,
	});
}

function shareWithNote() {
	os.post({
		initialText: `${page.value.title || page.value.name} ${url}/@${
			page.value.user.username
		}/pages/${page.value.name}`,
	});
}

function like() {
	os.api("pages/like", {
		pageId: page.value.id,
	}).then(() => {
		page.value.isLiked = true;
		page.value.likedCount++;
	});
}

async function unlike() {
	os.api("pages/unlike", {
		pageId: page.value.id,
	}).then(() => {
		page.value.isLiked = false;
		page.value.likedCount--;
	});
}

function pin(pin) {
	os.apiWithDialog("i/update", {
		pinnedPageId: pin ? page.value.id : null,
	});
}

watch(() => path.value, fetchPage, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(
	computed(() =>
		page.value
			? {
					title: computed(() => page.value.title || page.value.name),
					avatar: page.value.user,
					path: `/@${page.value.user.username}/pages/${page.value.name}`,
					share: {
						title: page.value.title || page.value.name,
						text: page.value.summary,
					},
				}
			: null,
	),
);

console.log('User data:', page.user);
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.xcukqgmh {
	> .main {
		> * {
			margin: 1rem;
		}

		> .banner {
			margin: 0rem !important;

			> .banner-image {
				// TODO: 良い感じのアスペクト比で表示
				display: block;
				inline-size: 100%;
				block-size: 150px;
				background-position: center;
				background-size: cover;
				background-image: v-bind("bgImg");

				> .header {
					padding: 16px;

					> h1 {
						margin: 0;
						color: white;
						text-shadow: 0 0 8px var(--shadow);
					}
				}

				> .menu-actions {
					-webkit-backdrop-filter: var(--blur, blur(8px));
					backdrop-filter: var(--blur, blur(8px));
					background: rgba(0, 0, 0, 0.2);
					padding: 8px;
					border-radius: 24px;
					inline-size: fit-content;
					position: relative;
					inset-block-start: -10px;
					inset-inline-start: 1rem;

					> .menu {
						vertical-align: bottom;
						block-size: 31px;
						inline-size: 31px;
						color: #fff;
						text-shadow: 0 0 8px var(--shadow);
						font-size: 16px;
						display: inline-flex;
					}

					> .koudoku {
						margin-inline-start: 4px;
						vertical-align: bottom;
					}
				}
			}
		}

		> .content {
			padding-block: 16px;
			padding-inline: 0;
		}

		> .actions {
			display: flex;
			align-items: center;
			margin-block-start: 16px;
			padding-block: 16px;
			padding-inline: 0;
			border-block-start: solid 0.5px var(--divider);

			> .like {
				> .button {
					--accent: #eb6f92;
					--X8: #eb6f92;
					--buttonBg: rgb(216 71 106 / 5%);
					--buttonHoverBg: rgb(216 71 106 / 10%);
					color: #eb6f92;

					::v-deep(.count) {
						margin-inline-start: 0.5em;
					}
				}
			}

			> .other {
				> button {
					padding: 2px;
					margin-block: 0;
					margin-inline: 8px;

					&:hover {
						color: var(--fgHighlighted);
					}
				}
			}

			> .user {
				margin-inline-start: auto;
				display: flex;
				align-items: center;

				> .avatar {
					inline-size: 40px;
					block-size: 40px;
				}

				> .name {
					margin-block-start: 0;
					margin-inline-end: 0;
					margin-block-end: 0;
					margin-inline-start: 12px;
					font-size: 90%;
				}

				> .koudoku {
					margin-inline-start: auto;
					margin: 1rem;
				}
			}
		}

		> .links {
			margin-block-start: 16px;
			padding-block: 14px;
			padding-inline: 0;
			border-block-start: solid 0.5px var(--divider);

			> .link {
				margin-inline-end: 2em;
			}
		}
	}

	> .footer {
		margin-block-start: var(--margin);
		margin-inline-end: 0;
		margin-block-end: var(--margin);
		margin-inline-start: 0;
		font-size: 85%;
		opacity: 0.75;
	}
}
</style>

