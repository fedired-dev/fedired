<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<div style="overflow: clip">
			<MkSpacer :content-max="600" :margin-min="20">
				<div class="_formRoot znqjceqz">
					<div id="debug"></div>
					<div
						ref="containerEl"
						v-panel
						class="_formBlock about"
						:class="{ playing: easterEggEngine != null }"
					>
						<img
							src="/client-assets/about-icon.png"
							alt=""
							class="icon"
							draggable="false"
							@load="iconLoaded"
							@click="gravity"
						/>
						<div class="misskey">Fedired</div>
						<div class="version">v{{ version }}</div>
						<span
							v-for="emoji in easterEggEmojis"
							:key="emoji.id"
							class="emoji"
							:data-physics-x="emoji.left"
							:data-physics-y="emoji.top"
							:class="{
								_physics_circle_: !emoji.emoji.startsWith(':'),
							}"
						>
							<MkEmoji
								class="emoji"
								:emoji="emoji.emoji"
								:custom-emojis="instanceEmojis"
								:is-reaction="false"
								:normal="true"
								:no-style="true"
							/>
						</span>
					</div>
					<div class="_formBlock" style="text-align: center">
						{{ i18n.ts._aboutFedired.about }}<br /><a
							href="https://about.fedired.com/"
							target="_blank"
							class="_link"
							>{{ i18n.ts.learnMore }}</a
						>
					</div>
					<div class="_formBlock" style="text-align: center">
						<MkButton primary rounded inline @click="iLoveMisskey"
							>I <Mfm text="$[jelly ❤]" /> #Fedired</MkButton
						>
					</div>
					<FormSection>
						<div class="_formLinks">
							<FormLink
								to="https://github.com/fedired-dev/fedired"
								external
							>
								<template #icon
									><i :class="icon('ph-code')"></i
								></template>
								{{ i18n.ts._aboutFedired.source }}
								<template #suffix>Source Code</template>
							</FormLink>
							<FormLink
								to="https://crowdin.com/project/fedired/"
								external
							>
								<template #icon
									><i :class="icon('ph-translate')"></i
								></template>
								{{ i18n.ts._aboutFedired.translation }}
								<template #suffix>Translate</template>
							</FormLink>
							<FormLink
								to="https://patreon.com/fedired/"
								external
							>
								<template #icon>
									<i :class="icon('ph-heart')"></i> 
									</template>
								Donar
								<template #suffix>Donation</template>
							</FormLink>
						</div>
					</FormSection>
					<FormSection>
						<template #label>Hecho por</template>
						<div class="contributors">
							<div class="contributor" v-for="contributor in contributors" :key="contributor.username">
								<a :href="contributor.link" target="_blank" class="_contributor">
									<img :src="contributor.avatar" class="contributorAvatar" />
									<span class="contributorUsername">{{ contributor.username }}</span>
								</a>
							</div>
						</div>
					</FormSection>
				</div>
			</MkSpacer>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { version } from "@/config";
