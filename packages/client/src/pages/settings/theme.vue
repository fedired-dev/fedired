<template>
	<div class="_formRoot rsljpzjq">
		<div v-adaptive-border class="rfqxtzch _panel _formBlock">
			<div class="toggle">
				<div class="toggleWrapper">
					<input
						id="dn"
						v-model="darkMode"
						type="checkbox"
						class="dn"
					/>
					<label for="dn" class="toggle">
						<span class="before">{{ i18n.ts.light }}</span>
						<span class="after">{{ i18n.ts.dark }}</span>
						<span class="toggle__handler">
							<span class="crater crater--1"></span>
							<span class="crater crater--2"></span>
							<span class="crater crater--3"></span>
						</span>
						<span class="star star--1"></span>
						<span class="star star--2"></span>
						<span class="star star--3"></span>
						<span class="star star--4"></span>
						<span class="star star--5"></span>
						<span class="star star--6"></span>
					</label>
				</div>
			</div>
			<div class="sync">
				<FormSwitch v-model="syncDeviceDarkMode">{{
					i18n.ts.syncDeviceDarkMode
				}}</FormSwitch>
			</div>
		</div>

		<div class="selects _formBlock">
			<FormSelect v-model="lightThemeId" large class="select">
				<template #label>{{ i18n.ts.themeForLightMode }}</template>
				<template #prefix><i :class="icon('ph-sun')"></i></template>
				<option
					v-if="instanceLightTheme"
					:key="'instance:' + instanceLightTheme.id"
					:value="instanceLightTheme.id"
				>
					{{ instanceLightTheme.name }}
				</option>
				<optgroup
					v-if="installedLightThemes.length > 0"
					:label="i18n.ts._theme.installedThemes"
				>
					<option
						v-for="x in installedLightThemes"
						:key="'installed:' + x.id"
						:value="x.id"
					>
						{{ x.name }}
					</option>
				</optgroup>
				<optgroup :label="i18n.ts._theme.builtinThemes">
					<option
						v-for="x in builtinLightThemes"
						:key="'builtin:' + x.id"
						:value="x.id"
					>
						{{ x.name }}
					</option>
				</optgroup>
			</FormSelect>
			<FormSelect v-model="darkThemeId" large class="select">
				<template #label>{{ i18n.ts.themeForDarkMode }}</template>
				<template #prefix><i :class="icon('ph-moon')"></i></template>
				<option
					v-if="instanceDarkTheme"
					:key="'instance:' + instanceDarkTheme.id"
					:value="instanceDarkTheme.id"
				>
					{{ instanceDarkTheme.name }}
				</option>
				<optgroup
					v-if="installedDarkThemes.length > 0"
					:label="i18n.ts._theme.installedThemes"
				>
					<option
						v-for="x in installedDarkThemes"
						:key="'installed:' + x.id"
						:value="x.id"
					>
						{{ x.name }}
					</option>
				</optgroup>
				<optgroup :label="i18n.ts._theme.builtinThemes">
					<option
						v-for="x in builtinDarkThemes"
						:key="'builtin:' + x.id"
						:value="x.id"
					>
						{{ x.name }}
					</option>
				</optgroup>
			</FormSelect>
		</div>

		<FormSection>
			<div class="_formLinksGrid">
				<FormLink to="/settings/theme/manage"
					><template #icon
						><i :class="icon('ph-folder-notch-open')"></i></template
					>{{ i18n.ts._theme.manage
					}}<template #suffix>{{ themesCount }}</template></FormLink
				>
				<!-- <FormLink to="https://assets.misskey.io/theme/list" external
					><template #icon
						><i :class="icon('ph-planet')"></i></template
					>{{ i18n.ts._theme.explore }}</FormLink
				> -->
				<FormLink to="/settings/theme/install"
					><template #icon
						><i :class="icon('ph-download-simple')"></i></template
					>{{ i18n.ts._theme.install }}</FormLink
				>
				<FormLink to="/theme-editor"
					><template #icon
						><i :class="icon('ph-paint-brush-broad')"></i></template
					>{{ i18n.ts._theme.make }}</FormLink
				>
			</div>
		</FormSection>
		<FormSection>
			<FormLink to="/settings/custom-css" class="_formBlock"
				><template #icon><i :class="icon('ph-code')"></i></template
				>{{ i18n.ts.customCss }}</FormLink
			>
		</FormSection>

		<FormButton
			v-if="wallpaper == null"
			class="_formBlock"
			@click="setWallpaper"
			>{{ i18n.ts.setWallpaper }}</FormButton
		>
		<FormButton v-else class="_formBlock" @click="wallpaper = null">{{
			i18n.ts.removeWallpaper
		}}</FormButton>
	</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, ref, watch } from "vue";