import FormLink from "@/components/form/link.vue";
import FormSection from "@/components/form/section.vue";
import MkButton from "@/components/MkButton.vue";
import { physics } from "@/scripts/physics";
import { i18n } from "@/i18n";
import { defaultReactions, defaultStore } from "@/store";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";
import { getInstanceInfo } from "@/instance";
let easterEggReady = false;
const easterEggEmojis = ref([]);
const easterEggEngine = ref(null);
const containerEl = ref<HTMLElement>();
const instanceEmojis = getInstanceInfo().emojis;
function iconLoaded() {
	const emojis =
		defaultStore.state.reactions.length > 0
			? defaultStore.state.reactions
			: defaultReactions;
	const containerWidth = containerEl.value?.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.value.push({
			id: i.toString(),
			top: -(128 + Math.random() * 256),
			left: Math.random() * containerWidth,
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}
	nextTick(() => {
		easterEggReady = true;
	});
}
function gravity() {
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine.value = physics(containerEl.value);
}
function iLoveMisskey() {
	os.post({
		initialText: "I $[jelly ❤] #Fedired",
		instant: true,
	});
}
onBeforeUnmount(() => {
	if (easterEggEngine.value) {
		easterEggEngine.value.stop();
	}
});
const headerActions = computed(() => []);
const headerTabs = computed(() => []);
definePageMetadata({
	title: i18n.ts.aboutFedired,
	icon: null,
});
const contributors = [
	{ username: '@srnovus', link: 'https://fedired.com/@srnovus', avatar: 'https://avatars.githubusercontent.com/u/81489497?v=4' },
	{ username: '@ibootech', link: 'https://fedired.com/@ibootech', avatar: 'https://about.fedired.com/storage/2024/10/iboo.png' },
	{ username: '@joshua', link: 'https://fedired.com/@joshua', avatar: 'https://static.vecteezy.com/system/resources/previews/008/442/086/non_2x/illustration-of-human-icon-user-symbol-icon-modern-design-on-blank-background-free-vector.jpg' },
];
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		text-align: center;
		padding: 16px;
		border-radius: var(--radius);
		> .icon {
			display: block;
			width: 80px; // 
			margin: 0 auto;
			border-radius: 16px;
			position: relative;
			z-index: 1;
		}
		> .misskey {
			margin: 0.75em auto 0 auto;
			width: max-content;
			position: relative;
			z-index: 1;
		}
		> .version {
			margin: 0 auto;
			width: max-content;
			opacity: 0.5;
			position: relative;
			z-index: 1;
		}
		> .emoji {
			position: absolute;
			z-index: 1;
			top: 0;
			left: 0;
			visibility: hidden;
			> .emoji {
				pointer-events: none;
				font-size: 24px;
				width: 24px;
			}
		}
		&.playing {
			&,
			* {
				user-select: none;
			}
			* {
				will-change: transform;
			}
			> .emoji {
				visibility: visible;
			}
		}
	}
}
// Estilos para la sección "Hecho por"
._formLinks {
	display: flex;
	flex-direction: column; // Cambia a fila si prefieres
	align-items: center; // Centra los elementos
	margin-top: 16px; // Espaciado superior
	a {
		display: flex;
		align-items: center; // Alinea verticalmente el contenido
		text-decoration: none; // Elimina el subrayado
		color: inherit; // Hereda el color del texto
		background: var(--MI_THEME-buttonBg); // Fondo del cuadro
		border-radius: 8px; // Bordes redondeados
		padding: 12px; // Espaciado interno
		margin: 8px 0; // Espaciado entre contribuyentes
		width: 100%; // Ancho completo
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); // Sombra para el efecto de elevación
		transition: transform 0.2s, box-shadow 0.2s; // Transición suave
		&:hover {
			transform: translateY(-2px); // Efecto de elevación al pasar el mouse
			box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); // Sombra más intensa al pasar el mouse
		}
		img {
			width: 50px; // Ajusta el tamaño de la imagen
			height: 50px; // Ajusta el tamaño de la imagen
			border-radius: 50%; // Hace que la imagen sea circular
			margin-right: 12px; // Espaciado a la derecha de la imagen
		}
		span {
			font-size: 18px; // Tamaño de fuente para el nombre de usuario
			font-weight: bold; // Negrita para el nombre de usuario
			color: var(--MI_THEME-textColor); // Color del texto
		}
	}
}
.contributors {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); // Cuadrícula responsiva
	gap: 16px; // Espaciado entre los cuadros
	.contributor {
		display: flex;
		align-items: center;
		padding: 12px;
		background: var(--MI_THEME-buttonBg); // Fondo del cuadro
		border-radius: 8px; // Bordes redondeados
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // Sombra para el efecto de elevación
		transition: background 0.3s; // Transición suave
		&:hover {
			background: var(--MI_THEME-buttonHoverBg); // Cambio de fondo al pasar el mouse
		}
		a {
			display: flex;
			align-items: center;
			text-decoration: none; // Elimina el subrayado
			color: inherit; // Hereda el color del texto
			img {
				width: 40px; // Ajusta el tamaño de la imagen
				height: 40px; // Ajusta el tamaño de la imagen
				border-radius: 50%; // Hace que la imagen sea circular
				margin-right: 8px; // Espaciado a la derecha de la imagen
			}
			span {
				font-size: 16px; // Tamaño de fuente para el nombre de usuario
				font-weight: bold; // Negrita para el nombre de usuario
			}
		}
	}
}
.contributorAvatar {
	width: 30px;
	border-radius: 100%;
}
.contributorUsername {
	margin-left: 12px;
}
</style>