import JSON5 from "json5";
import FormSwitch from "@/components/form/switch.vue";
import FormSelect from "@/components/form/select.vue";
import FormSection from "@/components/form/section.vue";
import FormLink from "@/components/form/link.vue";
import FormButton from "@/components/MkButton.vue";
import { getBuiltinThemesRef } from "@/scripts/theme";
import { selectFile } from "@/scripts/select-file";
import { isDeviceDarkmode } from "@/scripts/is-device-darkmode";
import { ColdDeviceStorage, defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { getInstanceInfo } from "@/instance";
import { uniqueBy } from "@/scripts/array";
import { fetchThemes, getThemes } from "@/theme-store";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const installedThemes = ref(getThemes());
const builtinThemes = getBuiltinThemesRef();
const { defaultDarkTheme, defaultLightTheme } = getInstanceInfo();

const instanceDarkTheme = computed(() =>
	defaultDarkTheme ? JSON5.parse(defaultDarkTheme) : null,
);
const installedDarkThemes = computed(() =>
	installedThemes.value.filter((t) => t.base === "dark" || t.kind === "dark"),
);
const builtinDarkThemes = computed(() =>
	builtinThemes.value.filter((t) => t.base === "dark" || t.kind === "dark"),
);
const instanceLightTheme = computed(() =>
	defaultLightTheme ? JSON5.parse(defaultLightTheme) : null,
);
const installedLightThemes = computed(() =>
	installedThemes.value.filter((t) => t.base === "light" || t.kind === "light"),
);
const builtinLightThemes = computed(() =>
	builtinThemes.value.filter((t) => t.base === "light" || t.kind === "light"),
);
const themes = computed(() =>
	uniqueBy(
		[
			instanceDarkTheme.value,
			instanceLightTheme.value,
			...builtinThemes.value,
			...installedThemes.value,
		].filter((x) => x != null),
		(theme) => theme.id,
	),
);

const darkTheme = ColdDeviceStorage.ref("darkTheme");
const darkThemeId = computed({
	get() {
		return darkTheme.value.id;
	},
	set(id) {
		const t = themes.value.find((x) => x.id === id);
		if (t) {
			// テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			ColdDeviceStorage.set("darkTheme", t);
		}
	},
});
const lightTheme = ColdDeviceStorage.ref("lightTheme");
const lightThemeId = computed({
	get() {
		return lightTheme.value.id;
	},
	set(id) {
		const t = themes.value.find((x) => x.id === id);
		if (t) {
			// テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			ColdDeviceStorage.set("lightTheme", t);
		}
	},
});
const darkMode = computed(defaultStore.makeGetterSetter("darkMode"));
const syncDeviceDarkMode = computed(
	ColdDeviceStorage.makeGetterSetter("syncDeviceDarkMode"),
);
const wallpaper = ref(localStorage.getItem("wallpaper"));
const themesCount = installedThemes.value.length;

watch(syncDeviceDarkMode, () => {
	if (syncDeviceDarkMode.value) {
		defaultStore.set("darkMode", isDeviceDarkmode());
	}
});

watch(wallpaper, () => {
	if (wallpaper.value == null) {
		localStorage.removeItem("wallpaper");
	} else {
		localStorage.setItem("wallpaper", wallpaper.value);
	}
	location.reload();
});

onActivated(() => {
	fetchThemes().then(() => {
		installedThemes.value = getThemes();
	});
});

fetchThemes().then(() => {
	installedThemes.value = getThemes();
});

function setWallpaper(event) {
	selectFile(event.currentTarget ?? event.target, null).then((file) => {
		wallpaper.value = file.url;
	});
}

definePageMetadata({
	title: i18n.ts.theme,
	icon: `${icon("ph-palette")}`,
});
</script>

<style lang="scss" scoped>
.rfqxtzch {
	border-radius: 6px;

	> .toggle {
		position: relative;
		padding-block: 26px;
		padding-inline: 0;
		text-align: center;

		&.disabled {
			opacity: 0.7;

			&,
			* {
				cursor: not-allowed !important;
			}
		}

		> .toggleWrapper {
			display: inline-block;
			text-align: start;
			padding-block: 0;
			padding-inline: 100px;
			vertical-align: bottom;

			input {
				position: absolute;
				inset-inline-start: -99em;
			}

			&:focus-within > .toggle {
				outline: auto;
			}
		}

		.toggle {
			cursor: pointer;
			display: inline-block;
			position: relative;
			inline-size: 90px;
			block-size: 50px;
			background-color: #83d8ff;
			border-radius: 90px - 6;
			transition: background-color 200ms
				cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;

			> .before,
			> .after {
				position: absolute;
				inset-block-start: 15px;
				transition: color 1s ease;
			}

			> .before {
				inset-inline-start: -70px;
				color: var(--accent);
			}

			> .after {
				inset-inline-end: -68px;
				color: var(--fg);
			}
		}

		.toggle__handler {
			display: inline-block;
			position: relative;
			z-index: 1;
			inset-block-start: 3px;
			inset-inline-start: 3px;
			inline-size: 50px - 6;
			block-size: 50px - 6;
			background-color: #ffcf96;
			border-radius: 50px;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
			transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
			transform: rotate(-45deg);

			.crater {
				position: absolute;
				background-color: #e8cda5;
				opacity: 0;
				transition: opacity 200ms ease-in-out !important;
				border-radius: 100%;
			}

			.crater--1 {
				inset-block-start: 18px;
				inset-inline-start: 10px;
				inline-size: 4px;
				block-size: 4px;
			}

			.crater--2 {
				inset-block-start: 28px;
				inset-inline-start: 22px;
				inline-size: 6px;
				block-size: 6px;
			}

			.crater--3 {
				inset-block-start: 10px;
				inset-inline-start: 25px;
				inline-size: 8px;
				block-size: 8px;
			}
		}

		.star {
			position: absolute;
			background-color: #ffffff;
			transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
			border-radius: 50%;
		}

		.star--1 {
			inset-block-start: 10px;
			inset-inline-start: 35px;
			z-index: 0;
			inline-size: 30px;
			block-size: 3px;
		}

		.star--2 {
			inset-block-start: 18px;
			inset-inline-start: 28px;
			z-index: 1;
			inline-size: 30px;
			block-size: 3px;
		}

		.star--3 {
			inset-block-start: 27px;
			inset-inline-start: 40px;
			z-index: 0;
			inline-size: 30px;
			block-size: 3px;
		}

		.star--4,
		.star--5,
		.star--6 {
			opacity: 0;
			transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
		}

		.star--4 {
			inset-block-start: 16px;
			inset-inline-start: 11px;
			z-index: 0;
			inline-size: 2px;
			block-size: 2px;
			transform: translate3d(3px, 0, 0);
		}

		.star--5 {
			inset-block-start: 32px;
			inset-inline-start: 17px;
			z-index: 0;
			inline-size: 3px;
			block-size: 3px;
			transform: translate3d(3px, 0, 0);
		}

		.star--6 {
			inset-block-start: 36px;
			inset-inline-start: 28px;
			z-index: 0;
			inline-size: 2px;
			block-size: 2px;
			transform: translate3d(3px, 0, 0);
		}

		input:checked {
			+ .toggle {
				background-color: #749dd6;

				> .before {
					color: var(--fg);
				}

				> .after {
					color: var(--accent);
				}

				.toggle__handler {
					background-color: #ffe5b5;
					transform: translate3d(40px, 0, 0) rotate(0);

					.crater {
						opacity: 1;
					}
				}

				.star--1 {
					inline-size: 2px;
					block-size: 2px;
				}

				.star--2 {
					inline-size: 4px;
					block-size: 4px;
					transform: translate3d(-5px, 0, 0);
				}

				.star--3 {
					inline-size: 2px;
					block-size: 2px;
					transform: translate3d(-7px, 0, 0);
				}

				.star--4,
				.star--5,
				.star--6 {
					opacity: 1;
					transform: translate3d(0, 0, 0);
				}

				.star--4 {
					transition: all 300ms 200ms
						cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--5 {
					transition: all 300ms 300ms
						cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--6 {
					transition: all 300ms 400ms
						cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}
			}
		}
	}
	> .sync {
		padding-block: 14px;
		padding-inline: 16px;
		border-block-start: solid 0.5px var(--divider);
	}
}

.rsljpzjq {
	> .selects {
		display: flex;
		gap: 1.5em var(--margin);
		flex-wrap: wrap;

		> .select {
			flex: 1;
			min-inline-size: 280px;
		}
	}
}
</style>
